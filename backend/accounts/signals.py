from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import User, ClinicSetting


@receiver(post_delete, sender=User)
def delete_user_files(sender, instance, **kwargs):
    if instance.signature:
        try:
            instance.signature.delete(save=False)
        except Exception:
            pass
    if instance.avatar:
        try:
            instance.avatar.delete(save=False)
        except Exception:
            pass


@receiver(post_delete, sender=ClinicSetting)
def delete_clinic_setting_files(sender, instance, **kwargs):
    if instance.logo:
        try:
            instance.logo.delete(save=False)
        except Exception:
            pass
