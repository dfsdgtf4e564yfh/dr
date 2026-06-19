import time
import logging
import uuid
from django.http import JsonResponse
from django.core.cache import cache
from django.db import models

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = str(uuid.uuid4())[:8]
        request.request_id = request_id
        start = time.time()

        response = self.get_response(request)

        duration_ms = int((time.time() - start) * 1000)
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') else None

        extra = {
            'request_id': request_id,
            'user_id': user_id,
            'duration_ms': duration_ms,
            'method': request.method,
            'path': request.path,
            'status': response.status_code,
        }
        if response.status_code >= 500:
            logger.error(f'{request.method} {request.path} -> {response.status_code}', extra=extra)
        elif response.status_code >= 400:
            logger.warning(f'{request.method} {request.path} -> {response.status_code}', extra=extra)
        else:
            logger.info(f'{request.method} {request.path} -> {response.status_code}', extra=extra)

        return response


class RealIPRateLimitMiddleware:
    RATE_LIMITS = {
        'login': (10, 60),
        'forgot_password': (5, 300),
        'send_otp': (5, 120),
        'portal': (5, 300),
        'backup': (60, 60),
        'import': (5, 60),
        'totp': (5, 60),
        '2fa': (5, 60),
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def _get_real_ip(self, request):
        from django.conf import settings
        behind_proxy = hasattr(settings, 'SECURE_PROXY_SSL_HEADER') and settings.SECURE_PROXY_SSL_HEADER
        if behind_proxy:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
            if x_forwarded:
                return x_forwarded.split(',')[0].strip()
            x_real = request.META.get('HTTP_X_REAL_IP', '')
            if x_real:
                return x_real.strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

    def _get_rate_limit_key(self, path):
        for name, (limit, window) in self.RATE_LIMITS.items():
            if name in path:
                return name, limit, window
        return None, None, None

    def __call__(self, request):
        name, limit, window = self._get_rate_limit_key(request.path)
        if name:
            ip = self._get_real_ip(request)
            cache_key = f'ratelimit:{name}:{ip}'
            count = cache.get(cache_key, 0)
            if count >= limit:
                logger.warning(f'Rate limit exceeded: {name} from {ip}')
                return JsonResponse(
                    {'error': 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'},
                    status=429,
                )
            cache.set(cache_key, count + 1, timeout=window)

        return self.get_response(request)


class AccountLockoutMiddleware:
    MAX_ATTEMPTS = 5
    LOCKOUT_DURATION = 900

    def __init__(self, get_response=None):
        self.get_response = get_response

    def __call__(self, request):
        if self.get_response is None:
            raise TypeError(
                'AccountLockoutMiddleware used directly via __call__ without get_response. '
                'Use helper methods (_is_locked, _record_failed_attempt) directly instead.'
            )

        if request.path.endswith('/login/') and request.method == 'POST':
            username = request.data.get('username', '') if hasattr(request, 'data') else ''
            if username and self._is_locked(username):
                return JsonResponse(
                    {'error': 'حساب کاربری به دلیل تلاش‌های ناموفق زیاد موقتاً قفل شد. ۱۵ دقیقه بعد تلاش کنید.'},
                    status=429,
                )

        response = self.get_response(request)

        if request.path.endswith('/login/') and request.method == 'POST':
            username = request.data.get('username', '') if hasattr(request, 'data') else ''
            if response.status_code == 401:
                self._record_failed_attempt(username)
            elif response.status_code == 200:
                self._clear_attempts(username)

        if hasattr(response, 'has_header') and not response.has_header('Retry-After'):
            response['X-RateLimit-Limit'] = str(self.MAX_ATTEMPTS)

        return response

    def _record_failed_attempt(self, username):
        if not username:
            return
        key = f'lockout:{username}'
        attempts = cache.get(key, 0)
        cache.set(key, attempts + 1, timeout=self.LOCKOUT_DURATION)
        self._persist_failed_attempt(username)

    def _is_locked(self, username):
        if not username:
            return False
        key = f'lockout:{username}'
        cached = cache.get(key, 0)
        if cached >= self.MAX_ATTEMPTS:
            return True
        persisted = self._get_persisted_attempts(username)
        return persisted >= self.MAX_ATTEMPTS

    def _clear_attempts(self, username):
        if not username:
            return
        cache.delete(f'lockout:{username}')
        self._persist_reset(username)

    def _persist_failed_attempt(self, username):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            User.objects.filter(username=username).update(
                failed_login_attempts=models.F('failed_login_attempts') + 1
            )
        except Exception:
            pass

    def _get_persisted_attempts(self, username):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.filter(username=username).values_list('failed_login_attempts', flat=True).first()
            return user or 0
        except Exception:
            return 0

    def _persist_reset(self, username):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            User.objects.filter(username=username).update(failed_login_attempts=0)
        except Exception:
            pass
