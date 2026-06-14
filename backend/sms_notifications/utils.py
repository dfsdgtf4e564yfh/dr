import logging
import random
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

def _get_api_base():
    base = getattr(settings, 'SMS_API_BASE', '')
    if base:
        return base.rstrip('/')
    try:
        from accounts.models import ClinicSetting
        cs = ClinicSetting.objects.first()
        if cs and cs.sms_api_base:
            return cs.sms_api_base.rstrip('/')
    except Exception:
        pass
    return 'https://console.melipayamak.com/api'


def _get_api_key():
    key = getattr(settings, 'SMS_API_KEY', '')
    if key:
        return key
    try:
        from accounts.models import ClinicSetting
        cs = ClinicSetting.objects.first()
        if cs and cs.sms_api_key:
            return cs.sms_api_key
    except Exception:
        pass
    return ''


def _get_line_number():
    try:
        from accounts.models import ClinicSetting
        cs = ClinicSetting.objects.first()
        if cs and cs.sms_line_number:
            return cs.sms_line_number
    except Exception:
        pass
    return getattr(settings, 'SMS_LINE_NUMBER', '')


def _get_active_template(template_type: str):
    try:
        from .models import SmsTemplate
        return SmsTemplate.objects.filter(
            template_type=template_type, is_active=True
        ).first()
    except Exception:
        return None


def _log_sms_send(**kwargs):
    try:
        from .models import SmsLog
        SmsLog.objects.create(**kwargs)
    except Exception as e:
        logger.error(f'Failed to log SMS: {e}')


def _post(endpoint: str, data: dict) -> dict:
    key = _get_api_key()
    if not key:
        return {'success': False, 'error': 'API Key سامانه پیامک تنظیم نشده'}
    url = f'{_get_api_base()}/{endpoint}/{key}'
    logger.info(f'Melipayamak POST {endpoint}')
    try:
        resp = requests.post(url, json=data, timeout=30, verify=True)
        logger.info(f'HTTP {resp.status_code} - {resp.text[:200]}')
        if not resp.text.strip():
            return {'success': False, 'error': 'پاسخ خالی از سرویس'}
        result = resp.json()
        return {'success': True, 'data': result}
    except Exception as e:
        logger.error(f'Melipayamak POST error: {e}')
        return {'success': False, 'error': str(e)}


def _get(endpoint: str) -> dict:
    key = _get_api_key()
    if not key:
        return {'success': False, 'error': 'API Key سامانه پیامک تنظیم نشده'}
    url = f'{_get_api_base()}/{endpoint}/{key}'
    logger.info(f'Melipayamak GET {endpoint}')
    try:
        resp = requests.get(url, timeout=30, verify=True)
        logger.info(f'HTTP {resp.status_code} - {resp.text[:200]}')
        if not resp.text.strip():
            return {'success': False, 'error': 'پاسخ خالی از سرویس'}
        result = resp.json()
        return {'success': True, 'data': result}
    except Exception as e:
        logger.error(f'Melipayamak GET error: {e}')
        return {'success': False, 'error': str(e)}


def send_simple(to: str, from_number: str, text: str) -> dict:
    resp = _post('send/simple', {
        'from': from_number,
        'to': to,
        'text': text,
    })
    if not resp['success']:
        return {
            'success': False,
            'status': 'failed',
            'method': 'bulk',
            'error': resp['error'],
            'message_text': text,
            'line_number': from_number,
        }
    result = resp['data']
    if result.get('recId'):
        return {
            'success': True,
            'status': 'pending',
            'method': 'bulk',
            'rec_id': str(result['recId']),
            'message_text': text,
            'line_number': from_number,
        }
    return {
        'success': False,
        'status': 'failed',
        'method': 'bulk',
        'error': result.get('status', 'خطا در ارسال پیامک'),
        'message_text': text,
        'line_number': from_number,
    }


