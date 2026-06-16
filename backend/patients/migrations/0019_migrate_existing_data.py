import hashlib

from django.db import migrations
from utils.encryption import encrypt_value


def migrate_patient_data(apps, schema_editor):
    Patient = apps.get_model('patients', 'Patient')
    for patient in Patient.objects.all():
        changed = False

        if patient.national_id_raw and not patient.national_id_enc:
            patient.national_id_enc = encrypt_value(patient.national_id_raw)
            patient.national_id_hash = hashlib.sha256(patient.national_id_raw.encode()).hexdigest()
            changed = True

        if patient.phone_raw and not patient.phone_enc:
            patient.phone_enc = encrypt_value(patient.phone_raw)
            patient.phone_hash = hashlib.sha256(patient.phone_raw.encode()).hexdigest()
            changed = True

        if patient.emergency_phone_raw and not patient.emergency_phone_enc:
            patient.emergency_phone_enc = encrypt_value(patient.emergency_phone_raw)
            changed = True

        if patient.address_raw and not patient.address_enc:
            patient.address_enc = encrypt_value(patient.address_raw)
            changed = True

        if patient.medical_history_raw and not patient.medical_history_enc:
            patient.medical_history_enc = encrypt_value(patient.medical_history_raw)
            changed = True

        if changed:
            patient.save(update_fields=[
                'national_id_enc', 'national_id_hash',
                'phone_enc', 'phone_hash',
                'emergency_phone_enc',
                'address_enc',
                'medical_history_enc',
            ])


def reverse_migrate_patient_data(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0018_encrypt_patient_pii'),
    ]

    operations = [
        migrations.RunPython(migrate_patient_data, reverse_migrate_patient_data),
    ]
