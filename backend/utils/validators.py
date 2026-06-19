import os
import re
from django.core.exceptions import ValidationError

MIME_MAGIC = {
    b'\x89PNG\r\n\x1a\n': 'image/png',
    b'\xff\xd8\xff': 'image/jpeg',
    b'GIF87a': 'image/gif',
    b'GIF89a': 'image/gif',
    b'%PDF': 'application/pdf',
    b'RIFF': 'image/webp',
}


def _detect_mime_from_header(content: bytes) -> str:
    for magic, mime in MIME_MAGIC.items():
        if content.startswith(magic):
            return mime
    return ''


def validate_file_extension(*extensions):
    def validator(value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in extensions:
            raise ValidationError(f'Only {", ".join(extensions)} files are allowed.')
    return validator


def validate_file_mime(allowed_mimes: list):
    def validator(value):
        try:
            header = value.read(16)
            value.seek(0)
            detected = _detect_mime_from_header(header)
            if detected and detected not in allowed_mimes:
                raise ValidationError(f'فرمت فایل مجاز نیست. فقط {", ".join(allowed_mimes)} مجاز است.')
        except Exception:
            pass
    return validator


def validate_file_size(max_size_mb: int = 10):
    max_bytes = max_size_mb * 1024 * 1024
    def validator(value):
        if value.size > max_bytes:
            raise ValidationError(f'File size must be under {max_size_mb}MB.')
    return validator


def validate_national_id(value: str) -> None:
    if not value:
        return
    if not re.match(r'^\d{10}$', value):
        raise ValidationError('کد ملی باید ۱۰ رقم باشد.')


def validate_phone(value: str) -> None:
    if not value:
        return
    if not re.match(r'^09\d{9}$', value):
        raise ValidationError('شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.')


def sanitize_filename(filename: str) -> str:
    filename = os.path.basename(filename)
    filename = re.sub(r'[^\w\-_\. ]', '_', filename)
    return filename
