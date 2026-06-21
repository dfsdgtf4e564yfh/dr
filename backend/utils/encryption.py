import hmac
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def hash_value(value: str) -> str:
    if not value:
        return ''
    key = settings.ENCRYPTION_KEY
    if isinstance(key, str):
        key = key.encode()
    return hmac.new(key, value.encode(), hashlib.sha256).hexdigest()


def get_fernet() -> Fernet:
    raw_key = settings.ENCRYPTION_KEY
    if isinstance(raw_key, str):
        raw_key = raw_key.encode()
    key = base64.urlsafe_b64encode(hashlib.sha256(raw_key).digest())
    return Fernet(key)


def encrypt_value(value: str) -> str:
    if not value:
        return value
    f = get_fernet()
    return f.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    if not value:
        return value
    try:
        f = get_fernet()
        return f.decrypt(value.encode()).decode()
    except Exception as e:
        logger.exception(f'Decryption failed: {e}')
        raise ValueError(f'Decryption failed for value: {e}')


class EncryptedField:
    def __init__(self, field_name: str):
        self.field_name = field_name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        raw = obj.__dict__.get(self.field_name, '')
        if not raw:
            return raw
        try:
            return decrypt_value(raw)
        except Exception:
            logger.warning(f'Failed to decrypt {self.field_name}, returning empty')
            return ''

    def __set__(self, obj, value):
        obj.__dict__[self.field_name] = encrypt_value(value) if value else value
