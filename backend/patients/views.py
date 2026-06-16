import csv
import hashlib
import operator
import time
from datetime import date
from functools import reduce
from io import BytesIO

from django.http import HttpResponse
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models as db_models
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from accounts.views import HasPermission
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from medical_records.models import MedicalRecord, AuditLog
from medical_records.serializers import MedicalRecordSerializer
from billing.models import Billing
from billing.serializers import BillingSerializer
from .models import Patient, ReferralLetter, SupportMessage, PatientTag, PatientTagAssignment
from .serializers import (
    PatientListSerializer, PatientDetailSerializer, ReferralLetterSerializer,
    SupportMessageSerializer, PatientTagSerializer, PatientTagAssignmentSerializer
)


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.live_objects().order_by('file_number')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'file_number']
    ordering_fields = ['created_at', 'first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        return PatientDetailSerializer

    def get_queryset(self):
        qs = Patient.live_objects().order_by('file_number')
        user = self.request.user
        if user.role in ('admin', 'super_support'):
            pass
        elif user.is_doctor_like:
            patient_ids = Appointment.objects.filter(
                doctor=user, status='completed'
            ).values_list('patient_id', flat=True).distinct()
            qs = qs.filter(id__in=patient_ids)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)
        tag_id = self.request.query_params.get('tag')
        if tag_id:
            qs = qs.filter(tag_assignments__tag_id=tag_id)
        return qs

    def perform_create(self, serializer):
        patient = serializer.save(created_by=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Patient',
            object_id=patient.id,
            details={'full_name': f"{patient.first_name} {patient.last_name}", 'national_id': patient.national_id[-4:] if patient.national_id else ''}
        )

    def perform_update(self, serializer):
        patient = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='Patient',
            object_id=patient.id,
            details={'full_name': f"{patient.first_name} {patient.last_name}", 'national_id': patient.national_id[-4:] if patient.national_id else ''}
        )

    def perform_destroy(self, instance):
        patient_name = f"{instance.first_name} {instance.last_name}"
        instance.soft_delete(user=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='deleted',
            model_name='Patient',
            object_id=instance.id,
            details={'full_name': patient_name, 'national_id': instance.national_id[-4:] if instance.national_id else ''}
        )

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        qs = Patient.deleted_objects().order_by('-deleted_at')
        if request.user.is_doctor_like:
            qs = qs.filter(created_by=request.user)
        elif request.user.role == 'rtms':
            qs = qs.filter(created_by=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = PatientListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = PatientListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        patient = Patient.deleted_objects().filter(id=pk).first()
        if not patient:
            return Response({'error': 'بیمار یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        patient.restore()
        AuditLog.objects.create(
            user=self.request.user,
            action='restore',
            model_name='Patient',
            object_id=patient.id,
            details={'full_name': f"{patient.first_name} {patient.last_name}"}
        )
        return Response(PatientDetailSerializer(patient).data)

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        patient = Patient.deleted_objects().filter(id=pk).first()
        if not patient:
            return Response({'error': 'بیمار یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        name = f"{patient.first_name} {patient.last_name}"
        patient.delete()
        AuditLog.objects.create(
            user=self.request.user,
            action='permanent_delete',
            model_name='Patient',
            object_id=pk,
            details={'full_name': name, 'national_id': patient.national_id[-4:] if patient.national_id else ''}
        )
        return Response({'message': 'بیمار برای همیشه حذف شد'}, status=status.HTTP_204_NO_CONTENT)

    def get_permissions(self):
        if self.action in ('restore', 'restore_all'):
            return [HasPermission('patient_restore')]
        if self.action in ('permanent_delete', 'permanent_delete_all'):
            return [HasPermission('patient_permanent_delete')]
        if self.action in ('deleted', 'all_deleted'):
            return [HasPermission('patient_deleted_view')]
        return super().get_permissions()

    @action(detail=False, methods=['post'])
    def restore_all(self, request):
        count = Patient.deleted_objects().update(is_deleted=False, deleted_at=None, deleted_by=None)
        return Response({'restored': count, 'message': f'{count} بیمار بازیابی شدند'})

    @action(detail=False, methods=['delete'])
    def permanent_delete_all(self, request):
        qs = Patient.deleted_objects()
        count = qs.count()
        qs.delete()
        return Response({'deleted': count, 'message': f'{count} بیمار برای همیشه حذف شدند'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def all_deleted(self, request):
        user = request.user
        patients_qs = Patient.deleted_objects().order_by('-deleted_at')
        if user.is_doctor_like:
            patient_ids = Appointment.objects.filter(doctor=user, status='completed').values_list('patient_id', flat=True)
            patients_qs = patients_qs.filter(id__in=patient_ids)
        elif user.role == 'rtms':
            patients_qs = patients_qs.filter(created_by=user)

        appointments_qs = Appointment.deleted_objects().select_related('patient', 'doctor', 'treatment_type').order_by('-deleted_at')
        if user.is_doctor_like:
            appointments_qs = appointments_qs.filter(doctor=user)
        elif user.role == 'rtms':
            appointments_qs = appointments_qs.filter(created_by=user)

        records_qs = MedicalRecord.deleted_objects().select_related('patient', 'doctor').order_by('-deleted_at')
        if user.is_doctor_like:
            records_qs = records_qs.filter(doctor=user)
        elif user.role == 'rtms':
            records_qs = records_qs.filter(created_by=user)

        billings_qs = Billing.deleted_objects().select_related('patient', 'doctor').order_by('-deleted_at')
        if user.is_doctor_like:
            billings_qs = billings_qs.filter(doctor=user)
        elif user.role == 'rtms':
            billings_qs = billings_qs.filter(created_by=user)

        return Response({
            'patients': PatientListSerializer(patients_qs[:50], many=True).data,
            'appointments': AppointmentSerializer(appointments_qs[:50], many=True).data,
            'medical_records': MedicalRecordSerializer(records_qs[:50], many=True).data,
            'billings': BillingSerializer(billings_qs[:50], many=True).data,
        })

    @action(detail=False, methods=['get'])
    def check_duplicate(self, request):
        national_id = request.query_params.get('national_id', '')
        first_name = request.query_params.get('first_name', '')
        last_name = request.query_params.get('last_name', '')
        file_number = request.query_params.get('file_number', '')
        patient_id = request.query_params.get('patient_id')
        q = db_models.Q()
        if national_id:
            nhash = hashlib.sha256(national_id.encode()).hexdigest()
            q |= db_models.Q(national_id_hash=nhash)
        if first_name and last_name:
            q |= db_models.Q(first_name__iexact=first_name, last_name__iexact=last_name)
        if file_number:
            q |= db_models.Q(file_number=file_number)
        if not q:
            return Response({'duplicate': False})
        patients = Patient.objects.filter(q, is_deleted=False)
        if patient_id:
            patients = patients.exclude(id=patient_id)
        return Response({'duplicate': patients.exists(), 'patients': PatientListSerializer(patients[:5], many=True).data})

    @action(detail=True, methods=['get'])
    def full_profile(self, request, pk=None):
        patient = self.get_object()
        appointments = patient.appointments.filter(is_deleted=False).order_by('-date', '-time')
        records = patient.medical_records.filter(is_deleted=False).order_by('-date')
        billings = patient.billings.filter(is_deleted=False).order_by('-created_at')
        referrals = patient.referral_letters.all().order_by('-date')

        return Response({
            'patient': PatientDetailSerializer(patient).data,
            'appointments': AppointmentSerializer(appointments[:50], many=True).data,
            'medical_records': MedicalRecordSerializer(records[:50], many=True).data,
            'billings': BillingSerializer(billings[:50], many=True).data,
            'referrals': ReferralLetterSerializer(referrals, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def search(self, request):
        q = request.query_params.get('q', '').strip()
        q = q.translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789'))
        field = request.query_params.get('field', '')
        if not q:
            return Response([])
        qs = Patient.objects.filter(is_deleted=False)
        user = self.request.user
        if user.role == 'rtms':
            qs = qs.filter(created_by=user)
        if field == 'national_id':
            nhash = hashlib.sha256(q.encode()).hexdigest()
            patients = qs.filter(national_id_hash=nhash)[:10]
        elif field == 'phone':
            phash = hashlib.sha256(q.encode()).hexdigest()
            patients = qs.filter(phone_hash=phash)[:10]
        elif field == 'file_number':
            patients = qs.filter(file_number__icontains=q)[:10]
        else:
            conditions = [
                db_models.Q(first_name__icontains=q),
                db_models.Q(last_name__icontains=q),
                db_models.Q(file_number__icontains=q),
                db_models.Q(national_id_raw__icontains=q),
                db_models.Q(phone_raw__icontains=q),
            ]
            if q.isdigit() and len(q) == 10:
                conditions.append(db_models.Q(national_id_hash=hashlib.sha256(q.encode()).hexdigest()))
            elif q.isdigit() and len(q) == 11 and q.startswith('09'):
                conditions.append(db_models.Q(phone_hash=hashlib.sha256(q.encode()).hexdigest()))
            patients = qs.filter(reduce(operator.or_, conditions))[:20]
        serializer = PatientListSerializer(patients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        q = request.query_params.get('q', '').strip()
        q = q.translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789'))
        if not q:
            return Response([])
        patients = Patient.objects.filter(
            db_models.Q(first_name__icontains=q) |
            db_models.Q(last_name__icontains=q) |
            db_models.Q(file_number__icontains=q) |
            db_models.Q(national_id_raw__icontains=q) |
            db_models.Q(phone_raw__icontains=q),
            is_deleted=False
        )
        user = self.request.user
        if user.role == 'rtms':
            patients = patients.filter(created_by=user)
        patients = patients[:15]
        return Response([{
            'id': p.id,
            'first_name': p.first_name,
            'last_name': p.last_name,
            'national_id': p.national_id,
            'phone': p.phone,
            'file_number': p.file_number,
        } for p in patients])

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="patients.csv"'
        writer = csv.writer(response)
        writer.writerow(['نام', 'نام خانوادگی', 'نام پدر', 'کد ملی', 'نوع دفترچه', 'تلفن', 'تلفن اضطراری', 'تاریخ تولد', 'اولین مراجعه', 'آدرس', 'تاریخ ثبت'])
        for p in self.get_queryset().iterator(chunk_size=200):
            writer.writerow([p.first_name, p.last_name, p.father_name, p.national_id, p.get_insurance_booklet_display(), p.phone, p.emergency_phone, str(p.birth_date or ''), str(p.first_visit_date or ''), p.address, str(p.created_at.date())])
        return response

    @action(detail=False, methods=['get'])
    def my_support_messages(self, request):
        messages = SupportMessage.objects.filter(sender=request.user)
        serializer = SupportMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        import openpyxl
        from datetime import date as dt_date

        if 'file' not in request.FILES:
            return Response({'error': 'فایل اکسل را انتخاب کنید'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded = request.FILES['file']
        if not uploaded.name.endswith(('.xlsx', '.xls')):
            return Response({'error': 'فقط فایل اکسل (xlsx/xls) مجاز است'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wb = openpyxl.load_workbook(uploaded, read_only=True)
            ws = wb.active
            rows = list(ws.iter_rows(values_only=True))
            if len(rows) < 2:
                return Response({'error': 'فایل اکسل حداقل باید یک ردیف داده داشته باشد'}, status=status.HTTP_400_BAD_REQUEST)

            header = [str(c).strip() if c else '' for c in rows[0]]
            expected = ['نام', 'نام خانوادگی', 'کد ملی', 'تلفن', 'نام پدر', 'تلفن اضطراری', 'آدرس']
            col_map = {}
            for col in expected:
                try:
                    col_map[col] = header.index(col)
                except ValueError:
                    col_map[col] = -1

            if col_map['نام'] < 0 or col_map['نام خانوادگی'] < 0:
                return Response({
                    'error': 'ستون‌های "نام" و "نام خانوادگی" الزامی هستند',
                    'header_found': header,
                }, status=status.HTTP_400_BAD_REQUEST)

            imported = 0
            skipped = 0
            errors = []
            today = dt_date.today()

            for idx, row in enumerate(rows[1:], start=2):
                try:
                    first_name = str(row[col_map['نام']] or '').strip()
                    last_name = str(row[col_map['نام خانوادگی']] or '').strip()
                    if not first_name or not last_name:
                        skipped += 1
                        continue

                    national_id = str(row[col_map['کد ملی']] or '').strip() if col_map['کد ملی'] >= 0 else ''
                    phone = str(row[col_map['تلفن']] or '').strip() if col_map['تلفن'] >= 0 else ''
                    father_name = str(row[col_map['نام پدر']] or '').strip() if col_map['نام پدر'] >= 0 else ''
                    emergency = str(row[col_map['تلفن اضطراری']] or '').strip() if col_map['تلفن اضطراری'] >= 0 else ''
                    address = str(row[col_map['آدرس']] or '').strip() if col_map['آدرس'] >= 0 else ''

                    if national_id:
                        nhash = hashlib.sha256(national_id.encode()).hexdigest()
                        if Patient.objects.filter(national_id_hash=nhash).exists():
                            skipped += 1
                            continue

                    Patient.objects.create(
                        first_name=first_name, last_name=last_name,
                        national_id=national_id or f'EXT{int(time.time() * 1000)}{idx}',
                        phone=phone or '09100000000',
                        father_name=father_name, emergency_phone=emergency,
                        address=address, first_visit_date=today,
                        created_by=request.user,
                    )
                    imported += 1
                except Exception as e:
                    errors.append({'row': idx, 'error': str(e)})

            wb.close()
            return Response({
                'success': True,
                'imported': imported,
                'skipped': skipped,
                'errors': errors,
            })
        except Exception as e:
            return Response({'error': f'خطا در خواندن فایل: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class ReferralLetterViewSet(viewsets.ModelViewSet):
    queryset = ReferralLetter.objects.select_related('patient', 'from_doctor', 'to_user').all().order_by('-date')
    serializer_class = ReferralLetterSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, from_doctor=self.request.user, date=serializer.validated_data.get('date') or date.today())

    def get_queryset(self):
        qs = ReferralLetter.objects.select_related('patient', 'from_doctor', 'to_user').all().order_by('-date')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        direction = self.request.query_params.get('direction')
        if direction == 'received':
            qs = qs.filter(to_user=self.request.user)
        elif direction == 'sent':
            qs = qs.filter(from_doctor=self.request.user)
        return qs


class SupportMessageViewSet(viewsets.ModelViewSet):
    queryset = SupportMessage.objects.select_related('patient', 'sender').all().order_by('-created_at')
    serializer_class = SupportMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('admin', 'super_support', 'support'):
            return SupportMessage.objects.select_related('patient', 'sender').all().order_by('-created_at')
        return SupportMessage.objects.filter(sender=user).order_by('-created_at')

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='SupportMessage',
            object_id=msg.id,
            details={'patient': str(msg.patient) if msg.patient else ''}
        )

    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if not data.get('patient'):
            data.pop('patient', None)
        files = request.FILES
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        if files and 'attachment' in files:
            instance.attachment = files['attachment']
            instance.save()
        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        if request.user.role not in ('admin', 'super_support', 'support'):
            return Response({'error': 'شما اجازه پاسخ به این پیام را ندارید'}, status=status.HTTP_403_FORBIDDEN)
        message = self.get_object()
        reply_text = request.data.get('reply', '')
        if not reply_text:
            return Response({'error': 'متن پاسخ نمی‌تواند خالی باشد'}, status=status.HTTP_400_BAD_REQUEST)
        message.reply = reply_text
        message.status = 'answered'
        message.replied_at = timezone.now()
        message.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='reply',
            model_name='SupportMessage',
            object_id=message.id,
            details={'patient': str(message.patient) if message.patient else ''}
        )
        serializer = SupportMessageSerializer(message)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def download_attachment(self, request, pk=None):
        message = self.get_object()
        if not message.attachment:
            return Response({'error': 'فایل ضمیمه‌ای وجود ندارد'}, status=status.HTTP_404_NOT_FOUND)
        from django.http import FileResponse
        return FileResponse(message.attachment.open(), as_attachment=True, filename=message.attachment.name.split('/')[-1])


class PatientTagViewSet(viewsets.ModelViewSet):
    queryset = PatientTag.objects.filter(is_active=True).order_by('name')
    serializer_class = PatientTagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.query_params.get('all'):
            return PatientTag.objects.all().order_by('name')
        return PatientTag.objects.filter(is_active=True).order_by('name')


class PatientTagAssignmentViewSet(viewsets.ModelViewSet):
    queryset = PatientTagAssignment.objects.select_related('patient', 'tag').all()
    serializer_class = PatientTagAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        patient_id = request.data.get('patient_id')
        tag_ids = request.data.get('tag_ids', [])
        if not patient_id:
            return Response({'error': 'شناسه بیمار وارد نشده'}, status=status.HTTP_400_BAD_REQUEST)
        existing = set(PatientTagAssignment.objects.filter(
            patient_id=patient_id
        ).values_list('tag_id', flat=True))
        new_tags = set(tag_ids) - existing
        for tag_id in new_tags:
            PatientTagAssignment.objects.create(
                patient_id=patient_id,
                tag_id=tag_id,
                created_by=request.user,
            )
        # Remove unselected
        removed = existing - set(tag_ids)
        PatientTagAssignment.objects.filter(patient_id=patient_id, tag_id__in=removed).delete()
        return Response({'message': 'برچسب‌ها با موفقیت به‌روز شدند'})

    def get_queryset(self):
        qs = PatientTagAssignment.objects.select_related('patient', 'tag').all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs
