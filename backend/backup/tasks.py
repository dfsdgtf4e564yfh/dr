import os
import json
import hashlib
import logging
import shutil
import zipfile
from datetime import datetime, timedelta
from io import StringIO

from django.conf import settings
from django.core.management import call_command
from datetime import timezone
from django.utils import timezone as dj_timezone

from .models import BackupLog

logger = logging.getLogger(__name__)

BACKUP_INCLUDES = {}


def _get_checksum(filepath: str) -> str:
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            sha256.update(chunk)
    return sha256.hexdigest()


def _safe_sqlite_copy(src: str, dst: str, max_retries: int = 3) -> None:
    import sqlite3
    import time
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            src_con = sqlite3.connect(src, timeout=30)
            dst_con = sqlite3.connect(dst, timeout=30)
            src_con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
            src_con.backup(dst_con)
            src_con.close()
            dst_con.close()
            return
        except sqlite3.OperationalError as e:
            last_err = e
            if 'locked' in str(e).lower() or 'busy' in str(e).lower():
                logger.warning(f'SQLite copy attempt {attempt}/{max_retries} failed (database busy), retrying...')
                time.sleep(2 ** attempt)
                continue
            raise
    raise last_err or Exception('SQLite copy failed after retries')


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


def _backup_media(backup_dir: str, timestamp: str) -> dict:
    media_root = settings.MEDIA_ROOT
    if not os.path.isdir(media_root):
        os.makedirs(media_root, exist_ok=True)
    archive_path = os.path.join(backup_dir, f'clinic_backup_{timestamp}_media.zip')
    skipped = []
    total_files = 0
    try:
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _dirs, files in os.walk(media_root):
                for file in files:
                    fpath = os.path.join(root, file)
                    arcname = os.path.relpath(fpath, media_root)
                    total_files += 1
                    try:
                        zf.write(fpath, arcname)
                    except PermissionError:
                        skipped.append(arcname)
                    except OSError as e:
                        skipped.append(arcname)
                        logger.warning(f'Media backup skipped {arcname}: {e}')
    except Exception as e:
        logger.warning(f'Media backup failed: {e}')
        return {'included': False, 'reason': f'خطا: {str(e)[:100]}'}
    size = os.path.getsize(archive_path)
    checksum = _get_checksum(archive_path)
    result = {
        'included': True,
        'file': os.path.basename(archive_path),
        'size_bytes': size,
        'checksum': checksum,
        'total_files': total_files,
    }
    if skipped:
        result['skipped_count'] = len(skipped)
        result['skipped_files'] = skipped[:20]
        logger.warning(f'Media backup skipped {len(skipped)} locked files')
    return result


def _backup_env(backup_dir: str, timestamp: str) -> dict:
    env_path = os.path.join(settings.BASE_DIR, '.env')
    if not os.path.isfile(env_path):
        return {'included': False, 'reason': 'فایل .env وجود ندارد'}
    dst = os.path.join(backup_dir, f'clinic_backup_{timestamp}.env')
    # Always encrypt .env to protect secrets (SMS keys, Zarinpal, GitHub tokens, etc.)
    shutil.copy2(env_path, dst)
    encrypted = _encrypt_file(dst)
    size = os.path.getsize(encrypted)
    checksum = _get_checksum(encrypted)
    return {
        'included': True,
        'file': os.path.basename(encrypted),
        'size_bytes': size,
        'checksum': checksum,
        'encrypted': True,
    }


def _verify_backup(filepath: str, engine: str) -> dict:
    if 'sqlite' in engine:
        import sqlite3
        try:
            conn = sqlite3.connect(filepath)
            row_count = conn.execute('SELECT COUNT(*) FROM sqlite_master').fetchone()[0]
            conn.close()
            return {'valid': True, 'tables': row_count}
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    elif 'postgresql' in engine:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                header = f.read(256)
            if 'PostgreSQL' not in header and 'pg_dump' not in header:
                return {'valid': False, 'error': 'سربرگ PostgreSQL در فایل dump یافت نشد'}
            return {'valid': True}
        except Exception as e:
            return {'valid': False, 'error': str(e)}
    return {'valid': True}


def _enforce_retention(backup_dir: str, retention_days: int = 30) -> list:
    if retention_days <= 0:
        return []
    deleted = []
    cutoff = dj_timezone.now() - timedelta(days=retention_days)
    for f in sorted(os.listdir(backup_dir)):
        if not f.endswith('.meta.json'):
            continue
        meta_path = os.path.join(backup_dir, f)
        mtime = datetime.fromtimestamp(os.path.getmtime(meta_path), tz=timezone.utc)
        if mtime >= cutoff:
            continue
        try:
            with open(meta_path, 'r', encoding='utf-8') as mf:
                meta = json.load(mf)
        except:
            meta = {}
        to_remove = []
        main_file = meta.get('file')
        if main_file:
            fp = os.path.join(backup_dir, main_file)
            if os.path.isfile(fp):
                to_remove.append(fp)
        for ef in meta.get('extra_files', []):
            ef_name = ef.get('file')
            if ef_name:
                efp = os.path.join(backup_dir, ef_name)
                if os.path.isfile(efp):
                    to_remove.append(efp)
        to_remove.append(meta_path)
        for fp in to_remove:
            try:
                os.remove(fp)
            except OSError as e:
                logger.warning(f'Failed to delete {fp}: {e}')
        backup_id = f.replace('.meta.json', '')
        deleted.append(backup_id)
        logger.info(f'Retention: deleted backup {backup_id} ({len(to_remove)} files)')
    return deleted


