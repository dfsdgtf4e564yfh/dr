from django.db import models
from django.conf import settings
from utils.models import BaseModel


class Appointment(BaseModel):
    STATUS_CHOICES = [
        ('scheduled', 'نوبت‌گذاری شده'),
        ('completed', 'انجام شده'),
        ('cancelled', 'لغو شده'),
        ('rescheduled', 'تغییر یافته'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='appointments', verbose_name='بیمار'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='appointments', verbose_name='پزشک'
    )
    treatment_type = models.ForeignKey(
        'accounts.TreatmentType', on_delete=models.CASCADE,
        verbose_name='نوع درمان'
    )
    date = models.DateField(verbose_name='تاریخ')
    time = models.TimeField(verbose_name='ساعت')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name='وضعیت')
    cost = models.DecimalField(max_digits=12, decimal_places=0, default=0, blank=True, null=True, verbose_name='هزینه نوبت')
    service_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0, blank=True, null=True, verbose_name='هزینه خدمات')
    notes = models.TextField(blank=True, verbose_name='یادداشت')
    sms_sent = models.BooleanField(default=False, verbose_name='پیامک ارسال شد')
    daily_number = models.PositiveIntegerField(null=True, blank=True, verbose_name='شماره نوبت روزانه')
    source = models.CharField(max_length=50, blank=True, default='', verbose_name='منبع نوبت')
    external_id = models.CharField(max_length=200, blank=True, default='', verbose_name='شناسه منبع خارجی')

    class Meta:
        verbose_name = 'نوبت'
        verbose_name_plural = 'نوبت‌ها'
        ordering = ['-date', '-time']
        indexes = [
            models.Index(fields=['date', 'doctor']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['source']),
            models.Index(fields=['date', 'status']),
        ]

    def __str__(self):
        return f"{self.patient} - {self.get_status_display()} - {self.date}"
