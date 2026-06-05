import os
import json
import hashlib
import logging
import shutil
from datetime import datetime, timedelta
from io import StringIO

from django.conf import settings
from django.core.management import call_command
from datetime import timezone
from django.utils import timezone as dj_timezone

from .models import BackupLog

logger = logging.getLogger(__name__)


def _get_checksum(filepath: str) -> str:
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            sha256.update(chunk)
    return sha256.hexdigest()


def _safe_sqlite_copy(src: str, dst: str) -> None:
    import sqlite3
    src_con = sqlite3.connect(src)
    dst_con = sqlite3.connect(dst)

    src_con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    src_con.backup(dst_con)
    src_con.close()
    dst_con.close()


def _encrypt_file(filepath: str) -> str:
    from utils.encryption import get_fernet
    fernet = get_fernet()
    enc_path = filepath + '.enc'
    with open(filepath, 'rb') as f:
        data = f.read()
    encrypted = fernet.encrypt(data)
    with open(enc_path, 'wb') as f:
        f.write(encrypted)
    os.unlink(filepath)
    return enc_path


def _enforce_retention(backup_dir: str, retention_days: int = 30) -> list:
    deleted = []
    cutoff = dj_timezone.now() - timedelta(days=retention_days)
    for f in sorted(os.listdir(backup_dir)):
        fpath = os.path.join(backup_dir, f)
        if not os.path.isfile(fpath):
            continue
        mtime = datetime.fromtimestamp(os.path.getmtime(fpath), tz=timezone.utc)
        if mtime < cutoff:
            os.remove(fpath)
            meta_path = fpath + '.meta.json'
            if os.path.exists(meta_path):
                os.remove(meta_path)
            deleted.append(f)
    return deleted


def execute_backup(backup_type: str = 'auto') -> dict:
    backup_dir = getattr(settings, 'BACKUP_DIR', os.path.join(settings.BASE_DIR, 'backups'))
    os.makedirs(backup_dir, exist_ok=True)
    now = datetime.now()
    timestamp = now.strftime('%Y%m%d_%H%M%S')
    iso_ts = now.isoformat()
    engine = settings.DATABASES['default']['ENGINE']

    try:
        if 'sqlite' in engine:
            db_path = settings.DATABASES['default']['NAME']
            ext = os.path.splitext(db_path)[1] or '.sqlite3'
            output = os.path.join(backup_dir, f'clinic_backup_{timestamp}{ext}')
            _safe_sqlite_copy(db_path, output)
        elif 'postgresql' in engine:
            import subprocess
            db = settings.DATABASES['default']
            output = os.path.join(backup_dir, f'clinic_backup_{timestamp}.sql')
            env = os.environ.copy()
            env['PGPASSWORD'] = db['PASSWORD']
            result = subprocess.run([
                'pg_dump', '-h', db['HOST'], '-p', str(db['PORT']),
                '-U', db['USER'], '-d', db['NAME'], '-f', output, '--no-owner',
            ], env=env, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                raise Exception(f'pg_dump failed: {result.stderr}')
        else:
            output = os.path.join(backup_dir, f'clinic_backup_{timestamp}.json')
            out = StringIO()
            call_command('dumpdata', '--indent', '2', stdout=out)
            with open(output, 'w', encoding='utf-8') as f:
                f.write(out.getvalue())

        checksum = _get_checksum(output)
        meta = {
            'timestamp': timestamp,
            'created_at': iso_ts,
            'file': os.path.basename(output),
            'size_bytes': os.path.getsize(output),
            'engine': engine,
            'auto': backup_type == 'auto',
            'checksum': checksum,
        }
        meta_path = output + '.meta.json'
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        log = BackupLog.objects.create(
            filename=os.path.basename(output),
            size_bytes=os.path.getsize(output),
            status='success',
            engine=engine,
            checksum=checksum,
        )

        from backup.models import BackupSchedule
        sched = BackupSchedule.objects.filter(id=1).first()
        if sched:
            sched.last_run = dj_timezone.now()
            sched.save(update_fields=['last_run'])

        if sched and sched.encrypt_backup:
            output = _encrypt_file(output)
            meta['encrypted'] = True
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)

        from .models import EmailBackupConfig
        email_cfg = EmailBackupConfig.objects.filter(id=1).first()
        if email_cfg and email_cfg.auto_send and email_cfg.sender_email:
            try:
                from .email_backup import send_backup_email
                cr = send_backup_email(output, os.path.basename(output))
                if cr.get('success'):
                    log.cloud_uploaded = True
                    log.save(update_fields=['cloud_uploaded'])
            except Exception as ce:
                logger.warning(f'Email send failed: {ce}')

        retention = sched.retention_days if sched else 30
        deleted = _enforce_retention(backup_dir, retention)
        if deleted:
            logger.info(f'Retention cleaned {len(deleted)} old backups: {deleted}')

        logger.info(f'Backup created: {output} ({os.path.getsize(output)} bytes)')
        return {'success': True, 'file': output, 'checksum': checksum, 'deleted_old': deleted}

    except Exception as e:
        logger.exception(f'Backup failed: {e}')
        BackupLog.objects.create(
            filename=f'failed_{timestamp}',
            status='failed',
            error_message=str(e)[:500],
            engine=engine,
        )
        return {'success': False, 'error': str(e)}
