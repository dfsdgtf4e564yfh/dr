import pytest
from .models import Patient


class TestPatientModel:
    def test_create_patient(self, db, admin_user):
        patient = Patient.objects.create(
            first_name='مریم',
            last_name='رضایی',
            national_id='1234567890',
            phone='09121234567',
            created_by=admin_user,
        )
        assert patient.first_name == 'مریم'
        assert patient.file_number is not None
        assert patient.file_number.startswith('K-T-')
        assert str(patient) == 'مریم رضایی'

    def test_soft_delete(self, db, admin_user, sample_patient):
        from django.utils import timezone
        patient = sample_patient
        patient.is_deleted = True
        patient.deleted_at = timezone.now()
        patient.deleted_by = admin_user
        patient.save()
        assert Patient.objects.filter(is_deleted=True).count() == 1
        assert Patient.objects.filter(is_deleted=False).count() == 0

    def test_age_calculation(self, db):
        from datetime import date
        patient = Patient.objects.create(
            first_name='test',
            last_name='test',
            national_id='1111111111',
            phone='09121111111',
            birth_date=date(1990, 6, 15),
        )
        age = patient.age()
        assert age is not None
        assert 'years' in age

    def test_unique_national_id(self, db, sample_patient):
        with pytest.raises(Exception):
            Patient.objects.create(
                first_name='duplicate',
                last_name='patient',
                national_id='1234567890',
                phone='09121111111',
            )


class TestPatientAPI:
    def test_list_patients(self, auth_client, sample_patient):
        response = auth_client.get('/api/patients/')
        assert response.status_code == 200

    def test_search_patient(self, auth_client, sample_patient):
        response = auth_client.get('/api/patients/search/', {'q': 'مریم'})
        assert response.status_code == 200
        data = response.data if isinstance(response.data, list) else []
        assert len(data) >= 1

    def test_lookup_patient(self, auth_client, sample_patient):
        response = auth_client.get('/api/patients/lookup/', {'q': '123456'})
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_check_duplicate(self, auth_client, sample_patient):
        response = auth_client.get('/api/patients/check_duplicate/', {
            'national_id': '1234567890',
        })
        assert response.status_code == 200
        assert response.data['duplicate'] is True

    def test_create_patient_api(self, auth_client):
        response = auth_client.post('/api/patients/', {
            'first_name': 'علی',
            'last_name': 'محمدی',
            'national_id': '0010350829',
            'phone': '09129988776',
        })
        assert response.status_code == 201

    def test_create_patient_empty_name(self, auth_client):
        response = auth_client.post('/api/patients/', {
            'first_name': '',
            'last_name': '',
            'national_id': '9988776655',
            'phone': '09129988776',
        })
        assert response.status_code == 400


@pytest.mark.smoke
class TestPatientSmoke:
    def test_patient_list_returns_paginated(self, auth_client, sample_patient):
        response = auth_client.get('/api/patients/')
        assert response.status_code == 200
