from django.db import models
from django.conf import settings


BLOOD_TYPE_CHOICES = [
    ('A+', 'A+'), ('A-', 'A-'),
    ('B+', 'B+'), ('B-', 'B-'),
    ('AB+', 'AB+'), ('AB-', 'AB-'),
    ('O+', 'O+'), ('O-', 'O-'),
]


class PatientIdentity(models.Model):
    patient = models.OneToOneField(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='identity', verbose_name='بیمار'
    )
    fingerprint_hash = models.CharField(
        max_length=255, blank=True, null=True, verbose_name='هش اثر انگشت'
    )
    fingerprint_data = models.TextField(
        blank=True, null=True, verbose_name='داده اثر انگشت'
    )
    id_card_number = models.CharField(
        max_length=20, blank=True, verbose_name='شماره شناسنامه'
    )
    id_card_serial = models.CharField(
        max_length=20, blank=True, verbose_name='سریال شناسنامه'
    )
    birth_place = models.CharField(
        max_length=100, blank=True, verbose_name='محل تولد'
    )
    nationality = models.CharField(
        max_length=50, default='ایرانی', verbose_name='ملیت'
    )
    religion = models.CharField(
        max_length=50, blank=True, verbose_name='دین'
    )
    blood_type = models.CharField(
        max_length=5, choices=BLOOD_TYPE_CHOICES, blank=True, verbose_name='گروه خونی'
    )
    emergency_contact_name = models.CharField(
        max_length=100, blank=True, verbose_name='نام شخص اضطراری'
    )
    emergency_contact_relation = models.CharField(
        max_length=50, blank=True, verbose_name='نسبت شخص اضطراری'
    )
    emergency_contact_phone = models.CharField(
        max_length=15, blank=True, verbose_name='تلفن شخص اضطراری'
    )
    notes = models.TextField(blank=True, verbose_name='یادداشت‌ها')
    verified_at = models.DateTimeField(
        null=True, blank=True, verbose_name='تاریخ تأیید هویت'
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='تأیید کننده'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین ویرایش')

    class Meta:
        verbose_name = 'هویت بیمار'
        verbose_name_plural = 'هویت بیماران'

    def __str__(self):
        return f"هویت {self.patient}"
