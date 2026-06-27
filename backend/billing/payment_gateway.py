import requests
from django.conf import settings


class ZarinpalGateway:
    def __init__(self, merchant_id=None, sandbox=True):
        self.merchant_id = merchant_id or settings.ZARINPAL_MERCHANT_ID
        self.sandbox = sandbox if sandbox is not None else settings.ZARINPAL_SANDBOX
        if self.sandbox:
            self.base_url = 'https://sandbox.zarinpal.com/pg/v4'
            self.payment_page_url = 'https://sandbox.zarinpal.com/pg/StartPay'
        else:
            self.base_url = 'https://payment.zarinpal.com/pg/v4'
            self.payment_page_url = 'https://payment.zarinpal.com/pg/StartPay'

    def payment_request(self, amount, description, callback_url, patient_id=None, billing_id=None):
        payload = {
            'merchant_id': self.merchant_id,
            'amount': int(amount),
            'description': description,
            'callback_url': callback_url,
            'metadata': {
                'patient_id': patient_id,
                'billing_id': billing_id,
            }
        }
        resp = requests.post(f'{self.base_url}/payment/request.json', json=payload, timeout=30)
        data = resp.json()
        authority = data.get('data', {}).get('authority')
        payment_url = f'{self.payment_page_url}/{authority}' if authority else None
        return authority, payment_url

    def payment_verify(self, authority, amount):
        payload = {
            'merchant_id': self.merchant_id,
            'amount': int(amount),
            'authority': authority,
        }
        resp = requests.post(f'{self.base_url}/payment/verify.json', json=payload, timeout=30)
        data = resp.json()
        code = data.get('data', {}).get('code')
        ref_id = data.get('data', {}).get('ref_id', '')
        success = code == 100
        return ref_id, success
