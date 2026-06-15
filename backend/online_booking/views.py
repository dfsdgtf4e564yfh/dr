import hashlib
import json
import logging
import secrets
from datetime import time, date, datetime
from urllib.parse import urlencode

import requests
from django.db import transaction
from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone as dj_timezone
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from patients.models import Patient
from accounts.models import TreatmentType, User
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from billing.models import Billing
from .models import Holiday, ClinicConfig, get_config, set_config
from .serializers import (
    TreatmentTypeSerializer, PatientLookupSerializer, PatientRegisterSerializer,
    BookingRequestSerializer, HolidaySerializer,
)

logger = logging.getLogger(__name__)

DEFAULT_TIME_SLOTS = [
    '16:00', '16:10', '16:30', '16:50',
    '17:10', '17:30', '17:50',
    '18:10', '18:30', '18:50',
    '19:10', '19:30', '19:50',
    '20:10', '20:30', '20:50',
    '21:10', '21:30', '21:50',
]


def _get_time_slots():
    raw = get_config('time_slots', '')
    if raw:
        slots = [s.strip() for s in raw.split(',') if s.strip()]
        if slots:
            return slots
    return list(DEFAULT_TIME_SLOTS)


def _today_iran():
    return dj_timezone.localdate()


def _is_holiday(d: date) -> bool:
    if Holiday.objects.filter(date=d, is_active=True).exists():
        return True
    return False


def _get_doctor():
    doctor = User.objects.filter(first_name='محمد', last_name='طاهری', is_active=True).first()
    if doctor:
        return doctor
    return User.objects.filter(role='admin', is_active=True).order_by('id').first()


# ---- Public APIs ----

@api_view(['GET'])
@permission_classes([AllowAny])
def clinic_info(request):
    info = {
        'doctor_name': get_config('doctor_name', 'دکتر محمد طاهری'),
        'specialty': get_config('specialty', 'متخصص اعصاب و روان (روانپزشک)'),
        'tagline': get_config('tagline', 'درمان بدون دارو و بدون عوارض با rTMS، tDCS، CES'),
        'address': get_config('address', 'بندرعباس، سه راه پلنگ صورتی، پشت بانک صادرات، کوچه دوم، جنب چاپخانه سپاهان (MRI جام جم سابق)'),
        'phone': get_config('phone', '07632229600'),
        'phone2': get_config('phone2', '07632220252'),
        'email': get_config('email', 'dr-mohammadtaheri@gmail.com'),
        'instagram': get_config('instagram', 'https://www.instagram.com/dr_taheri_rtms'),
        'google_maps': get_config('google_maps', ''),
        'waze': get_config('waze', ''),
        'balad': get_config('balad', ''),
        'neshan': get_config('neshan', ''),
        'work_start': get_config('work_start', '16:00'),
        'work_end': get_config('work_end', '22:00'),
        'time_slots': ','.join(_get_time_slots()),
    }
    return Response(info)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_list(request):
    services = TreatmentType.objects.all()
    data = []
    for s in services:
        price = getattr(s, 'price', None) or 0
        data.append({'id': s.id, 'name': s.name, 'description': s.description, 'price': int(price)})
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def patient_lookup(request):
    national_id = request.query_params.get('national_id', '').strip()
    if not national_id or len(national_id) != 10 or not national_id.isdigit():
        return Response({'exists': False, 'error': 'کد ملی ۱۰ رقمی را وارد کنید'})
    nhash = hashlib.sha256(national_id.encode()).hexdigest()
    patient = Patient.objects.filter(national_id_hash=nhash, is_deleted=False).first()
    if patient:
        ser = PatientLookupSerializer(patient)
        data = ser.data
        data['exists'] = True
        return Response(data)
    return Response({'exists': False})


@api_view(['GET'])
@permission_classes([AllowAny])
def available_times(request):
    service_id = request.query_params.get('service_id')
    date_str = request.query_params.get('date')

    if not service_id or not date_str:
        return Response({'error': 'service_id و date الزامی است'}, status=400)

    try:
        req_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'فرمت تاریخ نامعتبر'}, status=400)

    if req_date < _today_iran():
        return Response({'times': [], 'reason': 'تاریخ گذشته'})

    if _is_holiday(req_date):
        return Response({'times': [], 'reason': 'تعطیل'})

    try:
        service = TreatmentType.objects.get(id=service_id)
    except TreatmentType.DoesNotExist:
        return Response({'error': 'سرویس یافت نشد'}, status=404)

    slots = _get_time_slots()
    booked = Appointment.objects.filter(
        treatment_type=service,
        date=req_date,
    ).exclude(status='cancelled').values_list('time', flat=True)

    booked_times = set(t.strftime('%H:%M') for t in booked)
    available = [t for t in slots if t not in booked_times]

    return Response({'times': available, 'date': date_str, 'service_id': service_id})


