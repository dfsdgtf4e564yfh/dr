from django.contrib.auth.models import AbstractUser
from django.db import models
from utils.models import TimestampedModel
from utils.encryption import EncryptedField


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'مدیر کلینیک'),
        ('reception', 'پذیرش'),
        ('doctor', 'پزشک / درمانگر'),
        ('rtms', 'کاربر ویژه'),
        ('support', 'پشتیبانی'),
        ('super_support', 'پشتیبانی ارشد'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='reception', verbose_name='نقش')
    phone = models.CharField(max_length=20, blank=True, verbose_name='تلفن')
    commission_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name='درصد سهم پزشک'
    )
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True, verbose_name='امضا')
    specialization = models.CharField(max_length=200, blank=True, verbose_name='تخصص')
    medical_council_number = models.CharField(max_length=50, blank=True, verbose_name='شماره نظام پزشکی')
    page_permissions = models.JSONField(default=list, blank=True, verbose_name='دسترسی صفحات')
    two_factor_enabled = models.BooleanField(default=False, verbose_name='تایید دو مرحله‌ای')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='تصویر پروفایل')
    profile_completed = models.BooleanField(default=False, verbose_name='پروفایل تکمیل شده')

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class TreatmentType(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='نام بخش درمانی',
                            error_messages={'unique': 'این بخش درمانی قبلاً ثبت شده است'})
    description = models.TextField(blank=True, verbose_name='توضیحات')

    class Meta:
        verbose_name = 'بخش درمانی'
        verbose_name_plural = 'بخش‌های درمانی'

    def __str__(self):
        return self.name


class DoctorTreatment(models.Model):
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_treatments', verbose_name='پزشک')
    treatment_type = models.ForeignKey(TreatmentType, on_delete=models.CASCADE, verbose_name='بخش درمانی')

    class Meta:
        unique_together = ('doctor', 'treatment_type')
        verbose_name = 'ارتباط پزشک و بخش'
        verbose_name_plural = 'ارتباط پزشکان و بخش‌ها'

    def __str__(self):
        return f"{self.doctor.get_full_name()} - {self.treatment_type.name}"


class ClinicSetting(TimestampedModel):
    clinic_name = models.CharField(max_length=200, blank=True, verbose_name='نام کلینیک/مطب')
    logo = models.ImageField(upload_to='clinic_logos/', blank=True, null=True, verbose_name='لوگو')
    address = models.TextField(blank=True, verbose_name='آدرس مطب')
    phone = models.CharField(max_length=20, blank=True, verbose_name='تلفن مطب')
    phone2 = models.CharField(max_length=20, blank=True, verbose_name='تلفن دوم مطب')
    sms_api_key_enc = models.TextField(blank=True, verbose_name='API Key رمزنگاری شده')
    sms_api_base = models.CharField(max_length=300, blank=True, default='https://console.melipayamak.com/api', verbose_name='آدرس API سامانه پیامک')
    sms_username_enc = models.TextField(blank=True, verbose_name='نام کاربری رمزنگاری شده')
    sms_password_enc = models.TextField(blank=True, verbose_name='رمز عبور رمزنگاری شده')
    sms_line_number = models.CharField(max_length=30, blank=True, verbose_name='شماره خط ارسال')
    sms_provider = models.CharField(max_length=20, blank=True, default='melipayamak', verbose_name='ارائه‌دهنده پیامک')

    _sms_api_key = EncryptedField('sms_api_key_enc')
    _sms_username = EncryptedField('sms_username_enc')
    _sms_password = EncryptedField('sms_password_enc')

    class Meta:
        verbose_name = 'تنظیمات کلینیک'
        verbose_name_plural = 'تنظیمات کلینیک'

    def __str__(self):
        return 'تنظیمات کلینیک'

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

    @property
    def sms_api_key(self):
        return self._sms_api_key

    @sms_api_key.setter
    def sms_api_key(self, value):
        self._sms_api_key = value

    @property
    def sms_username(self):
        return self._sms_username

    @sms_username.setter
    def sms_username(self, value):
        self._sms_username = value

    @property
    def sms_password(self):
        return self._sms_password

    @sms_password.setter
    def sms_password(self, value):
        self._sms_password = value
