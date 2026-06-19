from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import MedicalRecord, MedicalRecordFile, DicomFile


@receiver(post_delete, sender=MedicalRecord)
def delete_medical_record_files(sender, instance, **kwargs):
    if instance.voice_note:
        try:
            instance.voice_note.delete(save=False)
        except Exception:
            pass


@receiver(post_delete, sender=MedicalRecordFile)
def delete_medical_record_file(sender, instance, **kwargs):
    if instance.file:
        try:
            instance.file.delete(save=False)
        except Exception:
            pass


@receiver(post_delete, sender=DicomFile)
def delete_dicom_files(sender, instance, **kwargs):
    if instance.file:
        try:
            instance.file.delete(save=False)
        except Exception:
            pass
    if instance.thumbnail:
        try:
            instance.thumbnail.delete(save=False)
        except Exception:
            pass
