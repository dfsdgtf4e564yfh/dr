from django.db import models
from django.conf import settings
from utils.models import BaseModel


class MedicalRecord(BaseModel):
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='medical_records', verbose_name='بیمار'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='medical_records', verbose_name='پزشک'
    )
    appointment = models.ForeignKey(
        'appointments.Appointment', on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='نوبت مرتبط'
    )
    session_number = models.PositiveIntegerField(verbose_name='شماره جلسه')
    date = models.DateField(verbose_name='تاریخ جلسه')
    diagnosis = models.TextField(blank=True, verbose_name='تشخیص')
    treatment_plan = models.TextField(blank=True, verbose_name='طرح درمان')
    notes = models.TextField(blank=True, verbose_name='یادداشت‌های پزشک')
    prescription = models.TextField(blank=True, verbose_name='نسخه')
    voice_note = models.FileField(upload_to='voice_notes/', blank=True, null=True, verbose_name='یادداشت صوتی')
    voice_transcription = models.TextField(blank=True, verbose_name='متن تشخیص داده شده از صوت')

    class Meta:
        verbose_name = 'پرونده درمانی'
        verbose_name_plural = 'پرونده‌های درمانی'
        ordering = ['-date', '-session_number']
        unique_together = ['patient', 'doctor', 'session_number']
        indexes = [
            models.Index(fields=['patient', 'doctor']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"جلسه {self.session_number} - {self.patient}"


class CommonDiagnosis(models.Model):
    title = models.CharField(max_length=200, verbose_name='عنوان تشخیص')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        verbose_name = 'تشخیص آماده'
        verbose_name_plural = 'تشخیص‌های آماده'
        ordering = ['title']

    def __str__(self):
        return self.title


class CommonDrug(models.Model):
    name = models.CharField(max_length=200, verbose_name='نام دارو')
    dosage_unit = models.CharField(max_length=50, default='میلی‌گرم', verbose_name='واحد مقدار')
    default_dosage = models.CharField(max_length=100, blank=True, verbose_name='مقدار پیش‌فرض')
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        verbose_name = 'داروی آماده'
        verbose_name_plural = 'داروهای آماده'
        ordering = ['name']

    def __str__(self):
        return self.name


class CommonTreatmentPlan(models.Model):
    title = models.CharField(max_length=200, verbose_name='عنوان طرح درمان')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        verbose_name = 'طرح درمان آماده'
        verbose_name_plural = 'طرح‌های درمان آماده'
        ordering = ['title']

    def __str__(self):
        return self.title


class MedicalRecordFile(models.Model):
    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE,
        related_name='files', verbose_name='پرونده درمانی'
    )
    file = models.FileField(upload_to='medical_files/%Y/%m/', verbose_name='فایل')
    description = models.CharField(max_length=255, blank=True, verbose_name='توضیحات')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ بارگذاری')

    class Meta:
        verbose_name = 'فایل پرونده'
        verbose_name_plural = 'فایل‌های پرونده'

    def __str__(self):
        return self.description or f"فایل {self.id}"


class TmsForm(BaseModel):
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='tms_forms', verbose_name='بیمار'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='tms_forms', verbose_name='پزشک'
    )
    date = models.DateField(verbose_name='تاریخ')
    service_code = models.CharField(max_length=20, default='900115', verbose_name='کد خدمت')

    current_mood = models.TextField(blank=True, verbose_name='خلقی')
    current_psychotic = models.TextField(blank=True, verbose_name='سایکوتیک')
    current_substance = models.TextField(blank=True, verbose_name='ناشی از مواد')
    current_anxiety = models.TextField(blank=True, verbose_name='اضطرابی')
    current_cognitive = models.TextField(blank=True, verbose_name='شناختی')
    current_physical = models.TextField(blank=True, verbose_name='جسمانی')
    current_personality_disorder = models.TextField(blank=True, verbose_name='اختلال شخصیت')
    current_ocd = models.TextField(blank=True, verbose_name='اختلال وسواسی')
    previous_diagnosis = models.TextField(blank=True, verbose_name='تشخیص قبلی')
    current_diagnosis = models.TextField(blank=True, verbose_name='تشخیص فعلی')
    treatment_history = models.TextField(blank=True, verbose_name='سوابق درمانی')
    current_medications = models.TextField(blank=True, verbose_name='داروهای فعلی')
    tms_usage = models.TextField(blank=True, verbose_name='موارد استفاده از TMS')
    qeeg_findings = models.TextField(blank=True, verbose_name='یافته QEEG')
    protocol1 = models.TextField(blank=True, verbose_name='پروتکل 1')
    protocol2 = models.TextField(blank=True, verbose_name='پروتکل 2')
    protocol3 = models.TextField(blank=True, verbose_name='پروتکل 3')
    sessions = models.JSONField(default=list, blank=True, verbose_name='جلسات درمان')
    consent_patient_name = models.CharField(max_length=200, blank=True, verbose_name='نام بیمار در رضایت‌نامه')
    consent_father_name = models.CharField(max_length=200, blank=True, verbose_name='نام پدر در رضایت‌نامه')
    consent_signature = models.TextField(blank=True, verbose_name='امضای بیمار')

    class Meta:
        verbose_name = 'فرم TMS'
        verbose_name_plural = 'فرم‌های TMS'
        ordering = ['-date']

    def __str__(self):
        return f"TMS - {self.patient} - {self.date}"


class VisitTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('neurology', 'نورولوژی'),
        ('psychiatry', 'روانپزشکی'),
        ('general', 'عمومی'),
    ]
    title = models.CharField(max_length=200, unique=True, verbose_name='عنوان قالب')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name='تخصص')
    diagnosis_template = models.TextField(blank=True, verbose_name='الگوی تشخیص')
    treatment_plan_template = models.TextField(blank=True, verbose_name='الگوی طرح درمان')
    notes_template = models.TextField(blank=True, verbose_name='الگوی یادداشت')
    prescription_template = models.TextField(blank=True, verbose_name='الگوی نسخه')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='visit_templates', verbose_name='ایجاد کننده'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین ویرایش')

    class Meta:
        verbose_name = 'قالب ویزیت'
        verbose_name_plural = 'قالب‌های ویزیت'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='کاربر'
    )
    action = models.CharField(max_length=50, verbose_name='عملیات')
    model_name = models.CharField(max_length=100, verbose_name='نام مدل')
    object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name='شناسه')
    details = models.JSONField(default=dict, blank=True, verbose_name='جزئیات')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='آدرس IP')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='زمان')

    class Meta:
        verbose_name = 'لاگ'
        verbose_name_plural = 'لاگ‌ها'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['user']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name}"


class DicomFile(models.Model):
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='dicom_files', verbose_name='بیمار')
    medical_record = models.ForeignKey('MedicalRecord', on_delete=models.SET_NULL, null=True, blank=True, related_name='dicom_files', verbose_name='پرونده پزشکی')
    file = models.FileField(upload_to='dicom_files/', verbose_name='فایل DICOM')
    thumbnail = models.FileField(upload_to='dicom_thumbnails/', blank=True, null=True, verbose_name='تصویر بندانگشتی')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='متادیتا')
    study_uid = models.CharField(max_length=100, blank=True, verbose_name='شناسه مطالعه')
    series_uid = models.CharField(max_length=100, blank=True, verbose_name='شناسه سری')
    modality = models.CharField(max_length=20, blank=True, verbose_name='مودالیته')
    description = models.CharField(max_length=255, blank=True, verbose_name='توضیحات')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='آپلود کننده')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ آپلود')

    class Meta:
        verbose_name = 'فایل DICOM'
        verbose_name_plural = 'فایل‌های DICOM'
        ordering = ['-created_at']

    def __str__(self):
        return f"DICOM - {self.patient} - {self.modality or 'N/A'}"
