import pytest
from datetime import date, time
from .models import Appointment


class TestAppointmentAPI:
    def test_create_appointment(self, auth_client, sample_patient, doctor_user):
        from accounts.models import TreatmentType
        tt = TreatmentType.objects.create(name='ویزیت')
        response = auth_client.post('/api/appointments/', {
            'patient': sample_patient.id,
            'doctor': doctor_user.id,
            'treatment_type': tt.id,
            'date': '2025-06-15',
            'time': '10:30',
        })
        assert response.status_code == 201
        assert response.data['daily_number'] == 1

    def test_today_appointments(self, auth_client, sample_patient, doctor_user):
        from accounts.models import TreatmentType
        tt = TreatmentType.objects.create(name='ویزیت')
        from django.utils import timezone
        today = timezone.localdate()
        Appointment.objects.create(
            patient=sample_patient,
            doctor=doctor_user,
            treatment_type=tt,
            date=today,
            time=time(10, 0),
        )
        response = auth_client.get('/api/appointments/today/')
        assert response.status_code == 200
        assert len(response.data) >= 1


@pytest.mark.smoke
class TestAppointmentSmoke:
    def test_appointment_list(self, auth_client):
        response = auth_client.get('/api/appointments/')
        assert response.status_code == 200
