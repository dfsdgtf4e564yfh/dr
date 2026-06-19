from django.db import migrations
from utils.encryption import hash_value


def rehash_with_hmac(apps, schema_editor):
    Patient = apps.get_model('patients', 'Patient')
    for patient in Patient.objects.all().iterator(chunk_size=500):
        changed = False
        if patient.national_id_raw:
            new_hash = hash_value(patient.national_id_raw)
            if patient.national_id_hash != new_hash:
                patient.national_id_hash = new_hash
                changed = True
        elif patient.national_id_enc:
            from utils.encryption import decrypt_value
            try:
                plain = decrypt_value(patient.national_id_enc)
                if plain:
                    patient.national_id_hash = hash_value(plain)
                    changed = True
            except Exception:
                pass
        if patient.phone_raw:
            new_hash = hash_value(patient.phone_raw)
            if patient.phone_hash != new_hash:
                patient.phone_hash = new_hash
                changed = True
        elif patient.phone_enc:
            from utils.encryption import decrypt_value
            try:
                plain = decrypt_value(patient.phone_enc)
                if plain:
                    patient.phone_hash = hash_value(plain)
                    changed = True
            except Exception:
                pass
        if changed:
            patient.save(update_fields=['national_id_hash', 'phone_hash'])


def reverse_rehash(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0021_clear_raw_fields'),
    ]

    operations = [
        migrations.RunPython(rehash_with_hmac, reverse_rehash),
    ]
