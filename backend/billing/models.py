from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from utils.models import BaseModel


class Billing(BaseModel):
    PAYMENT_CHOICES = [
        ('cash', 'نقدی'),
        ('card', 'کارت'),
        ('insurance', 'بیمه'),
        ('transfer', 'کارت به کارت'),
        ('in_person', 'حضوری'),
        ('online', 'آنلاین'),
    ]
    STATUS_CHOICES = [
        ('pending', 'پرداخت نشده'),
        ('paid', 'پرداخت شده'),
        ('partial', 'پرداخت جزئی'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='billings', verbose_name='بیمار'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='billings', verbose_name='پزشک'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='billings', verbose_name='نوبت'
    )
    cost_type = models.CharField(max_length=20, choices=[('visit', 'ویزیت'), ('service', 'خدمات'), ('visit_service', 'خدمات / ویزیت'), ('periodic', 'دوره‌ای')], default='visit', verbose_name='نوع هزینه')
    period_label = models.CharField(max_length=50, blank=True, verbose_name='برچسب دوره')
    period_year = models.IntegerField(null=True, blank=True, verbose_name='سال دوره')
    period_month = models.IntegerField(null=True, blank=True, verbose_name='ماه دوره')
    total_amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='مبلغ کل')
    paid_amount = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name='مبلغ پرداختی')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash', verbose_name='روش پرداخت')
    receipt_number = models.CharField(max_length=100, blank=True, verbose_name='شماره رسید')
    doctor_commission_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, verbose_name='درصد سهم پزشک'
    )
    doctor_share = models.DecimalField(
        max_digits=12, decimal_places=0, default=0, verbose_name='سهم پزشک'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    payment_url = models.URLField(blank=True, null=True, verbose_name='آدرس پرداخت')
    authority = models.CharField(max_length=100, blank=True, verbose_name='کد ارجاع')
    ref_id = models.CharField(max_length=100, blank=True, verbose_name='شماره تراکنش')

    class Meta:
        verbose_name = 'صورتحساب'
        verbose_name_plural = 'صورتحساب‌ها'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['doctor', 'status']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['created_at']),
            models.Index(fields=['patient', 'created_at']),
        ]

    def __str__(self):
        return f"{self.patient} - {self.total_amount:,} تومان"

    def clean(self):
        if self.paid_amount > self.total_amount:
            raise ValidationError({'paid_amount': 'مبلغ پرداختی نمی‌تواند از مبلغ کل بیشتر باشد.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.doctor_commission_percentage and self.total_amount:
            self.doctor_share = self.total_amount * self.doctor_commission_percentage / 100
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        else:
            self.status = 'pending'
        super().save(*args, **kwargs)


class Settlement(models.Model):
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='settlements', verbose_name='پزشک'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='مبلغ')
    date = models.DateField(auto_now_add=True, verbose_name='تاریخ تسویه')
    status = models.CharField(max_length=20, default='done', verbose_name='وضعیت')
    notes = models.TextField(blank=True, verbose_name='یادداشت')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_settlements',
        verbose_name='ثبت کننده'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')

    class Meta:
        verbose_name = 'تسویه حساب'
        verbose_name_plural = 'تسویه حساب‌ها'
        ordering = ['-date']

    def __str__(self):
        return f"{self.doctor.get_full_name()} - {self.amount:,} تومان - {self.date}"
