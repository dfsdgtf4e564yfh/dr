import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class BaseMessenger:
    def send_message(self, to: str, message: str, **kwargs) -> dict:
        raise NotImplementedError

    def get_status(self, message_id: str) -> str:
        raise NotImplementedError

    def test_connection(self) -> dict:
        raise NotImplementedError


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

    def test_connection(self) -> dict:
        try:
            resp = requests.get(
                f"{self.base_url}/getMe",
                timeout=15,
            )
            result = resp.json()
            if result.get('ok'):
                return {'success': True, 'bot_name': result.get('result', {}).get('first_name', ''), 'error': ''}
            return {'success': False, 'error': result.get('description', 'خطا در اتصال به ربات بله')}
        except requests.exceptions.ConnectionError:
            return {'success': False, 'error': 'عدم اتصال به سرویس بله'}
        except Exception as e:
            logger.error(f'Bale test error: {e}')
            return {'success': False, 'error': str(e)}

    def get_status(self, message_id: str) -> str:
        return ''


MESSENGER_MAP = {
    'bale': BaleMessenger,
}

MESSENGER_NAMES = {
    'bale': 'بله',
}


def get_messenger(messenger_type: str, bot_token: str = None):
    cls = MESSENGER_MAP.get(messenger_type)
    if not cls:
        return None
    return cls(bot_token=bot_token)
