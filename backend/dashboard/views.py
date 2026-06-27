from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Q
from utils.jalali import gregorian_to_jalali_year
from patients.models import Patient
from appointments.models import Appointment
from billing.models import Billing
from medical_records.models import MedicalRecord
from .models import Notification
from .serializers import NotificationSerializer


def _can_view_income(user):
    return 'dashboard_income' in user.page_permissions or user.role == 'admin'


def _get_patients_for_doctor(user):
    if user.is_doctor_like:
        from appointments.models import Appointment
        patient_ids = Appointment.objects.filter(
            doctor=user, status='completed'
        ).values_list('patient_id', flat=True).distinct()
        return Patient.objects.filter(id__in=patient_ids)
    elif user.role == 'rtms':
        return Patient.objects.filter(created_by__role='rtms')
    return Patient.objects


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    today = timezone.localdate()
    first_of_month = today.replace(day=1)
    first_of_year = today.replace(month=1, day=1)

    patients_qs = _get_patients_for_doctor(user)
    if user.role == 'rtms':
        appointments_qs = Appointment.objects.filter(created_by__role='rtms', is_deleted=False)
    elif user.is_doctor_like:
        appointments_qs = Appointment.objects.filter(doctor=user, is_deleted=False)
    else:
        appointments_qs = Appointment.objects.filter(is_deleted=False)

    total_patients = patients_qs.count()
    patients_this_month = patients_qs.filter(created_at__date__gte=first_of_month).count()
    patients_this_year = patients_qs.filter(created_at__date__gte=first_of_year).count()

    today_appointments = appointments_qs.filter(date=today).count()
    today_completed = appointments_qs.filter(date=today, status='completed').count()

    resp = {
        'total_patients': total_patients,
        'patients_this_month': patients_this_month,
        'patients_this_year': patients_this_year,
        'today_appointments': today_appointments,
        'today_completed': today_completed,
    }

    if _can_view_income(user):
        billing_qs = Billing.objects.filter(doctor=user) if user.is_doctor_like else Billing.objects
        pending_billings = billing_qs.filter(
            Q(status='pending') | Q(status='partial')
        ).aggregate(s=Sum('total_amount'))['s'] or 0
        total_paid = billing_qs.filter(status='paid').aggregate(s=Sum('paid_amount'))['s'] or 0
        monthly_income = billing_qs.filter(
            created_at__date__gte=first_of_month
        ).aggregate(s=Sum('total_amount'))['s'] or 0
        yearly_income = billing_qs.filter(
            created_at__date__gte=first_of_year
        ).aggregate(s=Sum('total_amount'))['s'] or 0
        resp.update({
            'pending_billings': pending_billings,
            'total_paid': total_paid,
            'monthly_income': monthly_income,
            'yearly_income': yearly_income,
        })
    else:
        resp.update({
            'pending_billings': 0,
            'total_paid': 0,
            'monthly_income': 0,
            'yearly_income': 0,
        })

    # Additional metrics for enhanced dashboard
    if _can_view_income(user):
        from billing.models import Settlement
        settlement_qs = Settlement.objects.filter(doctor=user) if user.is_doctor_like else Settlement.objects
        total_settled = settlement_qs.aggregate(s=Sum('amount'))['s'] or 0
        resp['total_settled'] = total_settled
        resp['net_income'] = total_paid - total_settled

    # Appointment completion rate
    total_appointments = appointments_qs.count()
    completed_appointments = appointments_qs.filter(status='completed').count()
    resp['appointment_completion_rate'] = round(
        (completed_appointments / total_appointments * 100), 1
    ) if total_appointments > 0 else 0

    return Response(resp)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def monthly_income_chart(request):
    user = request.user
    if not _can_view_income(user):
        return Response([])

    today = timezone.localdate()
    year = int(request.query_params.get('year', today.year))
    billing_qs = Billing.objects.filter(doctor=user) if user.is_doctor_like else Billing.objects

    monthly_data = []
    for month in range(1, 13):
        total = billing_qs.filter(
            created_at__date__year=year,
            created_at__date__month=month
        ).aggregate(s=Sum('total_amount'))['s'] or 0
        paid = billing_qs.filter(
            created_at__date__year=year,
            created_at__date__month=month
        ).aggregate(s=Sum('paid_amount'))['s'] or 0
        monthly_data.append({
            'month': month,
            'total': total,
            'paid': paid,
        })

    return Response(monthly_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_income_pie(request):
    user = request.user
    if not _can_view_income(user):
        return Response([])

    from django.contrib.auth import get_user_model
    from billing.models import Billing
    User = get_user_model()

    if user.is_doctor_like:
        total = Billing.objects.filter(doctor=user).aggregate(s=Sum('doctor_share'))['s'] or 0
        return Response([{'name': user.get_full_name(), 'value': total}] if total > 0 else [])

    doctors = User.objects.filter(role__in=['doctor', 'psychologist', 'rtms'])
    data = []
    for doctor in doctors:
        total = Billing.objects.filter(doctor=doctor).aggregate(s=Sum('doctor_share'))['s'] or 0
        if total > 0:
            data.append({
                'name': doctor.get_full_name(),
                'value': total,
            })
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def patients_trend(request):
    user = request.user
    today = timezone.localdate()
    days = int(request.query_params.get('days', 30))
    start_date = today - timedelta(days=days)

    patients_qs = _get_patients_for_doctor(user)

    data = []
    from datetime import timedelta as td
    current = start_date
    while current <= today:
        count = patients_qs.filter(created_at__date=current).count()
        if count > 0:
            data.append({
                'date': current.isoformat(),
                'count': count,
            })
        current += td(days=1)

    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def alerts(request):
    user = request.user
    today = timezone.localdate()

    unpaid = Billing.objects.filter(
        Q(status='pending') | Q(status='partial')
    )
    if user.is_doctor_like:
        unpaid = unpaid.filter(doctor=user)
    elif user.role == 'rtms':
        unpaid = unpaid.filter(created_by__role='rtms')
    unpaid = unpaid.select_related('patient').order_by('-total_amount')[:10]

    if user.role == 'rtms':
        appointment_qs = Appointment.objects.filter(created_by__role='rtms')
    elif user.is_doctor_like:
        appointment_qs = Appointment.objects.filter(doctor=user)
    else:
        appointment_qs = Appointment.objects
    today_apps = appointment_qs.filter(
        date=today, status='scheduled'
    ).select_related('patient', 'doctor', 'treatment_type')

    return Response({
        'unpaid_billings': [
            {
                'id': b.id,
                'patient_name': f"{b.patient.first_name} {b.patient.last_name}",
                'amount': b.total_amount,
                'paid': b.paid_amount,
                'status': b.status,
            }
            for b in unpaid
        ],
        'today_appointments': [
            {
                'id': a.id,
                'patient_name': f"{a.patient.first_name} {a.patient.last_name}",
                'time': a.time.strftime('%H:%M'),
                'doctor_name': a.doctor.get_full_name(),
                'treatment': a.treatment_type.name,
            }
            for a in today_apps
        ],
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notifications(request):
    user = request.user
    today = timezone.localdate()
    week_later = today + timedelta(days=7)

    if user.role == 'rtms':
        appointment_qs = Appointment.objects.filter(created_by__role='rtms')
        billing_qs = Billing.objects.filter(created_by__role='rtms')
    elif user.is_doctor_like:
        appointment_qs = Appointment.objects.filter(doctor=user)
        billing_qs = Billing.objects.filter(doctor=user)
    else:
        appointment_qs = Appointment.objects
        billing_qs = Billing.objects

    today_apps = appointment_qs.filter(date=today).select_related('patient', 'doctor', 'treatment_type')
    today_scheduled = today_apps.filter(status='scheduled').count()
    today_completed = today_apps.filter(status='completed').count()
    today_cancelled = today_apps.filter(status='cancelled').count()

    upcoming_apps = appointment_qs.filter(
        date__gte=today, date__lte=week_later, status='scheduled'
    ).select_related('patient', 'doctor', 'treatment_type').order_by('date', 'time')[:10]

    unpaid = billing_qs.filter(
        Q(status='pending') | Q(status='partial')
    ).select_related('patient').order_by('-total_amount')[:10]

    from medical_records.models import AuditLog, TmsForm
    logs = AuditLog.objects.select_related('user').all().order_by('-timestamp')[:20]

    week_appointments = appointment_qs.filter(
        date__gte=today, date__lte=week_later
    ).select_related('patient', 'doctor').order_by('date', 'time')

    stored_notifications = Notification.objects.filter(user=user)[:20]

    today_tms = TmsForm.objects.filter(date=today).select_related('patient', 'doctor')
    upcoming_tms = TmsForm.objects.filter(
        date__gte=today, date__lte=week_later
    ).select_related('patient', 'doctor').order_by('date')[:10]

    return Response({
        'today_summary': {
            'scheduled': today_scheduled,
            'completed': today_completed,
            'cancelled': today_cancelled,
            'total': today_apps.count(),
        },
        'today_appointments': [
            {
                'id': a.id,
                'patient_name': f"{a.patient.first_name} {a.patient.last_name}",
                'time': a.time.strftime('%H:%M'),
                'doctor_name': a.doctor.get_full_name(),
                'treatment': a.treatment_type.name,
                'status': a.status,
                'notes': a.notes,
            }
            for a in today_apps
        ],
        'upcoming_appointments': [
            {
                'id': a.id,
                'patient_name': f"{a.patient.first_name} {a.patient.last_name}",
                'time': a.time.strftime('%H:%M'),
                'date': a.date.isoformat(),
                'doctor_name': a.doctor.get_full_name(),
                'treatment': a.treatment_type.name,
            }
            for a in upcoming_apps
        ],
        'unpaid_billings': [
            {
                'id': b.id,
                'patient_name': f"{b.patient.first_name} {b.patient.last_name}",
                'amount': b.total_amount,
                'remaining': b.total_amount - b.paid_amount,
                'status': b.status,
            }
            for b in unpaid
        ],
        'recent_logs': [
            {
                'id': l.id,
                'user': f"{l.user.first_name} {l.user.last_name}" if l.user else 'سیستم',
                'action': l.action,
                'model_name': l.model_name,
                'details': l.details,
                'timestamp': l.timestamp.isoformat(),
            }
            for l in logs
        ],
        'reminders': [
            {
                'id': a.id,
                'patient_name': f"{a.patient.first_name} {a.patient.last_name}",
                'date': a.date.isoformat(),
                'time': a.time.strftime('%H:%M'),
                'doctor_name': a.doctor.get_full_name(),
            }
            for a in week_appointments if a.notes.strip()
        ],
        'stored_notifications': NotificationSerializer(stored_notifications, many=True).data,
        'today_tms': [
            {
                'id': t.id,
                'patient_name': f"{t.patient.first_name} {t.patient.last_name}",
                'doctor_name': t.doctor.get_full_name(),
                'session_count': len(t.sessions) if isinstance(t.sessions, list) else 0,
                'protocol': t.protocol1[:60] if t.protocol1 else '',
            }
            for t in today_tms
        ],
        'upcoming_tms': [
            {
                'id': t.id,
                'patient_name': f"{t.patient.first_name} {t.patient.last_name}",
                'date': t.date.isoformat(),
                'doctor_name': t.doctor.get_full_name(),
                'session_count': len(t.sessions) if isinstance(t.sessions, list) else 0,
                'protocol': t.protocol1[:60] if t.protocol1 else '',
            }
            for t in upcoming_tms
        ],
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_notification(request):
    serializer = NotificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def work_year_info(request):
    user = request.user
    today = timezone.localdate()
    year = today.year
    first_of_year = today.replace(month=1, day=1)

    patients_qs = _get_patients_for_doctor(user)
    if user.role == 'rtms':
        appointments_qs = Appointment.objects.filter(created_by__role='rtms')
        records_qs = MedicalRecord.objects.filter(created_by__role='rtms')
    elif user.is_doctor_like:
        appointments_qs = Appointment.objects.filter(doctor=user)
        records_qs = MedicalRecord.objects.filter(doctor=user)
    else:
        appointments_qs = Appointment.objects
        records_qs = MedicalRecord.objects

    patients_count = patients_qs.filter(created_at__date__gte=first_of_year).count()
    appointments_count = appointments_qs.filter(created_at__date__gte=first_of_year).count()
    medical_records_count = records_qs.filter(created_at__date__gte=first_of_year).count()

    jy = gregorian_to_jalali_year(today.year, today.month, today.day)

    resp = {
        'year': year,
        'jalali_year': jy,
        'patients_count': patients_count,
        'appointments_count': appointments_count,
        'medical_records_count': medical_records_count,
    }

    if _can_view_income(user):
        billing_qs = Billing.objects.filter(doctor=user) if user.is_doctor_like else Billing.objects
        total_income = billing_qs.filter(created_at__date__gte=first_of_year).aggregate(s=Sum('total_amount'))['s'] or 0
        total_paid = billing_qs.filter(created_at__date__gte=first_of_year).aggregate(s=Sum('paid_amount'))['s'] or 0
        monthly_data = []
        for month in range(1, 13):
            m_patients = patients_qs.filter(created_at__date__year=year, created_at__date__month=month).count()
            m_apps = appointments_qs.filter(created_at__date__year=year, created_at__date__month=month).count()
            m_income = billing_qs.filter(created_at__date__year=year, created_at__date__month=month).aggregate(s=Sum('total_amount'))['s'] or 0
            monthly_data.append({
                'month': month,
                'patients': m_patients,
                'appointments': m_apps,
                'income': m_income,
            })
        resp.update({
            'total_income': total_income,
            'total_paid': total_paid,
            'monthly_data': monthly_data,
        })
    else:
        resp.update({
            'total_income': 0,
            'total_paid': 0,
            'monthly_data': [],
        })

    return Response(resp)
