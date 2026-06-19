import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponseForbidden, Http404

# Subpaths under MEDIA_ROOT that contain non-sensitive, publicly-displayable
# assets (e.g. clinic logo shown on the public booking page favicon/header).
# Everything else under /media/ requires authentication.
PUBLIC_MEDIA_PREFIXES = ('clinic_logos/',)


def serve_media(request, path):
    normalized_path = path.replace('\\', '/').lstrip('/')
    is_public = normalized_path.startswith(PUBLIC_MEDIA_PREFIXES)

    user = request.user
    if not is_public and not user.is_authenticated:
        token = request.GET.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        if token:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                access_token = AccessToken(token)
                user = User.objects.get(id=access_token['user_id'])
            except Exception:
                return HttpResponseForbidden('لطفاً ابتدا وارد سیستم شوید')
        else:
            return HttpResponseForbidden('لطفاً ابتدا وارد سیستم شوید')

    file_path = Path(settings.MEDIA_ROOT) / path
    file_path = file_path.resolve()

    media_root = Path(settings.MEDIA_ROOT).resolve()
    if not str(file_path).startswith(str(media_root)):
        raise Http404('آدرس فایل نامعتبر است')

    if not file_path.is_file():
        raise Http404('فایل مورد نظر یافت نشد')

    content_type, _ = mimetypes.guess_type(str(file_path))
    if content_type is None:
        content_type = 'application/octet-stream'

    response = FileResponse(
        open(str(file_path), 'rb'),
        content_type=content_type,
    )
    response['X-Content-Type-Options'] = 'nosniff'
    return response
