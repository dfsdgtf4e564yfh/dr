import mimetypes
import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponseForbidden, Http404, JsonResponse

# Subpaths under MEDIA_ROOT that contain non-sensitive, publicly-displayable
# assets (e.g. clinic logo shown on the public booking page favicon/header).
# Everything else under /media/ requires authentication.
PUBLIC_MEDIA_PREFIXES = ('clinic_logos/',)


def disk_health_check(request):
    all_ok = True
    checks = {}

    def _check_path(label, path):
        nonlocal all_ok
        entry = {"path": path}
        if not path:
            entry.update(exists=False, is_dir=False, writable=False, error="empty")
            all_ok = False
            checks[label] = entry
            return
        exists = os.path.exists(path)
        entry["exists"] = exists
        if exists:
            entry["is_dir"] = os.path.isdir(path)
            entry["writable"] = os.access(path, os.W_OK)
            if not entry["writable"]:
                all_ok = False
        else:
            entry["is_dir"] = False
            entry["writable"] = False
            all_ok = False
        checks[label] = entry

    _check_path("STATIC_ROOT", settings.STATIC_ROOT)
    _check_path("MEDIA_ROOT", settings.MEDIA_ROOT)

    test_entry = {"label": "write → read → delete"}
    try:
        test_dir = settings.MEDIA_ROOT
        if not test_dir or not os.path.isdir(test_dir):
            raise RuntimeError("MEDIA_ROOT not available")
        fd, test_path = tempfile.mkstemp(prefix=".disk_health_", suffix=".tmp", dir=test_dir)
        test_name = os.path.basename(test_path)
        test_entry["test_file"] = test_name
        content = b"Clinibank disk health check"
        t0 = datetime.utcnow()
        with os.fdopen(fd, "wb") as f:
            f.write(content)
        test_entry["write_ok"] = True
        test_entry["write_ms"] = round((datetime.utcnow() - t0).total_seconds() * 1000, 2)
        t0 = datetime.utcnow()
        with open(test_path, "rb") as f:
            read_back = f.read()
        test_entry["read_ok"] = read_back == content
        test_entry["read_ms"] = round((datetime.utcnow() - t0).total_seconds() * 1000, 2)
        if not test_entry["read_ok"]:
            test_entry["error"] = "content mismatch"
            all_ok = False
        t0 = datetime.utcnow()
        os.remove(test_path)
        test_entry["delete_ok"] = not os.path.exists(test_path)
        test_entry["delete_ms"] = round((datetime.utcnow() - t0).total_seconds() * 1000, 2)
        if not test_entry["delete_ok"]:
            all_ok = False
    except Exception as exc:
        test_entry.update(write_ok=False, read_ok=False, delete_ok=False, error=str(exc))
        all_ok = False
    checks["test_file_io"] = test_entry

    def _fmt_bytes(b):
        if b >= 1073741824:
            return f"{b / 1073741824:.1f} GB"
        if b >= 1048576:
            return f"{b / 1048576:.1f} MB"
        if b >= 1024:
            return f"{b / 1024:.1f} KB"
        return f"{b} B"

    data_dir = getattr(settings, 'DATA_DIR', None)
    disk_entries = {}
    for label, p in (("DATA_DIR", data_dir), ("STATIC_ROOT", settings.STATIC_ROOT), ("MEDIA_ROOT", settings.MEDIA_ROOT)):
        if p and os.path.exists(p):
            try:
                u = shutil.disk_usage(str(p))
                disk_entries[label] = {
                    "total": _fmt_bytes(u.total),
                    "used": _fmt_bytes(u.used),
                    "free": _fmt_bytes(u.free),
                    "total_bytes": u.total,
                    "used_bytes": u.used,
                    "free_bytes": u.free,
                    "used_percent": round(u.used / u.total * 100, 2) if u.total > 0 else 0,
                }
            except Exception as exc:
                disk_entries[label] = {"error": str(exc)}
        else:
            disk_entries[label] = {"error": "path not available"}
    checks["disk_usage"] = disk_entries

    return JsonResponse({
        "status": "degraded" if not all_ok else "ok",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "checks": checks,
    })


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