def send_shared(body_id: int, to: str, args: list) -> dict:
    resp = _post('send/shared', {
        'bodyId': body_id,
        'to': to,
        'args': args,
    })
    if not resp['success']:
        return {
            'success': False,
            'status': 'failed',
            'method': 'pattern',
            'error': resp['error'],
            'pattern_code': str(body_id),
        }
    result = resp['data']
    if result.get('recId'):
        return {
            'success': True,
            'status': 'pending',
            'method': 'pattern',
            'rec_id': str(result['recId']),
            'pattern_code': str(body_id),
        }
    return {
        'success': False,
        'status': 'failed',
        'method': 'pattern',
        'error': result.get('status', 'خطا در ارسال الگو'),
        'pattern_code': str(body_id),
    }


def _generate_otp_code(length=6):
    return str(random.randint(10**(length-1), 10**length - 1))

def send_otp(to: str, user=None, ip_address=None, purpose='ورود') -> dict:
    template = _get_active_template('otp')
    if template:
        code = _generate_otp_code()
        try:
            body_id = int(template.pattern_code)
        except (ValueError, TypeError):
            return {'success': False, 'error': 'شناسه الگو OTP باید عددی باشد'}
        result = send_shared(body_id, to, [code])
        _log_sms_send(
            phone_number=to,
            patient_name='',
            message_type='otp',
            send_method='pattern',
            status='sent' if result.get('success') else 'failed',
            template_id=body_id,
            message_text=f'[OTP] کد تایید برای {purpose}',
            message_id=result.get('rec_id'),
            error_message=result.get('error', ''),
            sent_by=user,
            ip_address=ip_address,
        )
        if result.get('success'):
            return {'success': True, 'code': code}
        return {'success': False, 'error': result.get('error', 'خطا در ارسال OTP')}

    resp = _post('send/otp', {'to': to})
    if not resp['success']:
        return {'success': False, 'error': resp['error']}
    result = resp['data']
    _log_sms_send(
        phone_number=to,
        patient_name='',
        message_type='otp',
        send_method='verify',
        status='sent' if result.get('code') else 'failed',
        message_text=f'[OTP] کد تایید برای {purpose}',
        message_id=result.get('rec_id'),
        error_message=result.get('error', ''),
        sent_by=user,
        ip_address=ip_address,
    )
    if result.get('code'):
        return {'success': True, 'code': result['code']}
    return {'success': False, 'error': result.get('status', 'خطا در ارسال OTP')}


def get_delivery(rec_ids: list) -> dict:
    if not rec_ids:
        return {'success': False, 'error': 'recIds empty'}
    resp = _post('receive/status', {'recIds': rec_ids})
    if not resp['success']:
        return {'success': False, 'error': resp['error']}
    result = resp['data']
    if result.get('resultsAsCode') and len(result['resultsAsCode']) > 0:
        codes = result['resultsAsCode']
        texts = result.get('results', [])
        delivery_map = {}
        for i, rid in enumerate(rec_ids):
            code = codes[i] if i < len(codes) else None
            text = texts[i] if i < len(texts) else None
            delivery_map[str(rid)] = {
                'delivery_code': code,
                'delivery_text': text or _delivery_text(code),
                'delivered': code == -1,
            }
        return {'success': True, 'deliveries': delivery_map}
    return {
        'success': False,
        'error': result.get('status', 'خطا در دریافت وضعیت'),
    }


def get_credit() -> dict:
    resp = _get('receive/credit')
    if not resp['success']:
        return {'success': False, 'error': resp['error']}
    result = resp['data']
    if 'amount' in result:
        return {'success': True, 'credit': result['amount']}
    return {'success': False, 'error': result.get('status', 'خطا در دریافت اعتبار')}


