from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Appointment


def _send_appointment_update(instance, action):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        'appointments',
        {
            'type': 'appointment_update',
            'action': action,
            'appointment_id': instance.id,
            'doctor_id': instance.doctor_id,
        }
    )


@receiver(post_save, sender=Appointment)
def appointment_saved(sender, instance, created, **kwargs):
    _send_appointment_update(instance, 'created' if created else 'updated')


@receiver(post_delete, sender=Appointment)
def appointment_deleted(sender, instance, **kwargs):
    _send_appointment_update(instance, 'deleted')
