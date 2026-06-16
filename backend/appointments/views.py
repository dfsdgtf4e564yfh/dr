import csv
from datetime import datetime, timedelta
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Q
from accounts.views import HasPermission
from .models import Appointment
from .serializers import AppointmentSerializer, AppointmentCreateSerializer
from patients.models import Patient
from medical_records.models import AuditLog


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related(
        'patient', 'doctor', 'treatment_type'
    ).filter(is_deleted=False).order_by('-date', '-time')

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_permissions(self):
        if self.action in ('restore', 'restore_all'):
            return [HasPermission('appointment_restore')]
        if self.action in ('permanent_delete', 'permanent_delete_all'):
            return [HasPermission('appointment_permanent_delete')]
        return super().get_permissions()

    def get_queryset(self):
        qs = Appointment.objects.select_related(
            'patient', 'doctor', 'treatment_type'
        ).filter(is_deleted=False).order_by('-date', '-time')

        user = self.request.user
        if user.role in ('admin', 'super_support'):
            pass
        elif user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        doctor_id = self.request.query_params.get('doctor')
        patient_id = self.request.query_params.get('patient')
        status_filter = self.request.query_params.get('status')

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'rtms':
            patient = serializer.validated_data.get('patient')
            if patient and patient.created_by_id != user.id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('شما فقط می‌توانید برای بیماران خود نوبت ثبت کنید')
        date_val = serializer.validated_data.get('date', timezone.localdate())
        last = Appointment.objects.filter(date=date_val).order_by('-daily_number').first()
        next_num = (last.daily_number + 1) if last and last.daily_number else 1
        appointment = serializer.save(created_by=self.request.user, daily_number=next_num)
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Appointment',
            object_id=appointment.id,
            details={
                'patient': str(appointment.patient),
                'doctor': str(appointment.doctor),
                'date': str(appointment.date),
                'time': str(appointment.time),
            }
        )

    def perform_update(self, serializer):
        appointment = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='Appointment',
            object_id=appointment.id,
            details={
                'patient': str(appointment.patient),
                'doctor': str(appointment.doctor),
                'date': str(appointment.date),
            }
        )

    def perform_destroy(self, instance):
        patient_name = str(instance.patient)
        instance.soft_delete(user=self.request.user)
        for billing in instance.billings.filter(is_deleted=False):
            billing.soft_delete(user=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='deleted',
            model_name='Appointment',
            object_id=instance.id,
            details={'patient': patient_name, 'date': str(instance.date)}
        )

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        qs = Appointment.objects.filter(is_deleted=True).select_related('patient', 'doctor', 'treatment_type').order_by('-deleted_at')
        user = request.user
        if user.role in ('admin', 'super_support'):
            pass
        elif user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = AppointmentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = AppointmentSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        appointment = Appointment.objects.filter(id=pk, is_deleted=True).first()
        if not appointment:
            return Response({'error': 'نوبت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        appointment.restore()
        AuditLog.objects.create(
            user=self.request.user,
            action='restore',
            model_name='Appointment',
            object_id=appointment.id,
            details={'patient': str(appointment.patient), 'date': str(appointment.date)}
        )
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        appointment = Appointment.objects.filter(id=pk, is_deleted=True).first()
        if not appointment:
            return Response({'error': 'نوبت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        patient_name = str(appointment.patient)
        appointment.delete()
        AuditLog.objects.create(
            user=self.request.user,
            action='permanent_delete',
            model_name='Appointment',
            object_id=pk,
            details={'patient': patient_name, 'date': str(appointment.date)}
        )
        return Response({'message': 'نوبت برای همیشه حذف شد'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def patient_grouped(self, request):
        from billing.models import Billing

        base_qs = Appointment.objects.select_related(
            'patient', 'doctor', 'treatment_type'
        ).filter(is_deleted=False)

        user = request.user
        if user.is_doctor_like:
            base_qs = base_qs.filter(doctor=user)
        elif user.role == 'rtms':
            base_qs = base_qs.filter(created_by=user)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        doctor_id = request.query_params.get('doctor')
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search')

        filtered_qs = base_qs
        if date_from:
            filtered_qs = filtered_qs.filter(date__gte=date_from)
        if date_to:
            filtered_qs = filtered_qs.filter(date__lte=date_to)
        if doctor_id:
            filtered_qs = filtered_qs.filter(doctor_id=doctor_id)
        if status_filter:
            filtered_qs = filtered_qs.filter(status=status_filter)
        if search:
            filtered_qs = filtered_qs.filter(
                Q(patient__first_name__icontains=search) |
                Q(patient__last_name__icontains=search) |
                Q(patient__national_id__icontains=search)
            )

        patient_ids = list(filtered_qs.values_list('patient_id', flat=True).distinct())
        if not patient_ids:
            return Response([])

        all_appts = base_qs.filter(patient_id__in=patient_ids).order_by('patient_id', 'date', 'time')

        grouped = {}
        for appt in all_appts:
            pid = appt.patient_id
            if pid not in grouped:
                grouped[pid] = {
                    'patient_id': pid,
                    'patient_name': f"{appt.patient.first_name} {appt.patient.last_name}",
                    'patient_national_id': appt.patient.national_id,
                    'patient_file_number': appt.patient.file_number or '',
                    'patient_phone': appt.patient.phone,
                    'appointments': [],
                }
            grouped[pid]['appointments'].append(AppointmentSerializer(appt).data)

        billing_agg = Billing.objects.filter(
            patient_id__in=patient_ids, is_deleted=False
        ).values('patient_id').annotate(
            total_billed=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
        )
        billing_map = {b['patient_id']: b for b in billing_agg}

        result = []
        for pid, group in grouped.items():
            b = billing_map.get(pid, {})
            total_cost = sum(
                (int(a.get('cost') or 0) + int(a.get('service_cost') or 0))
                for a in group['appointments']
            )
            group['total_cost'] = total_cost
            group['total_billed'] = b.get('total_billed') or 0
            group['total_paid'] = b.get('total_paid') or 0
            group['balance'] = group['total_billed'] - group['total_paid']
            result.append(group)

        return Response(result)

    @action(detail=False, methods=['post'])
    def restore_all(self, request):
        count = Appointment.objects.filter(is_deleted=True).update(is_deleted=False, deleted_at=None, deleted_by=None)
        return Response({'restored': count, 'message': f'{count} نوبت بازیابی شدند'})

    @action(detail=False, methods=['delete'])
    def permanent_delete_all(self, request):
        qs = Appointment.objects.filter(is_deleted=True)
        count = qs.count()
        qs.delete()
        return Response({'deleted': count, 'message': f'{count} نوبت برای همیشه حذف شدند'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        appointments = self.get_queryset().filter(date=today)
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                return Response({'error': 'فرمت تاریخ نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            date = timezone.localdate()

        week_start = date - timedelta(days=(date.weekday() - 5) % 7)
        week_end = week_start + timedelta(days=6)

        appointments = self.get_queryset().filter(date__gte=week_start, date__lte=week_end)
        serializer = AppointmentSerializer(appointments, many=True)
        return Response({
            'week_start': week_start.isoformat(),
            'week_end': week_end.isoformat(),
            'appointments': serializer.data,
        })

    @action(detail=True, methods=['get'])
    def record_info(self, request, pk=None):
        appointment = self.get_object()
        from medical_records.models import MedicalRecord
        last_session = MedicalRecord.objects.filter(
            patient=appointment.patient,
            doctor=appointment.doctor
        ).order_by('-session_number').first()
        next_session = (last_session.session_number + 1) if last_session else 1
        return Response({
            'patient': appointment.patient.id,
            'patient_name': f"{appointment.patient.first_name} {appointment.patient.last_name}",
            'national_id': appointment.patient.national_id,
            'phone': appointment.patient.phone,
            'doctor': appointment.doctor.id,
            'appointment': appointment.id,
            'date': appointment.date.isoformat(),
            'session_number': next_session,
            'treatment_name': appointment.treatment_type.name if appointment.treatment_type else '',
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'cancelled'
        appointment.save()
        for billing in appointment.billings.filter(is_deleted=False):
            billing.soft_delete(user=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='cancel',
            model_name='Appointment',
            object_id=appointment.id,
            details={'patient': str(appointment.patient), 'date': str(appointment.date)}
        )
        return Response({'message': 'نوبت با موفقیت لغو شد'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'completed'
        appointment.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='complete',
            model_name='Appointment',
            object_id=appointment.id,
            details={'patient': str(appointment.patient), 'date': str(appointment.date)}
        )
        return Response({'message': 'نوبت با موفقیت انجام شد'})

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        from billing.models import Billing
        appointment = self.get_object()
        amount = request.data.get('amount', 0)
        payment_method = request.data.get('payment_method', 'cash')
        receipt_number = request.data.get('receipt_number', '')

        billing = Billing.objects.filter(
            appointment=appointment, is_deleted=False
        ).first()
        if not billing:
            return Response({'error': 'صورتحسابی برای این نوبت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        remaining = int(amount)
        due = billing.total_amount - billing.paid_amount

        if remaining > due:
            return Response({
                'error': f'مبلغ پرداختی بیشتر از بدهی ({due:,} تومان) است'
            }, status=status.HTTP_400_BAD_REQUEST)

        billing.paid_amount += remaining
        billing.payment_method = payment_method
        if receipt_number:
            billing.receipt_number = receipt_number
        billing.save()

        new_due = billing.total_amount - billing.paid_amount
        return Response({
            'paid': remaining,
            'total_amount': billing.total_amount,
            'paid_amount': billing.paid_amount,
            'remaining': new_due,
            'status': billing.status,
            'settled': new_due == 0,
        })

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        old_date = str(appointment.date)
        old_time = str(appointment.time)
        new_date = request.data.get('date')
        new_time = request.data.get('time')
        if new_date:
            appointment.date = new_date
        if new_time:
            appointment.time = new_time
        appointment.status = 'rescheduled'
        appointment.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='reschedule',
            model_name='Appointment',
            object_id=appointment.id,
            details={
                'patient': str(appointment.patient),
                'old_date': old_date,
                'old_time': old_time,
                'new_date': str(appointment.date),
                'new_time': str(appointment.time),
            }
        )
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def waiting_list(self, request):
        today = timezone.localdate()
        today_apps = self.get_queryset().filter(date=today, status='scheduled').order_by('time')
        past_pending = self.get_queryset().filter(date__lt=today, status='scheduled').order_by('date', 'time')
        return Response({
            'today': AppointmentSerializer(today_apps, many=True).data,
            'past_pending': AppointmentSerializer(past_pending, many=True).data,
        })

    @action(detail=False, methods=['post'])
    def online_import(self, request):
        national_id = request.data.get('national_id', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        phone = request.data.get('phone', '').strip()
        date_str = request.data.get('date', '').strip()
        time_str = request.data.get('time', '').strip()
        doctor_id = request.data.get('doctor')
        source = request.data.get('source', 'external').strip()
        external_id = request.data.get('external_id', '').strip()

        if not all([first_name, last_name, date_str, time_str, doctor_id]):
            return Response({'error': 'نام، نام خانوادگی، تاریخ، ساعت و پزشک الزامی است'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            apt_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            apt_time = datetime.strptime(time_str, '%H:%M').time()
        except ValueError:
            return Response({'error': 'فرمت تاریخ (YYYY-MM-DD) یا ساعت (HH:MM) نامعتبر'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        if apt_date < today:
            return Response({'error': 'تاریخ نوبت نمی‌تواند در گذشته باشد'}, status=status.HTTP_400_BAD_REQUEST)

        patient = None
        created_patient = False
        if national_id:
            nhash = hashlib.sha256(national_id.encode()).hexdigest()
            patient = Patient.objects.filter(national_id_hash=nhash).first()
        if not patient and phone:
            phash = hashlib.sha256(phone.encode()).hexdigest()
            patient = Patient.objects.filter(phone_hash=phash).first()
        if not patient:
            try:
                patient = Patient.objects.create(
                    first_name=first_name, last_name=last_name,
                    national_id=national_id or f'EXT{int(__import__("time").time())}',
                    phone=phone or '09100000000',
                    first_visit_date=today,
                    created_by=request.user,
                )
                created_patient = True
            except Exception as e:
                return Response({'error': f'خطا در ایجاد بیمار: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        conflict = Appointment.objects.filter(
            doctor_id=doctor_id, date=apt_date, time=apt_time, status__in=['scheduled', 'rescheduled']
        ).exclude(status='cancelled').first()
        if conflict:
            return Response({
                'error': 'تداخل زمانی! در این تاریخ و ساعت نوبت دیگری وجود دارد',
                'conflict': {
                    'patient': f"{conflict.patient.first_name} {conflict.patient.last_name}",
                    'appointment_id': conflict.id,
                }
            }, status=status.HTTP_409_CONFLICT)

        duplicate = Appointment.objects.filter(
            patient=patient, doctor_id=doctor_id, date=apt_date, time=apt_time
        ).exclude(status='cancelled').first()
        if duplicate:
            return Response({
                'error': 'این بیمار در این تاریخ و ساعت نوبت تکراری دارد',
                'duplicate': {'appointment_id': duplicate.id},
            }, status=status.HTTP_409_CONFLICT)

        appointment = Appointment.objects.create(
            patient=patient, doctor_id=doctor_id,
            treatment_type_id=request.data.get('treatment_type', 1),
            date=apt_date, time=apt_time,
            cost=request.data.get('cost', 0),
            notes=request.data.get('notes', ''),
            source=source, external_id=external_id,
            created_by=request.user,
        )

        return Response({
            'success': True,
            'appointment_id': appointment.id,
            'patient_id': patient.id,
            'created_patient': created_patient,
            'patient_name': f"{patient.first_name} {patient.last_name}",
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def report(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        doctor_id = request.query_params.get('doctor')
        patient_id = request.query_params.get('patient')
        status_filter = request.query_params.get('status')

        qs = self.get_queryset()
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if status_filter:
            qs = qs.filter(status=status_filter)

        total = qs.count()
        by_status = {}
        for s, _ in Appointment.STATUS_CHOICES:
            by_status[s] = qs.filter(status=s).count()

        serializer = AppointmentSerializer(qs.order_by('-date', '-time'), many=True)
        return Response({
            'total': total,
            'by_status': by_status,
            'appointments': serializer.data,
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def public_book(self, request):
        phone = request.data.get('phone', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        national_id = request.data.get('national_id', '').strip()
        doctor_id = request.data.get('doctor')
        treatment_type_id = request.data.get('treatment_type')
        date = request.data.get('date')
        time = request.data.get('time')

        if not all([first_name, last_name, national_id, phone, doctor_id, treatment_type_id, date, time]):
            return Response({'error': 'همه فیلدهای اجباری پر شوند'}, status=status.HTTP_400_BAD_REQUEST)

        conflict = Appointment.objects.filter(
            doctor_id=doctor_id, treatment_type_id=treatment_type_id,
            date=date, time=time,
        ).exclude(status='cancelled').first()
        if conflict:
            return Response({'error': 'این زمان قبلاً رزرو شده است'}, status=status.HTTP_409_CONFLICT)

        patient, _ = Patient.objects.get_or_create(
            national_id=national_id,
            defaults={'first_name': first_name, 'last_name': last_name, 'phone': phone}
        )

        serializer = AppointmentCreateSerializer(data={
            'patient': patient.id, 'doctor': doctor_id,
            'treatment_type': treatment_type_id, 'date': date, 'time': time,
            'status': 'scheduled', 'notes': 'نوبت آنلاین',
        })
        if serializer.is_valid():
            serializer.save(created_by=None)
            return Response({'message': 'نوبت با موفقیت ثبت شد', 'patient_id': patient.id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="appointments.csv"'
        writer = csv.writer(response)
        writer.writerow(['بیمار', 'پزشک', 'نوع درمان', 'تاریخ', 'ساعت', 'وضعیت', 'یادداشت', 'تاریخ ثبت'])
        for a in self.get_queryset().iterator(chunk_size=200):
            writer.writerow([str(a.patient), a.doctor.get_full_name(), a.treatment_type.name if a.treatment_type else '', str(a.date), str(a.time), a.status, a.notes or '', str(a.created_at.date())])
        return response
