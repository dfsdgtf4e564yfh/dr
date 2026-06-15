import pytest
from .models import Billing, Settlement


class TestBillingModel:
    def test_billing_auto_status(self, db, sample_patient, doctor_user):
        billing = Billing.objects.create(
            patient=sample_patient,
            doctor=doctor_user,
            total_amount=100000,
            paid_amount=100000,
        )
        assert billing.status == 'paid'

    def test_billing_partial(self, db, sample_patient, doctor_user):
        billing = Billing.objects.create(
            patient=sample_patient,
            doctor=doctor_user,
            total_amount=100000,
            paid_amount=50000,
        )
        assert billing.status == 'partial'

    def test_billing_pending(self, db, sample_patient, doctor_user):
        billing = Billing.objects.create(
            patient=sample_patient,
            doctor=doctor_user,
            total_amount=100000,
            paid_amount=0,
        )
        assert billing.status == 'pending'

    def test_doctor_share_calculation(self, db, sample_patient, doctor_user):
        billing = Billing.objects.create(
            patient=sample_patient,
            doctor=doctor_user,
            total_amount=100000,
            doctor_commission_percentage=50,
        )
        assert billing.doctor_share == 50000

    def test_billing_str(self, db, sample_patient, doctor_user):
        billing = Billing.objects.create(
            patient=sample_patient,
            doctor=doctor_user,
            total_amount=250000,
        )
        assert '250,000' in str(billing)
        assert 'تومان' in str(billing)


@pytest.mark.smoke
class TestBillingSmoke:
    def test_billing_list(self, auth_client):
        response = auth_client.get('/api/billing/billings/')
        assert response.status_code == 200
