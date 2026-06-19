from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import SupportMessage, ReferralLetter


@receiver(post_delete, sender=SupportMessage)
def delete_support_message_files(sender, instance, **kwargs):
    if instance.attachment:
        try:
            instance.attachment.delete(save=False)
        except Exception:
            pass


@receiver(post_delete, sender=ReferralLetter)
def delete_referral_letter_files(sender, instance, **kwargs):
    if instance.file:
        try:
            instance.file.delete(save=False)
        except Exception:
            pass