@api_view(['POST'])
@permission_classes([AllowAny])
def create_booking(request):
    ser = BookingRequestSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)

    data = ser.validated_data
    req_date = data['date']
    req_time = data['time']
    service_id = data['service_id']

    if req_date < _today_iran():
        return Response({'error': 'تاریخ نمی‌تواند در گذشته باشد'}, status=400)

    if _is_holiday(req_date):
        return Response({'error': 'روز تعطیل، نمی‌توان نوبت گرفت'}, status=400)

    try:
        service = TreatmentType.objects.get(id=service_id)
    except TreatmentType.DoesNotExist:
        return Response({'error': 'سرویس یافت نشد'}, status=404)

    doctor = _get_doctor()
    if not doctor:
        return Response({'error': 'پزشکی در سیستم ثبت نشده'}, status=500)

    time_str = req_time.strftime('%H:%M')
    if time_str not in _get_time_slots():
        return Response({'error': 'ساعت نامعتبر است'}, status=400)

    conflict = Appointment.objects.filter(
        treatment_type=service, date=req_date, time=req_time,
    ).exclude(status='cancelled').first()
    if conflict:
        return Response({'error': 'این زمان قبلاً رزرو شده است'}, status=409)

    with transaction.atomic():
        nhash = hashlib.sha256(data['national_id'].encode()).hexdigest()
        patient = Patient.objects.filter(national_id_hash=nhash, is_deleted=False).first()
        if not patient:
            patient = Patient.objects.create(
                first_name=data['first_name'],
                last_name=data['last_name'],
                national_id=data['national_id'],
                phone=data['phone'],
                gender=data.get('gender', 'male'),
                birth_date=data.get('birth_date'),
                first_visit_date=_today_iran(),
            )

        payment_method = data.get('payment_method', 'in_person')
        tracking_code = secrets.token_hex(8).upper()[:8]

        price = getattr(service, 'price', 0) or 0

        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            treatment_type=service,
            date=req_date,
            time=req_time,
            status='scheduled',
            cost=price,
            notes='نوبت آنلاین',
            source='online_booking',
        )

        billing = Billing.objects.create(
            patient=patient,
            appointment=appointment,
            doctor=doctor,
            total_amount=price,
            paid_amount=0,
            payment_method=payment_method,
            status='pending',
            receipt_number=tracking_code,
            created_by=doctor,
        )

    resp_data = {
        'success': True,
        'appointment_id': appointment.id,
        'billing_id': billing.id,
        'tracking_code': tracking_code,
        'patient': {
            'id': patient.id,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'national_id': patient.national_id,
            'file_number': patient.file_number,
        },
        'appointment': {
            'id': appointment.id,
            'date': str(appointment.date),
            'time': str(appointment.time),
            'service': service.name,
            'status': appointment.status,
            'payment_method': payment_method,
            'price': int(price),
        }
    }

    # If online payment and merchant is set, initiate Zarinpal payment
    if payment_method == 'online':
        merchant = get_config('zarinpal_merchant', '')
        if merchant:
            callback = request.build_absolute_uri('/api/online-booking/payment-callback/')
            zarrinpal_req = {
                'merchant_id': merchant,
                'amount': int(price * 10),  # Zarinpal uses Rial, we store Toman
                'description': f'نوبت {service.name} - {patient.first_name} {patient.last_name}',
                'callback_url': callback,
                'metadata': {
                    'tracking_code': tracking_code,
                    'patient_name': f'{patient.first_name} {patient.last_name}',
                }
            }
            try:
                zap_resp = requests.post(
                    'https://api.zarinpal.com/pg/v4/payment/request.json',
                    json=zarrinpal_req, timeout=10
                )
                zap_data = zap_resp.json()
                if zap_data.get('data', {}).get('code') == 100:
                    authority = zap_data['data']['authority']
                    billing.authority = authority
                    billing.save(update_fields=['authority'])
                    resp_data['payment_url'] = f'https://www.zarinpal.com/pg/StartPay/{authority}'
                    resp_data['authority'] = authority
                else:
                    logger.warning(f'Zarinpal request failed: {zap_data}')
            except requests.RequestException as e:
                logger.error(f'Zarinpal connection error: {e}')
        else:
            # No merchant configured: treat online as in-person
            billing.paid_amount = price
            billing.status = 'paid'
            billing.save(update_fields=['paid_amount', 'status'])

    return Response(resp_data, status=201)


