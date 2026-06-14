from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Q

from .models import Patient, PortalOTP, PatientPortalSession
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from medical_records.models import MedicalRecord
from medical_records.serializers import MedicalRecordSerializer
from billing.models import Billing
from billing.serializers import BillingSerializer
from sms_notifications.utils import send_otp


def _get_patient_from_token(request):
    token = (
        request.query_params.get('token')
        or request.data.get('token')
        or request.headers.get('X-Portal-Token')
        or request.headers.get('Authorization', '').replace('Bearer ', '')
    )
    if not token:
        return None
    try:
        session = PatientPortalSession.objects.select_related('patient').get(
            token=token, expires_at__gt=timezone.now()
        )
        return session.patient
    except PatientPortalSession.DoesNotExist:
        return None


@api_view(['POST'])
@permission_classes([AllowAny])
def portal_login(request):
    national_id = request.data.get('national_id', '').strip()
    phone = request.data.get('phone', '').strip()

    if not national_id or not phone:
        return Response(
            {'error': 'کد ملی و شماره تلفن الزامی است'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        patient = Patient.objects.get(national_id=national_id, phone=phone, is_deleted=False)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'کد ملی یا شماره تلفن اشتباه است'},
            status=status.HTTP_404_NOT_FOUND
        )

    PortalOTP.objects.filter(patient=patient, is_used=False).update(is_used=True)

    import random
    code = str(random.randint(100000, 999999))
    PortalOTP.objects.create(patient=patient, code=code)

    sms_result = send_otp(patient.phone, purpose='ورود به پرتال بیمار')
    if sms_result.get('success'):
        return Response({
            'success': True,
            'message': 'کد تایید به شماره شما ارسال شد',
        })

    PortalOTP.objects.filter(patient=patient, is_used=False).update(is_used=True)
    return Response({
        'success': False,
        'error': 'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید.',
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def portal_verify_otp(request):
    national_id = request.data.get('national_id', '').strip()
    code = request.data.get('code', '').strip()

    if not national_id or not code:
        return Response(
            {'error': 'کد ملی و کد تایید الزامی است'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        patient = Patient.objects.get(national_id=national_id, is_deleted=False)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'بیمار یافت نشد'},
            status=status.HTTP_404_NOT_FOUND
        )

    otp = PortalOTP.objects.filter(
        patient=patient, code=code, is_used=False
    ).order_by('-created_at').first()

    if not otp or not otp.is_valid():
        return Response(
            {'error': 'کد تایید نامعتبر یا منقضی شده است'},
            status=status.HTTP_400_BAD_REQUEST
        )

    otp.is_used = True
    otp.save(update_fields=['is_used'])

    PatientPortalSession.objects.filter(patient=patient, expires_at__gt=timezone.now()).update(
        expires_at=timezone.now()
    )

    session = PatientPortalSession.objects.create(patient=patient)

    return Response({
        'token': session.token,
        'patient': {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'national_id': patient.national_id,
            'phone': patient.phone,
            'emergency_phone': patient.emergency_phone,
            'address': patient.address,
            'file_number': patient.file_number,
            'birth_date': str(patient.birth_date) if patient.birth_date else None,
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def portal_appointments(request):
    patient = _get_patient_from_token(request)
    if not patient:
        return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_401_UNAUTHORIZED)

    from datetime import date
    appointments = Appointment.objects.filter(
        patient=patient, is_deleted=False,
        date__gte=date.today()
    ).select_related('doctor', 'treatment_type').order_by('date', 'time')

    return Response(AppointmentSerializer(appointments, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def portal_medical_history(request):
    patient = _get_patient_from_token(request)
    if not patient:
        return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_401_UNAUTHORIZED)

    records = MedicalRecord.objects.filter(
        patient=patient, is_deleted=False
    ).select_related('doctor').order_by('-date', '-session_number')

    return Response(MedicalRecordSerializer(records, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def portal_bills(request):
    patient = _get_patient_from_token(request)
    if not patient:
        return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_401_UNAUTHORIZED)

    bills = Billing.objects.filter(
        patient=patient, is_deleted=False
    ).select_related('doctor').order_by('-created_at')

    return Response(BillingSerializer(bills, many=True, context={'request': request}).data)


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def portal_profile(request):
    patient = _get_patient_from_token(request)
    if not patient:
        return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        return Response({
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'national_id': patient.national_id,
            'phone': patient.phone,
            'emergency_phone': patient.emergency_phone,
            'address': patient.address,
            'file_number': patient.file_number,
            'birth_date': str(patient.birth_date) if patient.birth_date else None,
        })

    phone = request.data.get('phone', '').strip()
    emergency_phone = request.data.get('emergency_phone', '').strip()
    address = request.data.get('address', '').strip()

    if phone:
        patient.phone = phone
    if emergency_phone:
        patient.emergency_phone = emergency_phone
    if address:
        patient.address = address

    patient.save(update_fields=['phone', 'emergency_phone', 'address'])

    return Response({
        'success': True,
        'message': 'اطلاعات با موفقیت به‌روز شد',
        'patient': {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'phone': patient.phone,
            'emergency_phone': patient.emergency_phone,
            'address': patient.address,
        }
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def portal_dashboard(request):
    patient = _get_patient_from_token(request)
    if not patient:
        return Response({'error': 'دسترسی غیرمجاز'}, status=status.HTTP_401_UNAUTHORIZED)

    from datetime import date
    next_appointment = Appointment.objects.filter(
        patient=patient, is_deleted=False, date__gte=date.today()
    ).select_related('doctor', 'treatment_type').order_by('date', 'time').first()

    last_record = MedicalRecord.objects.filter(
        patient=patient, is_deleted=False
    ).select_related('doctor').order_by('-date', '-session_number').first()

    bills = Billing.objects.filter(patient=patient, is_deleted=False)
    total_billed = sum(b.total_amount for b in bills if b.total_amount)
    total_paid = sum(b.paid_amount for b in bills if b.paid_amount)

    data = {
        'patient_name': f"{patient.first_name} {patient.last_name}",
        'file_number': patient.file_number,
        'next_appointment': AppointmentSerializer(next_appointment, context={'request': request}).data if next_appointment else None,
        'last_record': MedicalRecordSerializer(last_record, context={'request': request}).data if last_record else None,
        'billing_summary': {
            'total_billed': float(total_billed),
            'total_paid': float(total_paid),
            'balance': float(total_billed - total_paid),
            'bill_count': bills.count(),
        }
    }

    return Response(data)
