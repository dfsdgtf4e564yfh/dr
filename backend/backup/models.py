from django.db import models
from utils.encryption import EncryptedField


class EmailBackupConfig(models.Model):
    smtp_host = models.CharField(max_length=255, default='smtp.gmail.com', verbose_name='هاست SMTP')
    smtp_port = models.IntegerField(default=587, verbose_name='پورت SMTP')
    use_tls = models.BooleanField(default=True, verbose_name='استفاده از TLS')
    sender_email = models.CharField(max_length=255, blank=True, verbose_name='ایمیل فرستنده')
    sender_password_raw = models.CharField(max_length=255, blank=True, verbose_name='رمز ایمیل (قدیمی)')
    sender_password_enc = models.TextField(blank=True, verbose_name='رمز ایمیل (رمزنگاری شده)')
    recipient_email = models.CharField(max_length=255, blank=True, verbose_name='ایمیل گیرنده')
    auto_send = models.BooleanField(default=False, verbose_name='ارسال خودکار پس از بکاپ')
    last_sent_at = models.DateTimeField(null=True, blank=True, verbose_name='آخرین ارسال')

    _sender_password = EncryptedField('sender_password_enc')

    class Meta:
        verbose_name = 'تنظیم ایمیل پشتیبان'
        verbose_name_plural = 'تنظیم ایمیل پشتیبان'

    @property
    def sender_password(self):
        val = self._sender_password
        if val:
            return val
        return self.sender_password_raw

    @sender_password.setter
    def sender_password(self, value):
        self._sender_password = value
        self.sender_password_raw = ''

    def __str__(self):
        return f'ایمیل به {self.recipient_email or "تنظیم نشده"}'


class BackupSchedule(models.Model):
    enabled = models.BooleanField(default=True, verbose_name='فعال')
    hour = models.IntegerField(default=3, verbose_name='ساعت')
    minute = models.IntegerField(default=0, verbose_name='دقیقه')
    day = models.IntegerField(default=1, verbose_name='روز ماه (برای بکاپ ماهانه)')
    last_run = models.DateTimeField(null=True, blank=True, verbose_name='آخرین اجرا')
    retention_days = models.IntegerField(default=60, verbose_name='نگهداری بکاپ (روز)')
    encrypt_backup = models.BooleanField(default=True, verbose_name='رمزنگاری بکاپ')

    class Meta:
        verbose_name = 'تنظیم زمان پشتیبان‌گیری خودکار'
        verbose_name_plural = 'تنظیم زمان پشتیبان‌گیری خودکار'

    def __str__(self):
        return f'پشتیبان‌گیری خودکار در ساعت {self.hour:02d}:{self.minute:02d}' + (' (فعال)' if self.enabled else ' (غیرفعال)')


class GitHubBackupConfig(models.Model):
    repo = models.CharField(max_length=255, blank=True, verbose_name='ریپازیتوری (owner/repo)')
    token_raw = models.CharField(max_length=255, blank=True, verbose_name='توکن دسترسی GitHub (قدیمی)')
    token_enc = models.TextField(blank=True, verbose_name='توکن دسترسی GitHub (رمزنگاری شده)')
    oauth_token_raw = models.TextField(blank=True, verbose_name='توکن OAuth گیت‌هاب (قدیمی)')
    oauth_token_enc = models.TextField(blank=True, verbose_name='توکن OAuth گیت‌هاب (رمزنگاری شده)')
    oauth_token_expires_at = models.DateTimeField(null=True, blank=True, verbose_name='انقضای توکن OAuth')
    github_user = models.CharField(max_length=255, blank=True, verbose_name='نام کاربری گیت‌هاب')
    github_user_id = models.BigIntegerField(null=True, blank=True, verbose_name='شناسه کاربر گیت‌هاب')
    oauth_client_id = models.CharField(max_length=255, blank=True, verbose_name='Client ID اپ گیت‌هاب')
    oauth_client_secret_raw = models.CharField(max_length=255, blank=True, verbose_name='Client Secret اپ گیت‌هاب (قدیمی)')
    oauth_client_secret_enc = models.TextField(blank=True, verbose_name='Client Secret اپ گیت‌هاب (رمزنگاری شده)')
    auto_upload = models.BooleanField(default=False, verbose_name='آپلود خودکار پس از بک‌آپ')
    keep_last_n = models.IntegerField(default=10, verbose_name='نگهداری آخرین N release')
    last_upload_at = models.DateTimeField(null=True, blank=True, verbose_name='آخرین آپلود')
    last_upload_file = models.CharField(max_length=500, blank=True, verbose_name='آخرین فایل آپلود شده')
    last_upload_status = models.CharField(max_length=50, blank=True, verbose_name='وضعیت آخرین آپلود')

    _token = EncryptedField('token_enc')
    _oauth_token = EncryptedField('oauth_token_enc')
    _oauth_client_secret = EncryptedField('oauth_client_secret_enc')

    class Meta:
        verbose_name = 'تنظیم GitHub پشتیبان'
        verbose_name_plural = 'تنظیمات GitHub پشتیبان'

    @property
    def token(self):
        val = self._token
        if val:
            return val
        return self.token_raw

    @token.setter
    def token(self, value):
        self._token = value
        self.token_raw = ''

    @property
    def oauth_token(self):
        val = self._oauth_token
        if val:
            return val
        return self.oauth_token_raw

    @oauth_token.setter
    def oauth_token(self, value):
        self._oauth_token = value
        self.oauth_token_raw = ''

    @property
    def oauth_client_secret(self):
        val = self._oauth_client_secret
        if val:
            return val
        return self.oauth_client_secret_raw

    @oauth_client_secret.setter
    def oauth_client_secret(self, value):
        self._oauth_client_secret = value
        self.oauth_client_secret_raw = ''

    def __str__(self):
        return f'GitHub: {self.repo or "تنظیم نشده"}'


class BackupLog(models.Model):
    filename = models.CharField(max_length=500, verbose_name='نام فایل')
    size_bytes = models.BigIntegerField(default=0, verbose_name='حجم')
    status = models.CharField(max_length=20, choices=[('success', 'موفق'), ('failed', 'شکست')], verbose_name='وضعیت')
    engine = models.CharField(max_length=50, blank=True, verbose_name='موتور دیتابیس')
    cloud_uploaded = models.BooleanField(default=False, verbose_name='ارسال ایمیل')
    github_uploaded = models.BooleanField(default=False, verbose_name='آپلود به GitHub')
    error_message = models.TextField(blank=True, verbose_name='خطا')
    checksum = models.CharField(max_length=64, blank=True, verbose_name='checksum')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ')

    class Meta:
        verbose_name = 'لاگ بکاپ'
        verbose_name_plural = 'لاگ‌های بکاپ'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} - {self.status}"