def execute_backup(backup_type: str = 'auto') -> dict:
    global BACKUP_INCLUDES
    backup_dir = getattr(settings, 'BACKUP_DIR', os.path.join(settings.BASE_DIR, 'backups'))
    os.makedirs(backup_dir, exist_ok=True)
    now = datetime.now()
    timestamp = now.strftime('%Y%m%d_%H%M%S')
    iso_ts = now.isoformat()
    engine = settings.DATABASES['default']['ENGINE']
    extra_files = []
    warnings_list = []

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
            call_command('dumpdata', '--all', '--natural-foreign', '--natural-primary',
                         '--indent', '2', stdout=out)
            data_str = out.getvalue()
            obj_count = len(json.loads(data_str)) if data_str.strip() else 0
            with open(output, 'w', encoding='utf-8') as f:
                f.write(data_str)
            logger.info(f'dumpdata: {obj_count} objects serialized')

        verify = _verify_backup(output, engine)
        if not verify.get('valid'):
            raise Exception(f'Backup verification failed: {verify.get("error")}')

        checksum = _get_checksum(output)

        media_result = _backup_media(backup_dir, timestamp)
        if media_result.get('included'):
            extra_files.append(media_result)

        env_result = _backup_env(backup_dir, timestamp)
        if env_result.get('included'):
            extra_files.append(env_result)

        meta = {
            'timestamp': timestamp,
            'created_at': iso_ts,
            'file': os.path.basename(output),
            'size_bytes': os.path.getsize(output),
            'engine': engine,
            'auto': backup_type == 'auto',
            'checksum': checksum,
            'verification': verify,
            'includes_db': True,
            'includes_media': media_result.get('included', False),
            'includes_env': env_result.get('included', False),
            'extra_files': extra_files,
        }
        meta_path = output + '.meta.json'
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        total_size = os.path.getsize(output)
        for ef in extra_files:
            total_size += ef.get('size_bytes', 0)

        log = BackupLog.objects.create(
            filename=os.path.basename(output),
            size_bytes=total_size,
            status='success',
            engine=engine,
            checksum=checksum,
        )

        BACKUP_INCLUDES = {'media': media_result, 'env': env_result}

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

        from .models import GitHubBackupConfig
        github_cfg = GitHubBackupConfig.objects.filter(id=1).first()
        if github_cfg and github_cfg.auto_upload and github_cfg.token and github_cfg.repo:
            try:
                gh_file_size = os.path.getsize(output)
                if gh_file_size > 1_900_000_000:
                    w = f'فایل بک‌آپ {gh_file_size / 1024 / 1024 / 1024:.1f}GB است. GitHub Releases حداکثر 2GB پشتیبانی می‌کند.'
                    warnings_list.append(w)
                    logger.warning(w)
                from .github_backup import upload_backup
                gh_result = upload_backup(output, os.path.basename(output))
                if gh_result.get('success'):
                    log.github_uploaded = True
                    log.save(update_fields=['github_uploaded'])
                    github_cfg.last_upload_at = dj_timezone.now()
                    github_cfg.last_upload_file = os.path.basename(output)
                    github_cfg.last_upload_status = 'موفق'
                    github_cfg.save(update_fields=['last_upload_at', 'last_upload_file', 'last_upload_status'])
                    logger.info(f'GitHub upload success: {gh_result.get("download_url")}')
                else:
                    github_cfg.last_upload_status = f'شکست: {gh_result.get("error", "")[:50]}'
                    github_cfg.save(update_fields=['last_upload_status'])
                    logger.warning(f'GitHub upload failed: {gh_result.get("error")}')
            except Exception as ghe:
                logger.warning(f'GitHub auto-upload error: {ghe}')

        retention = sched.retention_days if sched else 30
        deleted = _enforce_retention(backup_dir, retention)
        if deleted:
            logger.info(f'Retention cleaned {len(deleted)} old backups: {deleted}')

        logger.info(f'Backup created: {output} ({os.path.getsize(output)} bytes)')
        result = {'success': True, 'file': output, 'checksum': checksum, 'deleted_old': deleted}
        if warnings_list:
            result['warnings'] = warnings_list
        return result

    except Exception as e:
        logger.exception(f'Backup failed: {e}')
        BackupLog.objects.create(
            filename=f'failed_{timestamp}',
            status='failed',
            error_message=str(e)[:500],
            engine=engine,
        )
        return {'success': False, 'error': str(e)}
