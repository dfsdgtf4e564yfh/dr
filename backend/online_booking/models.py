from django.db import models
from django.conf import settings
from django.utils import timezone


class Holiday(models.Model):
    date = models.DateField(unique=True, verbose_name='تاریخ')
    reason = models.CharField(max_length=200, blank=True, verbose_name='دلیل')
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    class Meta:
        verbose_name = 'تعطیلی'
        verbose_name_plural = 'تعطیلات'
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} - {self.reason or "تعطیل"}'


class ClinicConfig(models.Model):
    key = models.CharField(max_length=100, unique=True, verbose_name='کلید')
    value = models.TextField(blank=True, verbose_name='مقدار')

    class Meta:
        verbose_name = 'تنظیمات کلینیک'
        verbose_name_plural = 'تنظیمات کلینیک'

    def __str__(self):
        return self.key


def get_config(key, default=''):
    obj = ClinicConfig.objects.filter(key=key).first()
    return obj.value if obj else default


def set_config(key, value):
    obj, _ = ClinicConfig.objects.get_or_create(key=key, defaults={'value': value})
    obj.value = value
    obj.save()