def test_connection(api_key: str = None) -> dict:
    base = _get_api_base()
    if api_key:
        url = f'{base}/receive/credit/{api_key}'
    else:
        key = _get_api_key()
        if not key:
            return {'success': False, 'error': 'API Key سامانه پیامک تنظیم نشده'}
        url = f'{base}/receive/credit/{key}'
    try:
        resp = requests.get(url, timeout=10, verify=True)
        result = resp.json()
        if 'amount' in result:
            return {
                'success': True,
                'credit': result['amount'],
                'message': 'اتصال با موفقیت برقرار شد',
            }
        return {'success': False, 'error': result.get('status', 'خطا در اتصال')}
    except requests.exceptions.ConnectionError:
        return {'success': False, 'error': 'عدم امکان اتصال به سامانه ملی پیامک'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def _delivery_text(code) -> str:
    mapping = {
        -1: 'ارسال شده',
        0: 'ارسال شده به مخابرات',
        1: 'رسیده به گوشی',
        2: 'نرسیده به گوشی',
        8: 'رسیده به مخابرات',
        16: 'نرسیده به مخابرات',
        35: 'لیست سیاه',
        100: 'نامشخص',
        200: 'ارسال نشده',
    }
    if code is None:
        return 'نامشخص'
    try:
        code = int(code)
    except (ValueError, TypeError):
        return 'نامشخص'
    return mapping.get(code, f'ناشناخته ({code})')


def check_pending_deliveries():
    try:
        from .models import SmsLog
        pending = SmsLog.objects.filter(status='pending').exclude(
            message_id__isnull=True
        ).exclude(message_id='')
        pending = pending[:50]
        if not pending:
            return
        rec_ids = [log.message_id for log in pending]
        result = get_delivery(rec_ids)
        if not result.get('success'):
            logger.error(f'check_pending_deliveries failed: {result.get("error")}')
            return
        deliveries = result.get('deliveries', {})
        for log in pending:
            info = deliveries.get(log.message_id)
            if info:
                if info.get('delivered'):
                    log.status = 'sent'
                    log.save(update_fields=['status'])
                else:
                    log.status = 'failed'
                    log.error_message = info.get('delivery_text', '')
                    log.save(update_fields=['status', 'error_message'])
    except Exception as e:
        logger.error(f'check_pending_deliveries failed: {e}')


def get_send_method_info(template_type: str) -> dict:
    template = _get_active_template(template_type)
    if template:
        return {
            'method': 'pattern',
            'template': {
                'id': template.id,
                'pattern_code': template.pattern_code,
                'name': template.name,
                'type': template.template_type,
            }
        }
    return {'method': 'bulk', 'template': None}


def _send_common(
    phone_number: str,
    message_type: str,
    pattern_values_fn,
    message_fn,
    pattern_values,
    custom_message=None,
    line_number=None,
    use_pattern=None,
    user=None,
    appointment=None,
    patient=None,
):
    method_info = get_send_method_info(message_type)
    if not line_number:
        line_number = _get_line_number()
    should_use_pattern = (
        (use_pattern is None and method_info['method'] == 'pattern')
        or (use_pattern is True)
    )
    log_base = {
        'phone_number': phone_number,
        'patient_name': pattern_values[0] if pattern_values else '',
        'message_type': message_type,
        'appointment': appointment,
        'patient': patient,
        'sent_by': user,
    }
    if should_use_pattern and method_info['template']:
        template = method_info['template']
        values = pattern_values_fn(*pattern_values)
        try:
            body_id = int(template['pattern_code'])
        except (ValueError, TypeError):
            return {
                'success': False,
                'error': 'شناسه الگو (bodyId) باید عددی باشد',
                'method': 'pattern',
            }
        result = send_shared(body_id, phone_number, values)
        _log_sms_send(**{
            **log_base,
            'send_method': 'pattern',
            'status': result.get('status', 'sent' if result['success'] else 'failed'),
            'template_id': template['pattern_code'],
            'message_text': f'[الگو: {template["name"]}] args: {values}',
            'message_id': result.get('rec_id'),
            'error_message': result.get('error', ''),
        })
        return result
    if not line_number:
        return {
            'success': False,
            'error': 'شماره خط ارسال در تنظیمات پیامک وارد نشده',
            'method': 'bulk',
        }
    message = custom_message or message_fn(*pattern_values)
    result = send_simple(phone_number, line_number, message)
    _log_sms_send(**{
        **log_base,
        'send_method': 'bulk',
        'status': result.get('status', 'sent' if result['success'] else 'failed'),
        'line_number': line_number,
        'message_text': message,
        'message_id': result.get('rec_id'),
        'error_message': result.get('error', ''),
    })
    return result


def get_appointment_confirmation_message(patient_name, date, time, doctor_name):
    return (
        f"دکتر محمد طاهری - کلینیک تخصصی اعصاب و روان\n"
        f"بیمار گرامی {patient_name}\n"
        f"نوبت شما در تاریخ {date} ساعت {time}\n"
        f"پزشک / درمانگر: {doctor_name}\n"
        f"لطفاً ۱۵ دقیقه زودتر حاضر باشید."
    )


def get_appointment_reminder_message(patient_name, date, time, doctor_name):
    return (
        f"یادآوری نوبت - دکتر محمد طاهری\n"
        f"بیمار گرامی {patient_name}\n"
        f"فردا ساعت {time} نوبت با {doctor_name} دارید.\n"
        f"تاریخ: {date}"
    )


def format_persian_money(amount):
    try:
        num = int(amount)
        formatted = '{:,}'.format(num)
        persian_digits = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
        return formatted.translate(persian_digits)
    except (ValueError, TypeError):
        return str(amount)


def get_payment_reminder_message(patient_name, amount, appointment_date='', appointment_time='', doctor_name=''):
    formatted_amount = format_persian_money(amount)
    appointment_info = ''
    if appointment_date or appointment_time:
        appointment_info = f"\nمربوط به نوبت: {appointment_date} ساعت {appointment_time}"
        if doctor_name:
            appointment_info += f"\nپزشک: {doctor_name}"
    return (
        f"دکتر محمد طاهری - کلینیک تخصصی اعصاب و روان\n"
        f"بیمار گرامی {patient_name}\n"
        f"مبلغ {formatted_amount} تومان از صورت‌حساب شما باقی مانده است.{appointment_info}\n"
        f"لطفاً در اسرع وقت نسبت به تسویه اقدام فرمایید."
    )


def get_pattern_values_for_confirm(patient_name, date, time, doctor_name):
    return [patient_name, date, time, doctor_name]


def get_pattern_values_for_reminder(patient_name, date, time, doctor_name):
    return [patient_name, date, time, doctor_name]


def get_pattern_values_for_payment(patient_name, amount, appointment_date='', appointment_time='', doctor_name=''):
    formatted_amount = format_persian_money(amount)
    return [patient_name, formatted_amount]


def send_appointment_confirmation(
    phone_number, patient_name, date, time, doctor_name,
    custom_message=None, line_number=None, use_pattern=None,
    user=None, appointment=None, patient=None,
):
    return _send_common(
        phone_number, 'confirm',
        get_pattern_values_for_confirm,
        get_appointment_confirmation_message,
        [patient_name, date, time, doctor_name],
        custom_message, line_number, use_pattern,
        user, appointment, patient,
    )


def send_appointment_reminder(
    phone_number, patient_name, date, time, doctor_name,
    custom_message=None, line_number=None, use_pattern=None,
    user=None, appointment=None, patient=None,
):
    return _send_common(
        phone_number, 'reminder',
        get_pattern_values_for_reminder,
        get_appointment_reminder_message,
        [patient_name, date, time, doctor_name],
        custom_message, line_number, use_pattern,
        user, appointment, patient,
    )


def send_payment_reminder(
    phone_number, patient_name, amount,
    custom_message=None, line_number=None, use_pattern=None,
    user=None, appointment=None, patient=None,
):
    appointment_date = ''
    appointment_time = ''
    doctor_name = ''
    if appointment:
        from utils.jalali import toJalali
        appointment_date = toJalali(str(appointment.date))
        appointment_time = appointment.time.strftime('%H:%M') if appointment.time else ''
        doctor_name = appointment.doctor.get_full_name() if appointment.doctor else ''
    return _send_common(
        phone_number, 'payment',
        get_pattern_values_for_payment,
        get_payment_reminder_message,
        [patient_name, amount, appointment_date, appointment_time, doctor_name],
        custom_message, line_number, use_pattern,
        user, appointment, patient,
    )
