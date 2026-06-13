import logging
from datetime import date
from calendar import monthrange
from django.db import transaction
from django.db.models import Sum
from appointments.models import Appointment
from patients.models import Patient
from .models import Billing

logger = logging.getLogger(__name__)

JALALI_MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]


def _gregorian_to_jalali(gy, gm, gd):
    gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = (gm > 2) and (gy + 1) or gy
    days = 355666 + (365 * gy) + ((gy2 + 3) // 4) - ((gy2 + 99) // 100) + ((gy2 + 399) // 400) + gd + gdm[gm - 1]
    jy = -1595 + (33 * (days // 12053))
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    jm = (days < 186) and (1 + days // 31) or (7 + (days - 186) // 30)
    jd = 1 + ((days < 186) and (days % 31) or ((days - 186) % 30))
    return jy, jm, jd


def _get_period_label(year, month):
    jy, jm, _ = _gregorian_to_jalali(year, month, 15)
    name = JALALI_MONTH_NAMES[jm - 1] if 1 <= jm <= 12 else ''
    return f"{name} {jy}"


def generate_monthly_bill(patient_id, year, month):
    _, last_day = monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    appointments = Appointment.objects.filter(
        patient_id=patient_id,
        date__gte=start_date,
        date__lte=end_date,
        status='completed',
    )

    if not appointments.exists():
        return None

    total = appointments.aggregate(
        total=Sum('cost') + Sum('service_cost')
    )['total'] or 0

    if total <= 0:
        return None

    first_appt = appointments.first()
    doctor = first_appt.doctor

    period_label = _get_period_label(year, month)

    billing = Billing.objects.create(
        patient_id=patient_id,
        doctor=doctor,
        cost_type='periodic',
        total_amount=total,
        paid_amount=0,
        description=f"صورتحساب دوره‌ای {period_label}",
        period_label=period_label,
        period_year=year,
        period_month=month,
        doctor_commission_percentage=doctor.commission_percentage or 0,
    )
    return billing


def generate_all_monthly_bills(year, month):
    _, last_day = monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)

    patient_ids = Appointment.objects.filter(
        date__gte=start_date,
        date__lte=end_date,
        status='completed',
    ).values_list('patient_id', flat=True).distinct()

    existing = set(Billing.objects.filter(
        cost_type='periodic',
        period_year=year,
        period_month=month,
    ).values_list('patient_id', flat=True))

    created = []
    for pid in patient_ids:
        if pid in existing:
            continue
        try:
            with transaction.atomic():
                bill = generate_monthly_bill(pid, year, month)
                if bill:
                    created.append(bill)
        except Exception as e:
            logger.error(f"Failed to generate periodic bill for patient {pid}: {e}")

    return created
