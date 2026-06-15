import hashlib
import secrets
from datetime import timedelta
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from utils.models import BaseModel
from utils.encryption import EncryptedField


EDUCATION_CHOICES = [
    ('ciclu', 'سیکل'),
    ('diplom', 'دیپلم'),
    ('super_diplom', 'فوق دیپلم'),
    ('licence', 'لیسانس'),
    ('master', 'فوق لیسانس'),
    ('doctora', 'دکترا'),
]

JOB_CHOICES = [
    ('doctor', 'پزشک'),
    ('midwife', 'ماما'),
    ('engineer', 'مهندس'),
    ('nurse', 'پرستار'),
    ('employee', 'کارمند'),
    ('worker', 'کارگر'),
    ('housewife', 'خانه دار'),
    ('freelance', 'آزاد'),
]

INSURANCE_BOOKLET_CHOICES = [
    ('none', 'ندارد'),
    ('social_security', 'تأمین اجتماعی'),
    ('health_services', 'خدمات بهداشتی درمانی'),
    ('military', 'نیروهای مسلح'),
    ('other', 'سایر'),
]


def get_next_file_number() -> str:
    with transaction.atomic():
        last = Patient.objects.filter(
            file_number__startswith='K-T-'
        ).select_for_update().order_by('-id').first()

        if last and last.file_number and last.file_number.startswith('K-T-'):
            try:
                last_num = int(last.file_number.replace('K-T-', ''))
                return f'K-T-{last_num + 1:03d}'
            except (ValueError, IndexError):
                pass
        return 'K-T-001'


