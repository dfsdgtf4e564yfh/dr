from django.db import models


class EmailBackupConfig(models.Model):
    smtp_host = models.CharField(max_length=255, default='smtp.gmail.com', verbose_name='هاست SMTP')
    smtp_port = models.IntegerField(default=587, verbose_name='پورت SMTP')
    use_tls = models.BooleanField(default=True, verbose_name='استفاده از TLS')
    sender_email = models.CharField(max_length=255, blank=True, verbose_name='ایمیل فرستنده')
    sender_password = models.CharField(max_length=255, blank=True, verbose_name='رمز ایمیل')
    recipient_email = models.CharField(max_length=255, blank=True, verbose_name='ایمیل گیرنده')
    auto_send = models.BooleanField(default=False, verbose_name='ارسال خودکار پس از بکاپ')
    last_sent_at = models.DateTimeField(null=True, blank=True, verbose_name='آخرین ارسال')

    class Meta:
        verbose_name = 'تنظیم ایمیل پشتیبان'
        verbose_name_plural = 'تنظیم ایمیل پشتیبان'

    def __str__(self):
        return f'ایمیل به {self.recipient_email or "تنظیم نشده"}'


class BackupSchedule(models.Model):
    enabled = models.BooleanField(default=True, verbose_name='فعال')
    hour = models.IntegerField(default=3, verbose_name='ساعت')
    minute = models.IntegerField(default=0, verbose_name='دقیقه')
    last_run = models.DateTimeField(null=True, blank=True, verbose_name='آخرین اجرا')
    retention_days = models.IntegerField(default=30, verbose_name='نگهداری بکاپ (روز)')
    encrypt_backup = models.BooleanField(default=False, verbose_name='رمزنگاری بکاپ')

    class Meta:
        verbose_name = 'تنظیم زمان پشتیبان‌گیری خودکار'
        verbose_name_plural = 'تنظیم زمان پشتیبان‌گیری خودکار'

    def __str__(self):
        return f'پشتیبان‌گیری خودکار در ساعت {self.hour:02d}:{self.minute:02d}' + (' (فعال)' if self.enabled else ' (غیرفعال)')


class BackupLog(models.Model):
    filename = models.CharField(max_length=500, verbose_name='نام فایل')
    size_bytes = models.BigIntegerField(default=0, verbose_name='حجم')
    status = models.CharField(max_length=20, choices=[('success', 'موفق'), ('failed', 'شکست')], verbose_name='وضعیت')
    engine = models.CharField(max_length=50, blank=True, verbose_name='موتور دیتابیس')
    cloud_uploaded = models.BooleanField(default=False, verbose_name='ارسال ایمیل')
    error_message = models.TextField(blank=True, verbose_name='خطا')
    checksum = models.CharField(max_length=64, blank=True, verbose_name='checksum')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')

    class Meta:
        verbose_name = 'لاگ بکاپ'
        verbose_name_plural = 'لاگ‌های بکاپ'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} - {self.status}"
