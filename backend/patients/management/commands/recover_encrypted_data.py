import hashlib
import sqlite3
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from patients.models import Patient
from utils.encryption import encrypt_value


class Command(BaseCommand):
    help = 'Recover patient data from old (pre-migration) database'

    def add_arguments(self, parser):
        parser.add_argument('old_db_path', nargs='?', default=None,
                            help='Path to old db.sqlite3 file')

    def handle(self, *args, **options):
        old_db = options['old_db_path']
        if not old_db:
            old_db = os.path.join(settings.BASE_DIR, '..', 'db.sqlite3')

        if not os.path.exists(old_db):
            self.stderr.write(f'Old database not found: {old_db}')
            return

        conn = sqlite3.connect(old_db)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        cur.execute("PRAGMA table_info('patients_patient')")
        cols = [r[1] for r in cur.fetchall()]

        if 'national_id' not in cols:
            self.stdout.write('Old database already has new schema, nothing to recover')
            conn.close()
            return

        cur.execute('SELECT id, national_id, phone, emergency_phone, address, medical_history FROM patients_patient')
        rows = cur.fetchall()
        conn.close()

        updated = 0
        for row in rows:
            pid = row['id']
            try:
                patient = Patient.objects.get(id=pid)
            except Patient.DoesNotExist:
                continue

            changed = False

            if row['national_id'] and not patient.national_id_enc:
                patient.national_id_enc = encrypt_value(str(row['national_id']))
                patient.national_id_hash = hashlib.sha256(str(row['national_id']).encode()).hexdigest()
                changed = True

            if row['phone'] and not patient.phone_enc:
                patient.phone_enc = encrypt_value(str(row['phone']))
                patient.phone_hash = hashlib.sha256(str(row['phone']).encode()).hexdigest()
                changed = True

            if row['emergency_phone'] and not patient.emergency_phone_enc:
                patient.emergency_phone_enc = encrypt_value(str(row['emergency_phone']))
                changed = True

            if row['address'] and not patient.address_enc:
                patient.address_enc = encrypt_value(str(row['address']))
                changed = True

            if row['medical_history'] and not patient.medical_history_enc:
                patient.medical_history_enc = encrypt_value(str(row['medical_history']))
                changed = True

            if changed:
                patient.save(update_fields=[
                    'national_id_enc', 'national_id_hash',
                    'phone_enc', 'phone_hash',
                    'emergency_phone_enc', 'address_enc', 'medical_history_enc',
                ])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f'Recovered {updated} patients'))
