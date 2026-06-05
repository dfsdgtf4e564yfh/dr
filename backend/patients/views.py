import csv
import time
from datetime import date
from io import BytesIO

from django.http import HttpResponse
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models as db_models
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from medical_records.models import MedicalRecord
from medical_records.serializers import MedicalRecordSerializer
from billing.models import Billing
from billing.serializers import BillingSerializer
from .models import Patient, ReferralLetter, SupportMessage
from .serializers import PatientListSerializer, PatientDetailSerializer, ReferralLetterSerializer, SupportMessageSerializer


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.live_objects().order_by('file_number')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'national_id', 'phone']
    ordering_fields = ['created_at', 'first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        return PatientDetailSerializer

    def get_queryset(self):
        qs = Patient.live_objects().order_by('file_number')
        user = self.request.user
        if user.role == 'doctor':
            patient_ids = Appointment.objects.filter(
                doctor=user, status='completed'
            ).values_list('patient_id', flat=True).distinct()
            qs = qs.filter(id__in=patient_ids)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        qs = Patient.deleted_objects().order_by('-deleted_at')
        if request.user.role == 'doctor':
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
        return Response(PatientDetailSerializer(patient).data)

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        patient = Patient.deleted_objects().filter(id=pk).first()
        if not patient:
            return Response({'error': 'بیمار یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        patient.delete()
        return Response({'message': 'بیمار برای همیشه حذف شد'}, status=status.HTTP_204_NO_CONTENT)

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
        if user.role == 'doctor':
            patient_ids = Appointment.objects.filter(doctor=user, status='completed').values_list('patient_id', flat=True)
            patients_qs = patients_qs.filter(id__in=patient_ids)
        elif user.role == 'rtms':
            patients_qs = patients_qs.filter(created_by=user)

        appointments_qs = Appointment.deleted_objects().select_related('patient', 'doctor', 'treatment_type').order_by('-deleted_at')
        if user.role == 'doctor':
            appointments_qs = appointments_qs.filter(doctor=user)
        elif user.role == 'rtms':
            appointments_qs = appointments_qs.filter(created_by=user)

        records_qs = MedicalRecord.deleted_objects().select_related('patient', 'doctor').order_by('-deleted_at')
        if user.role == 'doctor':
            records_qs = records_qs.filter(doctor=user)
        elif user.role == 'rtms':
            records_qs = records_qs.filter(created_by=user)

        billings_qs = Billing.deleted_objects().select_related('patient', 'doctor').order_by('-deleted_at')
        if user.role == 'doctor':
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
            q |= db_models.Q(national_id=national_id)
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
        q = request.query_params.get('q', '')
        field = request.query_params.get('field', '')
        if not q:
            return Response([])
        qs = self.get_queryset()
        if field == 'national_id':
            patients = qs.filter(national_id__icontains=q)[:10]
        elif field == 'phone':
            patients = qs.filter(phone__icontains=q)[:10]
        elif field == 'file_number':
            patients = qs.filter(file_number__icontains=q)[:10]
        else:
            patients = qs.filter(
                db_models.Q(first_name__icontains=q) |
                db_models.Q(last_name__icontains=q) |
                db_models.Q(phone__icontains=q) |
                db_models.Q(national_id__icontains=q) |
                db_models.Q(file_number__icontains=q)
            )[:20]
        serializer = PatientListSerializer(patients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        q = request.query_params.get('q', '')
        if not q:
            return Response([])
        patients = Patient.objects.filter(
            db_models.Q(first_name__icontains=q) |
            db_models.Q(last_name__icontains=q) |
            db_models.Q(national_id__contains=q) |
            db_models.Q(phone__contains=q) |
            db_models.Q(file_number__icontains=q),
            is_deleted=False
        ).values('id', 'first_name', 'last_name', 'national_id', 'phone', 'file_number')[:15]
        return Response(list(patients))

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

                    if national_id and Patient.objects.filter(national_id=national_id).exists():
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
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        message = self.get_object()
        reply_text = request.data.get('reply', '')
        if not reply_text:
            return Response({'error': 'متن پاسخ نمی‌تواند خالی باشد'}, status=status.HTTP_400_BAD_REQUEST)
        message.reply = reply_text
        message.status = 'answered'
        message.replied_at = timezone.now()
        message.save()
        serializer = SupportMessageSerializer(message)
        return Response(serializer.data)
