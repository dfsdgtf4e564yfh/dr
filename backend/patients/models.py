from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from utils.models import BaseModel


EDUCATION_CHOICES = [
    ('ciclu', 'سیکل'),
    ('diplom', 'دیپلم'),
    ('super_diplom', 'فوق دیپلم'),
    ('licence', 'لیسانس'),
    ('master', 'فوق لیسانس'),
    ('doctora', 'دکترا'),
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
    national_id = models.CharField(max_length=10, unique=True, db_index=True, verbose_name='کد ملی',
                                   error_messages={'unique': 'این کد ملی قبلاً برای بیمار دیگری ثبت شده است'})
    file_number = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name='شماره پرونده',
                                   error_messages={'unique': 'این شماره پرونده قبلاً ثبت شده است'})
    old_file_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='شماره پرونده قدیمی')
    insurance_booklet = models.CharField(max_length=20, choices=INSURANCE_BOOKLET_CHOICES, default='none', verbose_name='نوع دفترچه')
    education = models.CharField(max_length=20, choices=EDUCATION_CHOICES, blank=True, null=True, verbose_name='تحصیلات')
    job = models.CharField(max_length=200, blank=True, null=True, verbose_name='شغل')
    phone = models.CharField(max_length=20, verbose_name='تلفن')
    emergency_phone = models.CharField(max_length=20, blank=True, verbose_name='تلفن اضطراری')
    birth_date = models.DateField(null=True, blank=True, verbose_name='تاریخ تولد')
    first_visit_date = models.DateField(null=True, blank=True, verbose_name='اولین مراجعه')
    routine_medications = models.TextField(blank=True, verbose_name='داروهای روتین')
    address = models.TextField(blank=True, verbose_name='آدرس')
    medical_history = models.TextField(blank=True, verbose_name='تاریخچه پزشکی')

    class Meta:
        verbose_name = 'بیمار'
        verbose_name_plural = 'بیماران'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['national_id']),
            models.Index(fields=['phone']),
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['file_number']),
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