@api_view(['GET'])
@permission_classes([AllowAny])
def my_appointments(request):
    national_id = request.query_params.get('national_id', '').strip()
    file_number = request.query_params.get('file_number', '').strip()
    if not national_id or len(national_id) != 10 or not national_id.isdigit():
        return Response({'error': 'کد ملی ۱۰ رقمی را وارد کنید'}, status=400)
    if not file_number:
        return Response({'error': 'شماره پرونده را وارد کنید'}, status=400)
    nhash = hashlib.sha256(national_id.encode()).hexdigest()
    patient = Patient.objects.filter(national_id_hash=nhash, is_deleted=False).first()
    if not patient:
        return Response({'error': 'این بیمار در سیستم وجود ندارد'}, status=404)
    if not patient.file_number or not patient.file_number.endswith(file_number):
        return Response({'error': 'کد ملی یا شماره پرونده اشتباه است'}, status=400)
    appts = Appointment.objects.filter(patient=patient).order_by('-date', '-time')
    data = []
    for a in appts:
        j = gregorian_to_jalali(a.date)
        data.append({
            'id': a.id,
            'date': str(a.date),
            'jalali_date': f'{j[2]} {_MONTHS[j[1]-1]} {j[0]}',
            'time': a.time.strftime('%H:%M'),
            'service': a.treatment_type.name if a.treatment_type else '',
            'status': a.status,
            'cost': int(a.cost or 0),
            'source': a.source or '',
        })
    return Response({
        'patient': {
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'national_id': patient.national_id,
            'file_number': patient.file_number or '',
        },
        'appointments': data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_holidays(request):
    holidays = Holiday.objects.filter(is_active=True).values('date', 'reason')
    return Response(list(holidays))


def gregorian_to_jalali(gy, gm=None, gd=None):
    if isinstance(gy, date):
        gd = gy.day
        gm = gy.month
        gy = gy.year
    gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + gdm[gm - 1]
    jy = -1595 + 33 * (days // 12053)
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    jm = 1 + (days // 31) if days < 186 else 7 + ((days - 186) // 30)
    jd = 1 + (days % 31) if days < 186 else 1 + ((days - 186) % 30)
    return (jy, jm, jd)


_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']


# ---- Admin APIs ----

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def holiday_list(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=403)

    if request.method == 'GET':
        holidays = Holiday.objects.all().order_by('-date')
        return Response(HolidaySerializer(holidays, many=True).data)

    if request.method == 'POST':
        ser = HolidaySerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def holiday_detail(request, pk):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=403)
    try:
        holiday = Holiday.objects.get(pk=pk)
    except Holiday.DoesNotExist:
        return Response({'error': 'یافت نشد'}, status=404)

    if request.method == 'PUT':
        ser = HolidaySerializer(holiday, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    if request.method == 'DELETE':
        holiday.delete()
        return Response(status=204)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def clinic_settings(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=403)

    if request.method == 'GET':
        configs = ClinicConfig.objects.all()
        return Response({c.key: c.value for c in configs})

    for key, value in request.data.items():
        set_config(str(key), str(value))
    return Response({'message': 'تنظیمات ذخیره شد'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_report(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=403)

    from_date = request.query_params.get('from')
    to_date = request.query_params.get('to')
    service_id = request.query_params.get('service_id')

    qs = Appointment.objects.filter(source='online_booking')
    if from_date:
        qs = qs.filter(date__gte=from_date)
    if to_date:
        qs = qs.filter(date__lte=to_date)
    if service_id:
        qs = qs.filter(treatment_type_id=service_id)

    total = qs.count()
    by_status = {}
    for appt in qs:
        s = appt.status
        by_status[s] = by_status.get(s, 0) + 1

    return Response({
        'total': total,
        'by_status': by_status,
        'appointments': AppointmentSerializer(qs.order_by('-date', '-time'), many=True).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def payment_callback(request):
    authority = request.GET.get('Authority', '')
    status_param = request.GET.get('Status', '')
    frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:5173'

    if status_param != 'OK' or not authority:
        return redirect(f'{frontend_url}/?payment=cancelled')

    billing = Billing.objects.filter(
        authority=authority, payment_method='online',
    ).first()

    if not billing:
        return redirect(f'{frontend_url}/?payment=notfound')

    merchant = get_config('zarinpal_merchant', '')
    if not merchant:
        return redirect(f'{frontend_url}/?payment=nomerchant')

    try:
        verify_data = {
            'merchant_id': merchant,
            'amount': int((billing.total_amount or 0) * 10),
            'authority': authority,
        }
        zap_resp = requests.post(
            'https://api.zarinpal.com/pg/v4/payment/verify.json',
            json=verify_data, timeout=10
        )
        result = zap_resp.json()
        data = result.get('data', {})
        code = data.get('code')

        if code == 100:
            billing.paid_amount = billing.total_amount
            billing.status = 'paid'
            billing.receipt_number = data.get('ref_id', billing.receipt_number)
            billing.save(update_fields=['paid_amount', 'status', 'receipt_number'])
            return redirect(f'{frontend_url}/?payment=success&tracking={billing.receipt_number}')
        else:
            logger.warning(f'Zarinpal verify failed: code={code}, data={data}')
            return redirect(f'{frontend_url}/?payment=failed&code={code}')
    except requests.RequestException as e:
        logger.error(f'Zarinpal verify connection error: {e}')
        return redirect(f'{frontend_url}/?payment=error')

