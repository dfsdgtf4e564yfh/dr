import logging
from django.core.management.base import BaseCommand
from patients.models import Patient

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Backfill national_id_raw, phone_raw etc. from encrypted fields for all patients'

    def handle(self, *args, **options):
        qs = Patient.objects.all()
        total = qs.count()
        updated = 0
        errors = 0
        for patient in qs:
            needs_save = False
            if patient.national_id_enc and not patient.national_id_raw:
                val = patient._national_id
                if val:
                    patient.national_id_raw = val
                    needs_save = True
                else:
                    errors += 1
            if patient.phone_enc and not patient.phone_raw:
                val = patient._phone
                if val:
                    patient.phone_raw = val
                    needs_save = True
                else:
                    errors += 1
            if patient.emergency_phone_enc and not patient.emergency_phone_raw:
                val = patient._emergency_phone
                if val:
                    patient.emergency_phone_raw = val
                    needs_save = True
                else:
                    errors += 1
            if patient.address_enc and not patient.address_raw:
                val = patient._address
                if val:
                    patient.address_raw = val
                    needs_save = True
                else:
                    errors += 1
            if patient.medical_history_enc and not patient.medical_history_raw:
                val = patient._medical_history
                if val:
                    patient.medical_history_raw = val
                    needs_save = True
                else:
                    errors += 1
            if needs_save:
                patient.save(update_fields=[
                    'national_id_raw', 'phone_raw',
                    'emergency_phone_raw', 'address_raw', 'medical_history_raw',
                ])
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f'Backfill complete: {updated}/{total} patients updated ({errors} decryption errors)'
        ))