class Patient(BaseModel):
    GENDER_CHOICES = [('male', 'مرد'), ('female', 'زن')]
    first_name = models.CharField(max_length=100, verbose_name='نام')
    last_name = models.CharField(max_length=100, verbose_name='نام خانوادگی')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male', verbose_name='جنسیت')
    father_name = models.CharField(max_length=100, blank=True, verbose_name='نام پدر')
    national_id_raw = models.CharField(max_length=10, db_index=True, blank=True, null=True, verbose_name='کد ملی (قدیمی)')
    national_id_enc = models.TextField(blank=True, verbose_name='کد ملی (رمزنگاری شده)')
    national_id_hash = models.CharField(max_length=64, blank=True, db_index=True, verbose_name='هش کد ملی')
    file_number = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name='شماره پرونده',
                                   error_messages={'unique': 'این شماره پرونده قبلاً ثبت شده است'})
    old_file_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='شماره پرونده قدیمی')
    insurance_booklet = models.CharField(max_length=20, choices=INSURANCE_BOOKLET_CHOICES, default='none', verbose_name='نوع دفترچه')
    education = models.CharField(max_length=20, choices=EDUCATION_CHOICES, blank=True, null=True, verbose_name='تحصیلات')
    job = models.CharField(max_length=50, choices=JOB_CHOICES, blank=True, null=True, verbose_name='شغل')
    phone_raw = models.CharField(max_length=20, blank=True, null=True, verbose_name='تلفن (قدیمی)')
    phone_enc = models.TextField(blank=True, verbose_name='تلفن (رمزنگاری شده)')
    phone_hash = models.CharField(max_length=64, blank=True, db_index=True, verbose_name='هش تلفن')
    emergency_phone_raw = models.CharField(max_length=20, blank=True, null=True, verbose_name='تلفن اضطراری (قدیمی)')
    emergency_phone_enc = models.TextField(blank=True, verbose_name='تلفن اضطراری (رمزنگاری شده)')
    birth_date = models.DateField(null=True, blank=True, verbose_name='تاریخ تولد')
    first_visit_date = models.DateField(null=True, blank=True, verbose_name='اولین مراجعه')
    routine_medications = models.TextField(blank=True, verbose_name='داروهای روتین')
    address_raw = models.TextField(blank=True, null=True, verbose_name='آدرس (قدیمی)')
    address_enc = models.TextField(blank=True, verbose_name='آدرس (رمزنگاری شده)')
    medical_history_raw = models.TextField(blank=True, null=True, verbose_name='تاریخچه پزشکی (قدیمی)')
    medical_history_enc = models.TextField(blank=True, verbose_name='تاریخچه پزشکی (رمزنگاری شده)')

    _national_id = EncryptedField('national_id_enc')
    _phone = EncryptedField('phone_enc')
    _emergency_phone = EncryptedField('emergency_phone_enc')
    _address = EncryptedField('address_enc')
    _medical_history = EncryptedField('medical_history_enc')

    @property
    def national_id(self):
        val = self._national_id
        if val:
            return val
        return self.national_id_raw

    @national_id.setter
    def national_id(self, value):
        self._national_id = value
        self.national_id_raw = value or ''
        self.national_id_hash = hashlib.sha256((value or '').encode()).hexdigest()

    @property
    def phone(self):
        val = self._phone
        if val:
            return val
        return self.phone_raw

    @phone.setter
    def phone(self, value):
        self._phone = value
        self.phone_raw = value or ''
        self.phone_hash = hashlib.sha256((value or '').encode()).hexdigest()

    @property
    def emergency_phone(self):
        val = self._emergency_phone
        if val:
            return val
        return self.emergency_phone_raw

    @emergency_phone.setter
    def emergency_phone(self, value):
        self._emergency_phone = value
        self.emergency_phone_raw = value or ''

    @property
    def address(self):
        val = self._address
        if val:
            return val
        return self.address_raw

    @address.setter
    def address(self, value):
        self._address = value
        self.address_raw = value or ''

    @property
    def medical_history(self):
        val = self._medical_history
        if val:
            return val
        return self.medical_history_raw

    @medical_history.setter
    def medical_history(self, value):
        self._medical_history = value
        self.medical_history_raw = value or ''

    class Meta:
        verbose_name = 'بیمار'
        verbose_name_plural = 'بیماران'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['national_id_hash']),
            models.Index(fields=['phone_hash']),
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['file_number']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_name', 'first_name']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def age(self):
        if not self.birth_date:
            return None
        from datetime import date
        from calendar import monthrange
        today = date.today()
        years = today.year - self.birth_date.year
        months = today.month - self.birth_date.month
        days = today.day - self.birth_date.day
        if days < 0:
            prev_month = today.month - 1 if today.month > 1 else 12
            prev_year = today.year if today.month > 1 else today.year - 1
            days += monthrange(prev_year, prev_month)[1]
            months -= 1
        if months < 0:
            months += 12
            years -= 1
        return {'years': years, 'months': months, 'days': days}

    def save(self, *args, **kwargs):
        if not self.file_number and not getattr(self, '_skip_file_number', False):
            self.file_number = get_next_file_number()
        if self.national_id_enc and not self.national_id_raw:
            self.national_id_raw = self._national_id or ''
        elif self.national_id_raw and not self.national_id_enc:
            self._national_id = self.national_id_raw
        if self.phone_enc and not self.phone_raw:
            self.phone_raw = self._phone or ''
        elif self.phone_raw and not self.phone_enc:
            self._phone = self.phone_raw
        if self.emergency_phone_enc and not self.emergency_phone_raw:
            self.emergency_phone_raw = self._emergency_phone or ''
        elif self.emergency_phone_raw and not self.emergency_phone_enc:
            self._emergency_phone = self.emergency_phone_raw
        if self.address_enc and not self.address_raw:
            self.address_raw = self._address or ''
        elif self.address_raw and not self.address_enc:
            self._address = self.address_raw
        if self.medical_history_enc and not self.medical_history_raw:
            self.medical_history_raw = self._medical_history or ''
        elif self.medical_history_raw and not self.medical_history_enc:
            self._medical_history = self.medical_history_raw
        super().save(*args, **kwargs)

    def soft_delete(self, user=None):
        self._skip_file_number = True
        self.file_number = f'DELETED-{self.pk}-{int(timezone.now().timestamp())}' if self.pk else None
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'file_number'])

    def restore(self):
        from .models import get_next_file_number
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.file_number = get_next_file_number()
        self.save()


