from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.pagination import PageNumberPagination
from utils.jalali import toJalali
from .utils import (
    send_appointment_confirmation, send_appointment_reminder, send_payment_reminder,
    get_appointment_confirmation_message, get_appointment_reminder_message, get_payment_reminder_message,
    get_send_method_info,
    test_connection, get_credit, get_delivery, check_pending_deliveries, send_otp,
)
from .models import SmsTemplate, SmsLog
from .serializers import SmsTemplateSerializer, SmsLogSerializer
from appointments.models import Appointment
from patients.models import Patient
from accounts.models import ClinicSetting


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def send_confirm(request):
    if request.method == 'GET':
        appointment_id = request.query_params.get('appointment_id')
        try:
            appointment = Appointment.objects.select_related('patient', 'doctor').get(id=appointment_id)
            patient = appointment.patient
            phone = patient.phone
            if not phone:
                return Response({'error': 'شماره تماس بیمار ثبت نشده'}, status=status.HTTP_400_BAD_REQUEST)
            jalali_date = toJalali(str(appointment.date))
            message = get_appointment_confirmation_message(
                f"{patient.first_name} {patient.last_name}",
                jalali_date,
                appointment.time.strftime('%H:%M'),
                appointment.doctor.get_full_name(),
            )
            method_info = get_send_method_info('confirm')
            return Response({
                'success': True,
                'phone': phone,
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'message': message,
                'send_method': method_info,
            })
        except Appointment.DoesNotExist:
            return Response({'error': 'نوبت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    appointment_id = request.data.get('appointment_id')
    custom_message = request.data.get('message_text')
    line_number = request.data.get('line_number')
    use_pattern = request.data.get('use_pattern')
    try:
        appointment = Appointment.objects.select_related('patient', 'doctor').get(id=appointment_id)
        patient = appointment.patient
        phone = patient.phone
        if not phone:
            return Response({'error': 'شماره تماس بیمار ثبت نشده'}, status=status.HTTP_400_BAD_REQUEST)
        jalali_date = toJalali(str(appointment.date))
        result = send_appointment_confirmation(
            phone,
            f"{patient.first_name} {patient.last_name}",
            jalali_date,
            appointment.time.strftime('%H:%M'),
            appointment.doctor.get_full_name(),
            custom_message,
            line_number,
            use_pattern,
            user=request.user,
            appointment=appointment,
            patient=patient,
        )
        if result.get('success'):
            appointment.sms_sent = True
            appointment.save(update_fields=['sms_sent'])
        return Response({
            'success': result.get('success', False),
            'method': result.get('method'),
            'message': 'پیامک با موفقیت ارسال شد' if result.get('success') else result.get('error', 'خطا در ارسال پیامک'),
            'rec_id': result.get('rec_id'),
            'pattern_code': result.get('pattern_code'),
        })
    except Appointment.DoesNotExist:
        return Response({'error': 'نوبت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def send_reminder(request):
    if request.method == 'GET':
        appointment_id = request.query_params.get('appointment_id')
        try:
            appointment = Appointment.objects.select_related('patient', 'doctor').get(id=appointment_id)
            patient = appointment.patient
            phone = patient.phone
            if not phone:
                return Response({'error': 'شماره تماس بیمار ثبت نشده'}, status=status.HTTP_400_BAD_REQUEST)
            jalali_date = toJalali(str(appointment.date))
            message = get_appointment_reminder_message(
                f"{patient.first_name} {patient.last_name}",
                jalali_date,
                appointment.time.strftime('%H:%M'),
                appointment.doctor.get_full_name(),
            )
            method_info = get_send_method_info('reminder')
            return Response({
                'success': True,
                'phone': phone,
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'message': message,
                'send_method': method_info,
            })
        except Appointment.DoesNotExist:
            return Response({'error': 'نوبت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    appointment_id = request.data.get('appointment_id')
    custom_message = request.data.get('message_text')
    line_number = request.data.get('line_number')
    use_pattern = request.data.get('use_pattern')
    try:
        appointment = Appointment.objects.select_related('patient', 'doctor').get(id=appointment_id)
        patient = appointment.patient
        phone = patient.phone
        if not phone:
            return Response({'error': 'شماره تماس بیمار ثبت نشده'}, status=status.HTTP_400_BAD_REQUEST)
        jalali_date = toJalali(str(appointment.date))
        result = send_appointment_reminder(
            phone,
            f"{patient.first_name} {patient.last_name}",
            jalali_date,
            appointment.time.strftime('%H:%M'),
            appointment.doctor.get_full_name(),
            custom_message,
            line_number,
            use_pattern,
            user=request.user,
            appointment=appointment,
            patient=patient,
        )
        return Response({
            'success': result.get('success', False),
            'method': result.get('method'),
            'message': 'پیامک با موفقیت ارسال شد' if result.get('success') else result.get('error', 'خطا در ارسال پیامک'),
            'rec_id': result.get('rec_id'),
            'pattern_code': result.get('pattern_code'),
        })
    except Appointment.DoesNotExist:
        return Response({'error': 'نوبت یافت نشد'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def send_payment_notice(request):
    if request.method == 'GET':
        patient_id = request.query_params.get('patient_id')
        amount = request.query_params.get('amount', '0')
        appointment_id = request.query_params.get('appointment_id')
        try:
            patient = Patient.objects.get(id=patient_id)
            phone = patient.phone
            if not phone:
                return Response({'error': 'شماره تماس بیمار ثبت نشده'}, status=status.HTTP_400_BAD_REQUEST)
            appointment_date = ''
            appointment_time = ''
            doctor_name = ''
            if appointment_id:
                try:
                    appointment = Appointment.objects.get(id=appointment_id)
                    jalali_date = toJalali(str(appointment.date))
                    appointment_date = jalali_date
                    appointment_time = appointment.time.strftime('%H:%M') if appointment.time else ''
                    doctor_name = appointment.doctor.get_full_name() if appointment.doctor else ''
                except Appointment.DoesNotExist:
                    pass
            message = get_payment_reminder_message(
                f"{patient.first_name} {patient.last_name}",
                str(amount),
                appointment_date,
                appointment_time,
                doctor_name,
            )
            method_info = get_send_method_info('payment')
            return Response({
                'success': True,
                'phone': phone,
                'patient_name': f"{patient.first_name} {patient.last_name}",
                'message': message,
                'send_method': method_info,
            })
        except Patient.DoesNotExist:
            return Response({'error': 'بیمار یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    patient_id = request.data.get('patient_id')
    amount = request.data.get('amount')
    custom_message = request.data.get('message_text')
    line_number = request.data.get('line_number')
    use_pattern = request.data.get('use_pattern')
    appointment_id = request.data.get('appointment_id')
    try:
        patient = Patient.objects.get(id=patient_id)
        phone = patient.phone
        if not phone:
            return Response({'error': 'شماره تماس بیمار ثبت نشده'}, status=status.HTTP_400_BAD_REQUEST)
        appointment = None
        if appointment_id:
            try:
                appointment = Appointment.objects.get(id=appointment_id)
            except Appointment.DoesNotExist:
                pass
        result = send_payment_reminder(
            phone,
            f"{patient.first_name} {patient.last_name}",
            str(amount),
            custom_message,
            line_number,
            use_pattern,
            user=request.user,
            appointment=appointment,
            patient=patient,
        )
        return Response({
            'success': result.get('success', False),
            'method': result.get('method'),
            'message': 'پیامک با موفقیت ارسال شد' if result.get('success') else result.get('error', 'خطا در ارسال پیامک'),
            'rec_id': result.get('rec_id'),
            'pattern_code': result.get('pattern_code'),
        })
    except Patient.DoesNotExist:
        return Response({'error': 'بیمار یافت نشد'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def sms_settings(request):
    if request.method == 'GET':
        cs = ClinicSetting.objects.first()
        if not cs:
            cs = ClinicSetting.objects.create()
        return Response({
            'sms_api_key': cs.sms_api_key or '',
            'sms_api_base': cs.sms_api_base or 'https://console.melipayamak.com/api',
            'sms_line_number': cs.sms_line_number or '',
        })

    cs = ClinicSetting.objects.first()
    if not cs:
        cs = ClinicSetting.objects.create()
    cs.sms_api_key = request.data.get('sms_api_key', cs.sms_api_key)
    cs.sms_api_base = request.data.get('sms_api_base', cs.sms_api_base)
    cs.sms_line_number = request.data.get('sms_line_number', cs.sms_line_number)
    cs.save(update_fields=['sms_api_key_enc', 'sms_api_base', 'sms_line_number'])
    return Response({'message': 'تنظیمات پیامک ذخیره شد'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def test_sms_connection(request):
    api_key = request.data.get('sms_api_key', '')
    if api_key:
        result = test_connection(api_key)
    else:
        result = test_connection()
    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def sms_credit(request):
    result = get_credit()
    if result.get('success'):
        return Response({
            'success': True,
            'credit': result.get('credit'),
        })
    return Response(result, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def sms_otp(request):
    to = request.data.get('to', '')
    if not to:
        return Response({'error': 'شماره موبایل وارد نشده'}, status=status.HTTP_400_BAD_REQUEST)
    result = send_otp(to)
    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sms_delivery(request):
    rec_ids = request.data.get('recIds', [])
    if not rec_ids:
        return Response({'error': 'recIds required'}, status=status.HTTP_400_BAD_REQUEST)
    result = get_delivery(rec_ids)
    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def sms_check_pending(request):
    check_pending_deliveries()
    return Response({'message': 'بررسی شد'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def sms_template_list(request):
    if request.method == 'GET':
        templates = SmsTemplate.objects.all()
        serializer = SmsTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    serializer = SmsTemplateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def sms_template_detail(request, pk):
    try:
        template = SmsTemplate.objects.get(pk=pk)
    except SmsTemplate.DoesNotExist:
        return Response({'error': 'قالب یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = SmsTemplateSerializer(template)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = SmsTemplateSerializer(template, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sms_log_list(request):
    paginator = PageNumberPagination()
    paginator.page_size = 50

    logs = SmsLog.objects.select_related('sent_by', 'appointment', 'patient').all()

    message_type = request.query_params.get('message_type')
    if message_type:
        logs = logs.filter(message_type=message_type)

    status_filter = request.query_params.get('status')
    if status_filter:
        logs = logs.filter(status=status_filter)

    phone = request.query_params.get('phone')
    if phone:
        logs = logs.filter(phone_number__contains=phone)

    result_page = paginator.paginate_queryset(logs, request)
    serializer = SmsLogSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def sms_method_info(request):
    template_type = request.query_params.get('type', 'confirm')
    info = get_send_method_info(template_type)
    return Response(info)
