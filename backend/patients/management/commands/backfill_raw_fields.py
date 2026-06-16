from django.core.management.base import BaseCommand
from patients.models import Patient


class Command(BaseCommand):
    help = 'Backfill national_id_raw, phone_raw etc. from encrypted fields for all patients'

    def handle(self, *args, **options):
        qs = Patient.objects.all()
        total = qs.count()
        updated = 0
        for patient in qs:
            needs_save = False
            if patient.national_id_enc and not patient.national_id_raw:
                patient.national_id_raw = patient._national_id or ''
                needs_save = True
            if patient.phone_enc and not patient.phone_raw:
                patient.phone_raw = patient._phone or ''
                needs_save = True
            if patient.emergency_phone_enc and not patient.emergency_phone_raw:
                patient.emergency_phone_raw = patient._emergency_phone or ''
                needs_save = True
            if patient.address_enc and not patient.address_raw:
                patient.address_raw = patient._address or ''
                needs_save = True
            if patient.medical_history_enc and not patient.medical_history_raw:
                patient.medical_history_raw = patient._medical_history or ''
                needs_save = True
            if needs_save:
                patient.save(update_fields=[
                    'national_id_raw', 'phone_raw',
                    'emergency_phone_raw', 'address_raw', 'medical_history_raw',
                ])
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f'Backfill complete: {updated}/{total} patients updated'
        ))
