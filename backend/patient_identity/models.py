from django.db import models
from django.conf import settings
from utils.encryption import EncryptedField


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
    fingerprint_data_raw = models.TextField(
        blank=True, null=True, verbose_name='داده اثر انگشت (قدیمی)'
    )
    fingerprint_data_enc = models.TextField(
        blank=True, null=True, verbose_name='داده اثر انگشت (رمزنگاری شده)'
    )
    id_card_number_raw = models.CharField(
        max_length=20, blank=True, verbose_name='شماره شناسنامه (قدیمی)'
    )
    id_card_number_enc = models.TextField(
        blank=True, verbose_name='شماره شناسنامه (رمزنگاری شده)'
    )
    id_card_serial_raw = models.CharField(
        max_length=20, blank=True, verbose_name='سریال شناسنامه (قدیمی)'
    )
    id_card_serial_enc = models.TextField(
        blank=True, verbose_name='سریال شناسنامه (رمزنگاری شده)'
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
    emergency_contact_phone_raw = models.CharField(
        max_length=15, blank=True, verbose_name='تلفن شخص اضطراری (قدیمی)'
    )
    emergency_contact_phone_enc = models.TextField(
        blank=True, verbose_name='تلفن شخص اضطراری (رمزنگاری شده)'
    )
    notes_enc = models.TextField(blank=True, verbose_name='یادداشت‌ها (رمزنگاری شده)')
    notes_raw = models.TextField(blank=True, verbose_name='یادداشت‌ها (قدیمی)')
    verified_at = models.DateTimeField(
        null=True, blank=True, verbose_name='تاریخ تأیید هویت'
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='تأیید کننده'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین ویرایش')

    _fingerprint_data = EncryptedField('fingerprint_data_enc')
    _id_card_number = EncryptedField('id_card_number_enc')
    _id_card_serial = EncryptedField('id_card_serial_enc')
    _emergency_contact_phone = EncryptedField('emergency_contact_phone_enc')
    _notes = EncryptedField('notes_enc')

    @property
    def fingerprint_data(self):
        val = self._fingerprint_data
        return val if val else self.fingerprint_data_raw

    @fingerprint_data.setter
    def fingerprint_data(self, value):
        self._fingerprint_data = value
        self.fingerprint_data_raw = ''

    @property
    def id_card_number(self):
        val = self._id_card_number
        return val if val else self.id_card_number_raw

    @id_card_number.setter
    def id_card_number(self, value):
        self._id_card_number = value
        self.id_card_number_raw = ''

    @property
    def id_card_serial(self):
        val = self._id_card_serial
        return val if val else self.id_card_serial_raw

    @id_card_serial.setter
    def id_card_serial(self, value):
        self._id_card_serial = value
        self.id_card_serial_raw = ''

    @property
    def emergency_contact_phone(self):
        val = self._emergency_contact_phone
        return val if val else self.emergency_contact_phone_raw

    @emergency_contact_phone.setter
    def emergency_contact_phone(self, value):
        self._emergency_contact_phone = value
        self.emergency_contact_phone_raw = ''

    @property
    def notes(self):
        val = self._notes
        return val if val else self.notes_raw

    @notes.setter
    def notes(self, value):
        self._notes = value
        self.notes_raw = ''

    def save(self, *args, **kwargs):
        if self.fingerprint_data_raw and not self.fingerprint_data_enc:
            self._fingerprint_data = self.fingerprint_data_raw
            self.fingerprint_data_raw = ''
        if self.id_card_number_raw and not self.id_card_number_enc:
            self._id_card_number = self.id_card_number_raw
            self.id_card_number_raw = ''
        if self.id_card_serial_raw and not self.id_card_serial_enc:
            self._id_card_serial = self.id_card_serial_raw
            self.id_card_serial_raw = ''
        if self.emergency_contact_phone_raw and not self.emergency_contact_phone_enc:
            self._emergency_contact_phone = self.emergency_contact_phone_raw
            self.emergency_contact_phone_raw = ''
        if self.notes_raw and not self.notes_enc:
            self._notes = self.notes_raw
            self.notes_raw = ''
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'هویت بیمار'
        verbose_name_plural = 'هویت بیماران'

    def __str__(self):
        return f"هویت {self.patient}"
