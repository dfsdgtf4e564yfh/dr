from django.conf import settings
from django.http import JsonResponse
from django.core.exceptions import SuspiciousOperation
from utils.middleware import RealIPRateLimitMiddleware, RequestLoggingMiddleware, AccountLockoutMiddleware

URL_PERMISSION_MAP = [
    ('/api/patients/', 'patients'),
    ('/api/appointments/', 'appointments'),
    ('/api/medical-records/', 'medical_records'),
    ('/api/billing/', 'billing'),
    ('/api/patient-identity/', 'patient_identity_view'),
    ('/api/dashboard/', 'dashboard'),
    ('/api/sms/templates/', 'sms_templates'),
    ('/api/sms/history/', 'sms_history'),
    ('/api/sms/bulk-send/', 'sms_bulk'),
    ('/api/backup/', 'backup'),
    ('/api/auth/users/', 'users'),
    ('/api/auth/roles/', 'roles_manage'),
    ('/api/online-booking/', 'patient_online_booking'),
]


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
            elif request.path.startswith('/api/auth/login') or request.path.startswith('/api/auth/forgot-password') or request.path.startswith('/api/auth/forgot-password-verify') or request.path.startswith('/api/auth/forgot-password-reset') or request.path.startswith('/api/token/'):
                setattr(request, '_dont_enforce_csrf_checks', True)
        return self.get_response(request)


class PermissionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated and request.user.role not in ('admin', 'super_support'):
            path = request.path_info
            for prefix, codename in URL_PERMISSION_MAP:
                if path.startswith(prefix):
                    if request.method in ('GET', 'HEAD', 'OPTIONS'):
                        continue
                    user_perms = set(request.user.page_permissions or [])
                    if codename not in user_perms:
                        return JsonResponse({'error': 'شما دسترسی به این بخش را ندارید'}, status=403)
                    break
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
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; media-src 'self' blob:; frame-src 'none'; object-src 'none'"
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        return response
