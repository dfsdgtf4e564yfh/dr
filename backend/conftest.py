import pytest
from django.contrib.auth import get_user_model


User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_superuser(
        username='admin',
        password='admin123',
        role='admin',
    )


@pytest.fixture
def doctor_user(db):
    return User.objects.create_user(
        username='doctor',
        password='doctor123',
        role='doctor',
        first_name='علی',
        last_name='احمدی',
        specialization='اعصاب و روان',
    )


@pytest.fixture
def reception_user(db):
    return User.objects.create_user(
        username='reception',
        password='reception123',
        role='reception',
    )


@pytest.fixture
def auth_client(client, admin_user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(admin_user)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {refresh.access_token}'
    return client


@pytest.fixture
def doctor_client(client, doctor_user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(doctor_user)
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {refresh.access_token}'
    return client


@pytest.fixture
def sample_patient(db):
    from patients.models import Patient
    return Patient.objects.create(
        first_name='مریم',
        last_name='رضایی',
        national_id='1234567890',
        phone='09121234567',
    )


@pytest.fixture
def sample_treatment_type(db):
    from accounts.models import TreatmentType
    return TreatmentType.objects.create(name='TMS', description='تحریک مغناطیسی')


@pytest.fixture
def sample_appointment(db, sample_patient, doctor_user, sample_treatment_type, admin_user):
    from appointments.models import Appointment
    from datetime import date, time
    return Appointment.objects.create(
        patient=sample_patient,
        doctor=doctor_user,
        treatment_type=sample_treatment_type,
        date=date.today(),
        time=time(10, 0),
        created_by=admin_user,
    )
