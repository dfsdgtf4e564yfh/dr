import os
import json
import shutil
import tempfile
from datetime import datetime
from django.conf import settings
from django.http import FileResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.management import call_command
from io import StringIO
from utils.validators import sanitize_filename
from utils.jalali import toJalali
from .tasks import execute_backup, _safe_sqlite_copy, _get_checksum


def _get_backup_dir():
    return getattr(settings, 'BACKUP_DIR', os.path.join(settings.BASE_DIR, 'backups'))


def _safe_join(directory: str, filename: str) -> str:
    safe_name = sanitize_filename(filename)
    full_path = os.path.normpath(os.path.join(directory, safe_name))
    if not full_path.startswith(os.path.normpath(directory)):
        raise ValueError('Invalid file path')
    return full_path


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def backup_list(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'POST':
        result = execute_backup(backup_type='manual')
        if result.get('success'):
            return Response({
                'message': 'پشتیبان‌گیری با موفقیت انجام شد',
                'file': os.path.basename(result['file']),
                'checksum': result['checksum'],
                'deleted_old': result.get('deleted_old', []),
            }, status=status.HTTP_201_CREATED)
        return Response({'error': result.get('error', 'خطا در پشتیبان‌گیری')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    backup_dir = _get_backup_dir()
    os.makedirs(backup_dir, exist_ok=True)
    backups = []
    for f in sorted(os.listdir(backup_dir), reverse=True):
        if f.endswith('.meta.json') or f.endswith('.enc'):
            continue
        fpath = os.path.join(backup_dir, f)
        if not os.path.isfile(fpath):
            continue
        meta_path = fpath + '.meta.json'
        meta = {}
        if os.path.exists(meta_path):
            with open(meta_path, 'r', encoding='utf-8') as mf:
                meta = json.load(mf)
        raw_ts = meta.get('timestamp', '')
        display = raw_ts
        if raw_ts and len(raw_ts) >= 15:
            try:
                dt = datetime.strptime(raw_ts, '%Y%m%d_%H%M%S')
                time_str = dt.strftime('%H:%M')
                jdate = toJalali(dt.strftime('%Y-%m-%d'))
                display = f'{time_str} - {jdate}'
            except ValueError:
                pass
        backups.append({
            'filename': f,
            'size': os.path.getsize(fpath),
            'created': meta.get('timestamp', ''),
            'display_time': display,
            'engine': meta.get('engine', ''),
            'checksum': meta.get('checksum', ''),
            'encrypted': meta.get('encrypted', False),
        })

    return Response(backups)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_download(request, filename):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    try:
        filepath = _safe_join(_get_backup_dir(), filename)
    except ValueError:
        return Response({'error': 'نام فایل نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

    if not os.path.exists(filepath):
        return Response({'error': 'فایل یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    return FileResponse(open(filepath, 'rb'), as_attachment=True, filename=filename)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def backup_delete(request, filename):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    try:
        filepath = _safe_join(_get_backup_dir(), filename)
    except ValueError:
        return Response({'error': 'نام فایل نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

    if not os.path.exists(filepath):
        return Response({'error': 'فایل یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    os.remove(filepath)
    meta_path = filepath + '.meta.json'
    if os.path.exists(meta_path):
        os.remove(meta_path)

    return Response({'message': 'فایل پشتیبان حذف شد'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def backup_restore(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    if 'file' not in request.FILES:
        return Response({'error': 'فایل پشتیبان را انتخاب کنید'}, status=status.HTTP_400_BAD_REQUEST)

    uploaded = request.FILES['file']
    fname = uploaded.name.lower()
    is_sqlite = fname.endswith('.db') or fname.endswith('.sqlite') or fname.endswith('.sqlite3')

    if uploaded.size > 500 * 1024 * 1024:
        return Response({'error': 'حجم فایل نباید بیشتر از ۵۰۰ مگابایت باشد'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tmp_path = tempfile.mktemp(suffix=('.sqlite3' if is_sqlite else '.json'))
        with open(tmp_path, 'wb') as f:
            for chunk in uploaded.chunks():
                f.write(chunk)

        db_path = str(settings.DATABASES['default']['NAME'])

        if is_sqlite:
            import sqlite3
            try:
                conn = sqlite3.connect(tmp_path)
                conn.execute('SELECT COUNT(*) FROM sqlite_master')
                conn.close()
            except Exception:
                os.unlink(tmp_path)
                return Response({'error': 'فرمت فایل SQLite نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

            safe_path = db_path + '.restore_safe'
            _safe_sqlite_copy(db_path, safe_path)

            try:
                from django.db import connection
                connection.close()
                _safe_sqlite_copy(tmp_path, db_path)
                out = StringIO()
                call_command('migrate', '--no-input', stdout=out)
                os.unlink(tmp_path)
                os.unlink(safe_path)
                return Response({'message': 'بازیابی با موفقیت انجام شد. لطفاً دوباره وارد شوید.'})
            except Exception as e:
                if os.path.exists(safe_path):
                    _safe_sqlite_copy(safe_path, db_path)
                os.unlink(tmp_path)
                if os.path.exists(safe_path):
                    os.unlink(safe_path)
                return Response({'error': f'خطا در بازیابی: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            if not fname.endswith('.json'):
                os.unlink(tmp_path)
                return Response({'error': 'فقط فایل‌های .json, .db, .sqlite, .sqlite3 پشتیبانی می‌شوند'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with open(tmp_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    os.unlink(tmp_path)
                    return Response({'error': 'فرمت فایل پشتیبان نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                os.unlink(tmp_path)
                return Response({'error': 'خطا در خواندن فایل پشتیبان'}, status=status.HTTP_400_BAD_REQUEST)

            out = StringIO()
            err = StringIO()
            call_command('flush', '--no-input', stdout=out, stderr=err)
            call_command('migrate', '--no-input', stdout=out, stderr=err)
            call_command('loaddata', tmp_path, '--ignorenonexistent', stdout=out, stderr=err)
            os.unlink(tmp_path)
            call_command('migrate', '--no-input', stdout=out, stderr=err)

            return Response({'message': 'بازیابی JSON با موفقیت انجام شد. درصورت مشکل با نام کاربری و رمز قبلی وارد شوید.'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def backup_schedule(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        from backup.models import BackupSchedule
        obj, _ = BackupSchedule.objects.get_or_create(id=1, defaults={
            'enabled': True, 'hour': 3, 'minute': 0,
            'retention_days': 30,
        })
        return Response({
            'enabled': obj.enabled,
            'hour': obj.hour,
            'minute': obj.minute,
            'last_run': obj.last_run.isoformat() if obj.last_run else None,
            'retention_days': obj.retention_days,
            'encrypt_backup': obj.encrypt_backup,
        })

    hour = request.data.get('hour', 3)
    minute = request.data.get('minute', 0)
    retention_days = request.data.get('retention_days', 30)
    encrypt_backup = request.data.get('encrypt_backup', False)

    from backup.scheduler import update_schedule
    obj = update_schedule(int(hour), int(minute), True)
    obj.retention_days = int(retention_days)
    obj.encrypt_backup = bool(encrypt_backup)
    obj.save()

    return Response({
        'enabled': obj.enabled,
        'hour': obj.hour,
        'minute': obj.minute,
        'last_run': obj.last_run.isoformat() if obj.last_run else None,
        'retention_days': obj.retention_days,
        'encrypt_backup': obj.encrypt_backup,
    })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def email_config(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        from .models import EmailBackupConfig
        cfg, _ = EmailBackupConfig.objects.get_or_create(id=1)
        return Response({
            'smtp_host': cfg.smtp_host,
            'smtp_port': cfg.smtp_port,
            'use_tls': cfg.use_tls,
            'sender_email': cfg.sender_email,
            'has_password': bool(cfg.sender_password),
            'recipient_email': cfg.recipient_email,
            'auto_send': cfg.auto_send,
            'last_sent_at': cfg.last_sent_at.isoformat() if cfg.last_sent_at else None,
        })

    from .models import EmailBackupConfig
    cfg, _ = EmailBackupConfig.objects.get_or_create(id=1)
    cfg.smtp_host = request.data.get('smtp_host', cfg.smtp_host)
    cfg.smtp_port = int(request.data.get('smtp_port', cfg.smtp_port))
    cfg.use_tls = bool(request.data.get('use_tls', cfg.use_tls))
    cfg.sender_email = request.data.get('sender_email', cfg.sender_email)
    cfg.recipient_email = request.data.get('recipient_email', cfg.recipient_email)
    cfg.auto_send = bool(request.data.get('auto_send', cfg.auto_send))
    password = request.data.get('sender_password')
    if password:
        cfg.sender_password = password
    cfg.save()

    from backup.scheduler import start_email_send_scheduler
    start_email_send_scheduler()

    return Response({'message': 'تنظیمات ایمیل ذخیره شد'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def email_test(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)
    from .email_backup import test_connection
    result = test_connection()
    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def email_send_backup(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)
    backup_dir = _get_backup_dir()
    from .email_backup import send_backup_email
    results = []
    for f in sorted(os.listdir(backup_dir)):
        if f.endswith('.meta.json'):
            continue
        fpath = os.path.join(backup_dir, f)
        if not os.path.isfile(fpath):
            continue
        result = send_backup_email(fpath, f)
        results.append({'file': f, 'success': result.get('success'), 'error': result.get('error')})
    return Response({'results': results, 'total': len(results), 'sent': sum(1 for r in results if r['success'])})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def backup_logs(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)
    from .models import BackupLog
    logs = BackupLog.objects.all().order_by('-created_at')[:50]
    return Response([{
        'filename': l.filename,
        'size_bytes': l.size_bytes,
        'status': l.status,
        'cloud_uploaded': l.cloud_uploaded,
        'error_message': l.error_message,
        'checksum': l.checksum,
        'created_at': l.created_at.isoformat(),
    } for l in logs])