class PatientTag(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='نام برچسب')
    color = models.CharField(max_length=7, default='#3B82F6', verbose_name='رنگ برچسب')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')

    class Meta:
        verbose_name = 'برچسب بیمار'
        verbose_name_plural = 'برچسب‌های بیمار'
        ordering = ['name']

    def __str__(self):
        return self.name


class PatientTagAssignment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='tag_assignments', verbose_name='بیمار')
    tag = models.ForeignKey(PatientTag, on_delete=models.CASCADE, related_name='assignments', verbose_name='برچسب')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='ثبت کننده')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')

    class Meta:
        verbose_name = 'اختصاص برچسب'
        verbose_name_plural = 'اختصاص برچسب‌ها'
        unique_together = ['patient', 'tag']

    def __str__(self):
        return f"{self.patient} - {self.tag}"


class SupportMessage(models.Model):
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE,
        related_name='support_messages', verbose_name='بیمار'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='support_messages_sent', verbose_name='فرستنده'
    )
    subject = models.CharField(max_length=200, verbose_name='موضوع')
    message = models.TextField(verbose_name='متن پیام')
    reply = models.TextField(blank=True, verbose_name='پاسخ')
    attachment = models.FileField(upload_to='support_attachments/', blank=True, null=True, verbose_name='فایل ضمیمه')
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'در انتظار پاسخ'), ('answered', 'پاسخ داده شده')],
        default='pending', verbose_name='وضعیت'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    replied_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ پاسخ')

    class Meta:
        verbose_name = 'پیام پشتیبانی'
        verbose_name_plural = 'پیام‌های پشتیبانی'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} - {self.patient}"


class ReferralLetter(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='referral_letters', verbose_name='بیمار')
    from_doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals_sent', verbose_name='پزشک ارجاع دهنده')
    to_doctor = models.CharField(max_length=200, blank=True, verbose_name='پزشک/مرکز مقصد')
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals_received', verbose_name='کاربر مقصد (داخلی)')
    date = models.DateField(verbose_name='تاریخ ارجاع')
    drug = models.CharField(max_length=500, blank=True, verbose_name='داروی مصرفی')
    description = models.TextField(verbose_name='شرح ارجاع')
    file = models.FileField(upload_to='referrals/', blank=True, null=True, verbose_name='فایل ضمیمه')
    status = models.CharField(max_length=20, choices=[('sent', 'ارسال شده'), ('received', 'دریافت شده'), ('answered', 'پاسخ داده شده')], default='sent', verbose_name='وضعیت')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='referral_creations', verbose_name='ثبت کننده')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین ویرایش')

    class Meta:
        verbose_name = 'نامه ارجاع'
        verbose_name_plural = 'نامه‌های ارجاع'
        ordering = ['-date']

    def __str__(self):
        return f"ارجاع {self.patient} - {self.date}"


class PortalOTP(models.Model):
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE,
        related_name='portal_otps', verbose_name='بیمار'
    )
    code = models.CharField(max_length=6, verbose_name='کد تایید')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    is_used = models.BooleanField(default=False, verbose_name='استفاده شده')

    class Meta:
        verbose_name = 'کد تایید پورتال'
        verbose_name_plural = 'کدهای تایید پورتال'

    def is_valid(self):
        if self.is_used:
            return False
        return (timezone.now() - self.created_at).total_seconds() < 300

    def __str__(self):
        return f"کد {self.code} - {self.patient}"


class PatientPortalSession(models.Model):
    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE,
        related_name='portal_sessions', verbose_name='بیمار'
    )
    token = models.CharField(max_length=64, unique=True, db_index=True, verbose_name='توکن')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    expires_at = models.DateTimeField(verbose_name='تاریخ انقضا')

    class Meta:
        verbose_name = 'نشست پورتال بیمار'
        verbose_name_plural = 'نشست‌های پورتال بیمار'

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_hex(32)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.is_expired()

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"نشست {self.patient} - {self.created_at}"
