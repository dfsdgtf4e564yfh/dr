from django.conf import settings
from django.http import JsonResponse
from django.core.exceptions import SuspiciousOperation
from utils.middleware import RealIPRateLimitMiddleware, RequestLoggingMiddleware, AccountLockoutMiddleware


class UploadSizeErrorMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except SuspiciousOperation as e:
            if 'RequestDataTooBig' in type(e).__name__ or 'TooManyFields' in type(e).__name__:
                limit_mb = settings.DATA_UPLOAD_MAX_MEMORY_SIZE / (1024 * 1024)
                return JsonResponse(
                    {'error': f'حجم فایل ارسالی بیش از حد مجاز است. حداکثر حجم مجاز: {int(limit_mb)} مگابایت'},
                    status=413
                )
            raise


class CorsCSRFMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
                setattr(request, '_dont_enforce_csrf_checks', True)
            elif request.path.startswith('/api/auth/'):
                setattr(request, '_dont_enforce_csrf_checks', True)
            elif 'Authorization' in request.headers and request.headers['Authorization'].startswith('Bearer '):
                setattr(request, '_dont_enforce_csrf_checks', True)
        return self.get_response(request)


class RateLimitMiddleware(RealIPRateLimitMiddleware):
    pass


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        return response
