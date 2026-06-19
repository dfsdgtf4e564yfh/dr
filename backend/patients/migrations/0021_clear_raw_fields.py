from django.db import migrations


def clear_raw_fields(apps, schema_editor):
    Patient = apps.get_model('patients', 'Patient')
    for patient in Patient.objects.all():
        changed = False
        if patient.national_id_enc and patient.national_id_raw:
            patient.national_id_raw = ''
            changed = True
        if patient.phone_enc and patient.phone_raw:
            patient.phone_raw = ''
            changed = True
        if patient.emergency_phone_enc and patient.emergency_phone_raw:
            patient.emergency_phone_raw = ''
            changed = True
        if patient.address_enc and patient.address_raw:
            patient.address_raw = ''
            changed = True
        if patient.medical_history_enc and patient.medical_history_raw:
            patient.medical_history_raw = ''
            changed = True
        if changed:
            patient.save(update_fields=[
                'national_id_raw', 'phone_raw',
                'emergency_phone_raw', 'address_raw', 'medical_history_raw',
            ])


def reverse_clear_raw_fields(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0020_supportmessage_patient_nullable'),
    ]

    operations = [
        migrations.RunPython(clear_raw_fields, reverse_clear_raw_fields),
    ]
