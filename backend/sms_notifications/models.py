from django.db import models
from django.conf import settings


class SmsTemplate(models.Model):
    TYPE_CHOICES = [
        ('confirm', 'تأیید نوبت'),
        ('reminder', 'یادآوری نوبت'),
        ('payment', 'یادآوری پرداخت'),
        ('otp', 'کد تایید'),
    ]

    name = models.CharField(max_length=100, verbose_name='نام قالب')
    template_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, unique=True, verbose_name='نوع قالب',
        error_messages={'unique': 'این نوع قالب قبلاً ثبت شده است'}
    )
    pattern_code = models.CharField(
        max_length=50,
        verbose_name='کد الگو (bodyId)',
        help_text='شناسه الگو (bodyId) که در پنل ملی پیامک دریافت کردید'
    )
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین ویرایش')

    class Meta:
        verbose_name = 'قالب پیامک'
        verbose_name_plural = 'قالب‌های پیامک'
        ordering = ['template_type']

    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()}) - کد: {self.pattern_code}"


class SmsLog(models.Model):
    TYPE_CHOICES = [
        ('bulk', 'ارسال گروهی (Bulk)'),
        ('verify', 'ارسال قالب (Verify)'),
    ]

    STATUS_CHOICES = [
        ('pending', 'در حال ارسال'),
        ('sent', 'ارسال شد'),
        ('failed', 'خطا در ارسال'),
    ]

    phone_number = models.CharField(max_length=20, verbose_name='شماره موبایل')
    patient_name = models.CharField(max_length=200, blank=True, verbose_name='نام بیمار')
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('confirm', 'تأیید نوبت'),
            ('reminder', 'یادآوری نوبت'),
            ('payment', 'یادآوری پرداخت'),
            ('otp', 'کد تایید'),
        ],
        verbose_name='نوع پیام'
    )
    send_method = models.CharField(
        max_length=20, choices=TYPE_CHOICES, verbose_name='روش ارسال'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت'
    )
    template_id = models.IntegerField(blank=True, null=True, verbose_name='شناسه قالب')
    line_number = models.CharField(max_length=20, blank=True, verbose_name='شماره خط')
    message_text = models.TextField(verbose_name='متن پیام')
    message_id = models.CharField(max_length=100, blank=True, null=True, verbose_name='شناسه پیام در amootsms')
    cost = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='هزینه (تومان)'
    )
    error_message = models.TextField(blank=True, verbose_name='پیام خطا')
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sms_logs',
        verbose_name='نوبت مرتبط'
    )
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sms_logs',
        verbose_name='بیمار مرتبط'
    )
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sent_sms',
        verbose_name='ارسال کننده'
    )
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='آدرس IP')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ارسال')

    class Meta:
        verbose_name = 'تاریخچه پیامک'
        verbose_name_plural = 'تاریخچه پیامک‌ها'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['phone_number']),
        ]

    def __str__(self):
        return f"{self.phone_number} - {self.get_message_type_display()} - {self.get_status_display()}"
