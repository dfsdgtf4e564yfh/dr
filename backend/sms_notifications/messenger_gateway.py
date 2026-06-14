import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class BaseMessenger:
    def send_message(self, to: str, message: str, **kwargs) -> dict:
        raise NotImplementedError

    def get_status(self, message_id: str) -> str:
        raise NotImplementedError


class EitaaMessenger(BaseMessenger):
    def __init__(self, bot_token=None):
        self.bot_token = bot_token or getattr(settings, 'EITAA_BOT_TOKEN', '')
        self.base_url = f"https://eitaayar.ir/api/{self.bot_token}"

    def send_message(self, to: str, message: str, **kwargs) -> dict:
        try:
            resp = requests.post(
                f"{self.base_url}/sendMessage",
                json={'chat_id': to, 'text': message},
                timeout=15,
            )
            result = resp.json()
            if result.get('ok') or result.get('status') == 'ok':
                return {
                    'success': True,
                    'message_id': result.get('result', {}).get('message_id', ''),
                    'error': '',
                }
            return {
                'success': False,
                'message_id': '',
                'error': result.get('description', 'خطا در ارسال پیام ایتا'),
            }
        except requests.exceptions.ConnectionError:
            return {'success': False, 'message_id': '', 'error': 'عدم اتصال به سرویس ایتا'}
        except Exception as e:
            logger.error(f'Eitaa send error: {e}')
            return {'success': False, 'message_id': '', 'error': str(e)}

    def get_status(self, message_id: str) -> str:
        return ''


class BaleMessenger(BaseMessenger):
    def __init__(self, bot_token=None):
        self.bot_token = bot_token or getattr(settings, 'BALE_BOT_TOKEN', '')
        self.base_url = f"https://tapi.bale.ai/bot{self.bot_token}"

    def send_message(self, to: str, message: str, **kwargs) -> dict:
        try:
            resp = requests.post(
                f"{self.base_url}/sendMessage",
                json={'chat_id': to, 'text': message},
                timeout=15,
            )
            result = resp.json()
            if result.get('ok'):
                return {
                    'success': True,
                    'message_id': str(result.get('result', {}).get('message_id', '')),
                    'error': '',
                }
            return {
                'success': False,
                'message_id': '',
                'error': result.get('description', 'خطا در ارسال پیام بله'),
            }
        except requests.exceptions.ConnectionError:
            return {'success': False, 'message_id': '', 'error': 'عدم اتصال به سرویس بله'}
        except Exception as e:
            logger.error(f'Bale send error: {e}')
            return {'success': False, 'message_id': '', 'error': str(e)}

    def get_status(self, message_id: str) -> str:
        return ''


class RubikaMessenger(BaseMessenger):
    def __init__(self, token=None):
        self.token = token or getattr(settings, 'RUBIKA_TOKEN', '')
        self.base_url = "https://messenger.rubika.ir/api"

    def send_message(self, to: str, message: str, **kwargs) -> dict:
        try:
            resp = requests.post(
                f"{self.base_url}/sendMessage",
                json={
                    'token': self.token,
                    'to': to,
                    'text': message,
                },
                timeout=15,
            )
            result = resp.json()
            if result.get('status') == 'OK' or result.get('status') == 200:
                return {
                    'success': True,
                    'message_id': str(result.get('data', {}).get('message_id', '')),
                    'error': '',
                }
            return {
                'success': False,
                'message_id': '',
                'error': result.get('message', 'خطا در ارسال پیام روبیکا'),
            }
        except requests.exceptions.ConnectionError:
            return {'success': False, 'message_id': '', 'error': 'عدم اتصال به سرویس روبیکا'}
        except Exception as e:
            logger.error(f'Rubika send error: {e}')
            return {'success': False, 'message_id': '', 'error': str(e)}

    def get_status(self, message_id: str) -> str:
        return ''


MESSENGER_MAP = {
    'eitaa': EitaaMessenger,
    'bale': BaleMessenger,
    'rubika': RubikaMessenger,
}

MESSENGER_NAMES = {
    'eitaa': 'ایتا',
    'bale': 'بله',
    'rubika': 'روبیکا',
}


def get_messenger(messenger_type: str, bot_token: str = None):
    cls = MESSENGER_MAP.get(messenger_type)
    if not cls:
        return None
    if messenger_type == 'rubika':
        return cls(token=bot_token)
    return cls(bot_token=bot_token)
