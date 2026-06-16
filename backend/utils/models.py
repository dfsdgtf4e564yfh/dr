from django.db import models
from django.conf import settings
from django.utils import timezone
from typing import Optional


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین ویرایش')

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    is_deleted = models.BooleanField(default=False, verbose_name='حذف شده')
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ حذف')
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name='حذف کننده'
    )

    class Meta:
        abstract = True

    def soft_delete(self, user=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    @classmethod
    def live_objects(cls):
        return cls.objects.filter(is_deleted=False)

    @classmethod
    def deleted_objects(cls):
        return cls.objects.filter(is_deleted=True)

    @classmethod
    def all_objects(cls):
        return cls.objects.all()


class AuditLoggedModel(models.Model):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='%(class)s_created', verbose_name='ثبت کننده'
    )

    class Meta:
        abstract = True


class BaseModel(TimestampedModel, SoftDeleteMixin, AuditLoggedModel):
    class Meta:
        abstract = True
