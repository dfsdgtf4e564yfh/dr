import os
import json
import shutil
import zipfile
import tempfile
import logging
from datetime import datetime
from django.conf import settings
from django.http import FileResponse, HttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.management import call_command
from io import StringIO
from utils.validators import sanitize_filename
from utils.jalali import toJalali
from .tasks import execute_backup, _safe_sqlite_copy, _get_checksum, _verify_backup, _backup_media, _backup_env

logger = logging.getLogger(__name__)


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
        err_msg = result.get('error', 'خطا در پشتیبان‌گیری')
        logger.error(f'Backup creation failed: {err_msg}')
        return Response({'error': err_msg[:300]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    backup_dir = _get_backup_dir()
    os.makedirs(backup_dir, exist_ok=True)
    backups = []
    for f in sorted(os.listdir(backup_dir), reverse=True):
        if f.endswith('.meta.json'):
            continue
        if f.endswith('_media.zip') or f.endswith('.env'):
            continue
        fpath = os.path.join(backup_dir, f)
        if not os.path.isfile(fpath):
            continue

        # Determine the meta.json path: strip .enc if present
        meta_base = f[:-4] if f.endswith('.enc') else f
        meta_path = os.path.join(backup_dir, meta_base + '.meta.json')
        meta = {}
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r', encoding='utf-8') as mf:
                    meta = json.load(mf)
            except (json.JSONDecodeError, UnicodeDecodeError):
                logger.warning(f'Corrupt meta file: {meta_path}')
                meta = {}
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
        try:
            file_size = os.path.getsize(fpath)
        except OSError:
            continue
        extra_files = meta.get('extra_files', [])
        media_file = next((ef.get('file', '') for ef in extra_files if ef.get('file', '').endswith('_media.zip')), '')
        env_file = next((ef.get('file', '') for ef in extra_files if ef.get('file', '').endswith('.env')), '')
        backups.append({
            'filename': f,
            'size': file_size,
            'created': meta.get('timestamp', ''),
            'display_time': display,
            'engine': meta.get('engine', ''),
            'checksum': meta.get('checksum', ''),
            'encrypted': meta.get('encrypted', False) or f.endswith('.enc'),
            'includes_media': meta.get('includes_media', False),
            'includes_env': meta.get('includes_env', False),
            'media_file': media_file,
            'env_file': env_file,
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_database(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)
    engine = settings.DATABASES['default']['ENGINE']
    db_path = settings.DATABASES['default']['NAME']
    if not os.path.exists(db_path):
        return Response({'error': 'فایل دیتابیس یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
    filename = os.path.basename(db_path)

    if 'sqlite' in engine:
        # Make a safe copy to avoid SQLite locking issues
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(db_path)[1] or '.sqlite3')
        tmp.close()
        try:
            _safe_sqlite_copy(db_path, tmp.name)
            response = FileResponse(open(tmp.name, 'rb'), as_attachment=True, filename=filename)
            def cleanup():
                try:
                    os.unlink(tmp.name)
                except Exception:
                    pass
            response._resource_closers.append(cleanup)
            return response
        except Exception as e:
            try:
                if os.path.exists(tmp.name):
                    os.unlink(tmp.name)
            except Exception:
                pass
            logger.exception(f'Database download failed: {e}')
            return Response({'error': f'خطا در خواندن دیتابیس: {str(e)[:200]}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        return FileResponse(open(db_path, 'rb'), as_attachment=True, filename=filename)


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
        with open(meta_path, 'r', encoding='utf-8') as mf:
            meta = json.load(mf)
        for ef in meta.get('extra_files', []):
            ef_path = os.path.join(_get_backup_dir(), ef.get('file', ''))
            if os.path.exists(ef_path):
                os.remove(ef_path)
        os.remove(meta_path)

    return Response({'message': 'فایل پشتیبان حذف شد'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def full_backup_download(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    result = execute_backup(backup_type='manual')
    if not result.get('success'):
        return Response({'error': result.get('error', 'خطا در پشتیبان‌گیری')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    raw_path = result['file']
    backup_dir = _get_backup_dir()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    if not os.path.exists(raw_path):
        return Response({'error': 'فایل پشتیبان روی سرور یافت نشد'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Handle encrypted backups: decrypt to a temp file for verification + inclusion
    tmp_decrypted = None
    is_encrypted = raw_path.endswith('.enc')
    if is_encrypted:
        try:
            from utils.encryption import get_fernet
            fernet = get_fernet()
            with open(raw_path, 'rb') as ef:
                encrypted_data = ef.read()
            decrypted_data = fernet.decrypt(encrypted_data)
            tmp_decrypted = tempfile.NamedTemporaryFile(delete=False, suffix='.sqlite3')
            tmp_decrypted.write(decrypted_data)
            tmp_decrypted.close()
            backup_path = tmp_decrypted.name
        except Exception as e:
            logger.exception(f'Failed to decrypt backup: {e}')
            if tmp_decrypted and os.path.exists(tmp_decrypted.name):
                os.unlink(tmp_decrypted.name)
            return Response({'error': f'خطا در رمزگشایی بک‌آپ: {str(e)[:200]}. کلید رمزنگاری ممکن است متفاوت باشد.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        backup_path = raw_path

    engine = settings.DATABASES['default']['ENGINE']
    verify = _verify_backup(backup_path, engine)
    if not verify.get('valid'):
        logger.error(f'Backup verification failed before export: {verify.get("error")}')
        if tmp_decrypted:
            os.unlink(tmp_decrypted.name)
        return Response({'error': f'بک‌آپ معتبر نیست: {verify.get("error")}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Gather all files for the ZIP
    # Meta file might be at raw_path.meta.json OR (raw_path without .enc).meta.json
    meta_candidates = [raw_path + '.meta.json']
    if raw_path.endswith('.enc'):
        meta_candidates.append(raw_path[:-4] + '.meta.json')
    meta_path = None
    for mc in meta_candidates:
        if os.path.exists(mc):
            meta_path = mc
            break
    files_to_include = [(backup_path, os.path.basename(backup_path))]
    if meta_path:
        files_to_include.append((meta_path, os.path.basename(meta_path)))
        try:
            with open(meta_path, 'r', encoding='utf-8') as mf:
                meta = json.load(mf)
            for ef in meta.get('extra_files', []):
                ef_path = os.path.join(backup_dir, ef.get('file', ''))
                if os.path.exists(ef_path):
                    files_to_include.append((ef_path, os.path.basename(ef_path)))
        except Exception as e:
            logger.warning(f'Could not read metadata for extra files: {e}')

    # Sanity check: all files exist and are readable
    for fp, _ in files_to_include:
        if not os.path.isfile(fp):
            logger.error(f'Backup file missing: {fp}')
            if tmp_decrypted:
                os.unlink(tmp_decrypted.name)
            return Response({'error': f'فایل {os.path.basename(fp)} در سرور یافت نشد'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Use temp file to avoid memory issues with large media
    tmp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
    try:
        with zipfile.ZipFile(tmp_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
            for fp, arcname in files_to_include:
                logger.info(f'Adding to ZIP: {arcname} ({os.path.getsize(fp)} bytes)')
                zf.write(fp, arcname)

        tmp_zip.close()
        zip_size = os.path.getsize(tmp_zip.name)
        logger.info(f'Full backup ZIP created: {zip_size} bytes, {len(files_to_include)} files')

        response = FileResponse(open(tmp_zip.name, 'rb'), as_attachment=True, filename=f'full_backup_{timestamp}.zip')
        response['Content-Length'] = zip_size

        def cleanup():
            try:
                os.unlink(tmp_zip.name)
            except Exception:
                pass
            if tmp_decrypted:
                try:
                    os.unlink(tmp_decrypted.name)
                except Exception:
                    pass

        response._resource_closers.append(cleanup)
        return response

    except Exception as e:
        logger.exception(f'Failed to create full backup ZIP: {e}')
        try:
            if os.path.exists(tmp_zip.name):
                os.unlink(tmp_zip.name)
        except Exception:
            pass
        try:
            if tmp_decrypted and os.path.exists(tmp_decrypted.name):
                os.unlink(tmp_decrypted.name)
        except Exception:
            pass
        return Response({'error': f'خطا در ساخت فایل ZIP: {str(e)[:200]}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    is_enc = fname.endswith('.enc')
    is_zip = fname.endswith('.zip')

    # No hard size limit — clinic data integrity is critical
    # But warn if extremely large
    if uploaded.size > 10 * 1024 * 1024 * 1024:
        logger.warning(f'Very large restore file: {uploaded.size} bytes')

    try:
        tmp_dir = None
        if is_zip:
            tmp_dir = tempfile.mkdtemp()
            zip_path = os.path.join(tmp_dir, 'restore.zip')
            with open(zip_path, 'wb') as f:
                for chunk in uploaded.chunks():
                    f.write(chunk)
            with zipfile.ZipFile(zip_path, 'r') as zf:
                bad = zf.testzip()
                if bad:
                    shutil.rmtree(tmp_dir)
                    return Response({'error': f'فایل ZIP خراب است: {bad}'}, status=status.HTTP_400_BAD_REQUEST)
                zf.extractall(tmp_dir)

                def _find_backup_files(d):
                    results = []
                    for root, _dirs, files in os.walk(d):
                        for f in files:
                            results.append(os.path.join(root, f))
                    return results

                all_extracted = _find_backup_files(tmp_dir)

                db_patterns = ('.db', '.sqlite', '.sqlite3')
                enc_db_files = [f for f in all_extracted if f.endswith('.enc') and not f.endswith('.env.enc')]
                sqlite_files = [f for f in all_extracted if f.endswith(db_patterns)]
                json_dump_files = [f for f in all_extracted if f.endswith('.json') and not f.endswith('.meta.json')]

                if enc_db_files:
                    inner_path = enc_db_files[0]
                    from utils.encryption import get_fernet
                    try:
                        fernet = get_fernet()
                        with open(inner_path, 'rb') as ef:
                            encrypted_data = ef.read()
                        decrypted_data = fernet.decrypt(encrypted_data)
                        is_json_enc = inner_path.lower().replace('.enc', '').endswith('.json')
                        suffix = '.json' if is_json_enc else '.sqlite3'
                        decrypted_path = os.path.join(tmp_dir, f'decrypted_backup{suffix}')
                        with open(decrypted_path, 'wb') as df:
                            df.write(decrypted_data)
                        inner_path = decrypted_path
                        is_sqlite = not is_json_enc
                    except Exception as decrypt_err:
                        shutil.rmtree(tmp_dir)
                        return Response({'error': f'خطا در رمزگشایی فایل پشتیبان: {str(decrypt_err)[:200]}. کلید رمزنگاری سرور ممکن است متفاوت باشد.'}, status=status.HTTP_400_BAD_REQUEST)
                elif sqlite_files:
                    inner_path = sqlite_files[0]
                    is_sqlite = True
                elif json_dump_files:
                    inner_path = json_dump_files[0]
                    is_sqlite = False
                else:
                    shutil.rmtree(tmp_dir)
                    return Response({'error': 'فایل ZIP باید شامل یک فایل دیتابیس (.db/.sqlite/.sqlite3/.enc/.json) باشد'}, status=status.HTTP_400_BAD_REQUEST)
                tmp_path = inner_path
        elif is_enc:
            # Standalone encrypted file
            tmp_dir = tempfile.mkdtemp()
            enc_path = os.path.join(tmp_dir, 'backup.enc')
            with open(enc_path, 'wb') as f:
                for chunk in uploaded.chunks():
                    f.write(chunk)
            from utils.encryption import get_fernet
            try:
                fernet = get_fernet()
                with open(enc_path, 'rb') as ef:
                    encrypted_data = ef.read()
                decrypted_data = fernet.decrypt(encrypted_data)
                decrypted_path = os.path.join(tmp_dir, 'decrypted_backup.sqlite3')
                with open(decrypted_path, 'wb') as df:
                    df.write(decrypted_data)
                tmp_path = decrypted_path
                is_sqlite = True
            except Exception as decrypt_err:
                shutil.rmtree(tmp_dir)
                return Response({'error': f'خطا در رمزگشایی: {str(decrypt_err)[:200]}. کلید رمزنگاری ممکن است متفاوت باشد.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            tmp_path = tempfile.mktemp(suffix=('.sqlite3' if is_sqlite else '.json'))
            with open(tmp_path, 'wb') as f:
                for chunk in uploaded.chunks():
                    f.write(chunk)

        db_path = str(settings.DATABASES['default']['NAME'])

        def _cleanup():
            if tmp_dir:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            elif tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

        if is_sqlite:
            import sqlite3
            try:
                conn = sqlite3.connect(tmp_path)
                conn.execute('SELECT COUNT(*) FROM sqlite_master')
                conn.close()
            except Exception:
                _cleanup()
                return Response({'error': 'فرمت فایل SQLite نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

            safe_path = db_path + '.restore_safe'
            _safe_sqlite_copy(db_path, safe_path)

            try:
                from django.db import connection
                connection.close()
                _safe_sqlite_copy(tmp_path, db_path)
                out = StringIO()
                try:
                    call_command('migrate', '--no-input', stdout=out)
                except Exception as migrate_err:
                    logger.warning(f'Migration after restore failed, attempting with --fake: {migrate_err}')
                    call_command('migrate', '--fake', '--no-input', stdout=out)
                _cleanup()
                if os.path.exists(safe_path):
                    os.unlink(safe_path)

                # After DB restore, also restore media and env if extracted from ZIP
                restore_results = {}
                if tmp_dir:
                    media_zips = []
                    for root, _dirs, files in os.walk(tmp_dir):
                        for f in files:
                            if f.endswith('_media.zip'):
                                media_zips.append(os.path.join(root, f))
                    if media_zips:
                        media_zip_path = media_zips[0]
                        try:
                            media_root = settings.MEDIA_ROOT
                            os.makedirs(media_root, exist_ok=True)
                            with zipfile.ZipFile(media_zip_path, 'r') as mz:
                                mz.extractall(media_root)
                            restore_results['media'] = 'بازیابی شد'
                        except Exception as me:
                            restore_results['media'] = f'خطا: {str(me)[:100]}'

                    env_files = []
                    for root, _dirs, files in os.walk(tmp_dir):
                        for f in files:
                            if f.endswith('.env') and not f.endswith('.meta.json'):
                                env_files.append(os.path.join(root, f))
                    if env_files:
                        env_path = env_files[0]
                        try:
                            dest_env = os.path.join(settings.BASE_DIR, '.env')
                            shutil.copy2(env_path, dest_env)
                            restore_results['env'] = 'بازیابی شد'
                        except Exception as ee:
                            restore_results['env'] = f'خطا: {str(ee)[:100]}'

                msg = 'بازیابی دیتابیس با موفقیت انجام شد. لطفاً دوباره وارد شوید.'
                if restore_results:
                    parts = ['دیتابیس: بازیابی شد']
                    for k, v in restore_results.items():
                        parts.append(f'{k}: {v}')
                    msg = ' | '.join(parts)
                return Response({'message': msg, 'restore_results': restore_results})
            except Exception as e:
                if os.path.exists(safe_path):
                    _safe_sqlite_copy(safe_path, db_path)
                _cleanup()
                if os.path.exists(safe_path):
                    os.unlink(safe_path)
                return Response({'error': f'خطا در بازیابی: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            try:
                with open(tmp_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    _cleanup()
                    return Response({'error': 'فرمت فایل پشتیبان نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                _cleanup()
                return Response({'error': 'خطا در خواندن فایل پشتیبان'}, status=status.HTTP_400_BAD_REQUEST)

            safe_path = db_path + '.restore_safe'
            _safe_sqlite_copy(db_path, safe_path)

            out = StringIO()
            err = StringIO()
            try:
                call_command('flush', '--no-input', stdout=out, stderr=err)
                call_command('migrate', '--no-input', stdout=out, stderr=err)
                call_command('loaddata', tmp_path, '--ignorenonexistent', stdout=out, stderr=err)
                call_command('migrate', '--no-input', stdout=out, stderr=err)
                call_command('backfill_raw_fields', stdout=out, stderr=err)
                _cleanup()

                # Restore media and env if extracted from ZIP
                restore_results = {}
                if tmp_dir:
                    media_zips = []
                    for root, _dirs, files in os.walk(tmp_dir):
                        for f in files:
                            if f.endswith('_media.zip'):
                                media_zips.append(os.path.join(root, f))
                    if media_zips:
                        media_zip_path = media_zips[0]
                        try:
                            media_root = settings.MEDIA_ROOT
                            os.makedirs(media_root, exist_ok=True)
                            with zipfile.ZipFile(media_zip_path, 'r') as mz:
                                mz.extractall(media_root)
                            restore_results['media'] = 'بازیابی شد'
                        except Exception as me:
                            restore_results['media'] = f'خطا: {str(me)[:100]}'

                    env_files = []
                    for root, _dirs, files in os.walk(tmp_dir):
                        for f in files:
                            if f.endswith('.env') and not f.endswith('.meta.json'):
                                env_files.append(os.path.join(root, f))
                    if env_files:
                        env_path = env_files[0]
                        try:
                            dest_env = os.path.join(settings.BASE_DIR, '.env')
                            shutil.copy2(env_path, dest_env)
                            restore_results['env'] = 'بازیابی شد'
                        except Exception as ee:
                            restore_results['env'] = f'خطا: {str(ee)[:100]}'

                msg = 'بازیابی JSON با موفقیت انجام شد. درصورت مشکل با نام کاربری و رمز قبلی وارد شوید.'
                if restore_results:
                    parts = ['دیتابیس: بازیابی شد']
                    for k, v in restore_results.items():
                        parts.append(f'{k}: {v}')
                    msg = ' | '.join(parts)
                return Response({'message': msg, 'restore_results': restore_results})
            except Exception:
                if os.path.exists(safe_path):
                    from django.db import connection
                    connection.close()
                    _safe_sqlite_copy(safe_path, db_path)
                _cleanup()
                if os.path.exists(safe_path):
                    os.unlink(safe_path)
                raise
    except Exception as e:
        logger.exception(f'Backup restore failed: {e}')
        if tmp_dir:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_media(request, filename):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)
    backup_dir = _get_backup_dir()
    safe_name = os.path.basename(sanitize_filename(filename))
    fpath = os.path.join(backup_dir, safe_name)
    if not os.path.isfile(fpath) or not safe_name.endswith('_media.zip'):
        return Response({'error': 'فایل مدیا یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
    try:
        media_root = settings.MEDIA_ROOT
        os.makedirs(media_root, exist_ok=True)
        with zipfile.ZipFile(fpath, 'r') as zf:
            zf.extractall(media_root)
        return Response({'message': 'فایل‌های مدیا با موفقیت بازیابی شدند'})
    except Exception as e:
        return Response({'error': f'خطا در بازیابی مدیا: {str(e)[:200]}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_env(request, filename):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)
    backup_dir = _get_backup_dir()
    safe_name = os.path.basename(sanitize_filename(filename))
    fpath = os.path.join(backup_dir, safe_name)
    if not os.path.isfile(fpath) or not safe_name.endswith('.env') or safe_name.endswith('.meta.json'):
        return Response({'error': 'فایل env یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
    try:
        dest_env = os.path.join(settings.BASE_DIR, '.env')
        shutil.copy2(fpath, dest_env)
        return Response({'message': 'فایل تنظیمات (.env) با موفقیت بازیابی شد'})
    except Exception as e:
        return Response({'error': f'خطا در بازیابی env: {str(e)[:200]}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


# ── GitHub Backup ──────────────────────────────────────────


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def github_config(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    from .models import GitHubBackupConfig

    if request.method == 'GET':
        cfg, _ = GitHubBackupConfig.objects.get_or_create(id=1)
        return Response({
            'repo': cfg.repo,
            'has_token': bool(cfg.token),
            'oauth_connected': bool(cfg.oauth_token),
            'github_user': cfg.github_user,
            'has_client_id': bool(cfg.oauth_client_id or settings.GITHUB_CLIENT_ID),
            'auto_upload': cfg.auto_upload,
            'keep_last_n': cfg.keep_last_n,
            'last_upload_at': cfg.last_upload_at.isoformat() if cfg.last_upload_at else None,
            'last_upload_file': cfg.last_upload_file,
            'last_upload_status': cfg.last_upload_status,
        })

    cfg, _ = GitHubBackupConfig.objects.get_or_create(id=1)
    cfg.repo = request.data.get('repo', cfg.repo)
    cfg.auto_upload = bool(request.data.get('auto_upload', cfg.auto_upload))
    cfg.keep_last_n = int(request.data.get('keep_last_n', cfg.keep_last_n))
    token = request.data.get('token')
    if token:
        cfg.token = token
    client_id = request.data.get('oauth_client_id')
    if client_id:
        cfg.oauth_client_id = client_id
    client_secret = request.data.get('oauth_client_secret')
    if client_secret:
        cfg.oauth_client_secret = client_secret
    cfg.save()

    return Response({'message': 'تنظیمات GitHub ذخیره شد'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def github_test(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    from .models import GitHubBackupConfig
    cfg, _ = GitHubBackupConfig.objects.get_or_create(id=1)

    repo = request.data.get('repo', cfg.repo)
    token = request.data.get('token', cfg.token or cfg.oauth_token)
    if not repo or not token:
        return Response({'error': 'ریپازیتوری و توکن را وارد کنید'}, status=status.HTTP_400_BAD_REQUEST)

    from .github_backup import test_connection
    result = test_connection(repo, token)
    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def github_upload(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    backup_dir = _get_backup_dir()
    if not os.path.isdir(backup_dir):
        return Response({'error': 'پوشه پشتیبان یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    files = sorted([
        f for f in os.listdir(backup_dir)
        if os.path.isfile(os.path.join(backup_dir, f)) and not f.endswith('.meta.json')
    ], reverse=True)

    if not files:
        return Response({'error': 'هیچ فایل پشتیبانی برای آپلود وجود ندارد'}, status=status.HTTP_404_NOT_FOUND)

    latest = files[0]
    filepath = os.path.join(backup_dir, latest)

    from .github_backup import upload_backup
    result = upload_backup(filepath, latest)

    from .models import GitHubBackupConfig
    cfg, _ = GitHubBackupConfig.objects.get_or_create(id=1)
    from django.utils import timezone as dj_timezone
    cfg.last_upload_at = dj_timezone.now()
    cfg.last_upload_file = latest
    cfg.last_upload_status = 'موفق' if result.get('success') else f'شکست: {result.get("error", "")}'
    cfg.save()

    if result.get('success'):
        from .models import BackupLog
        log = BackupLog.objects.filter(filename=latest).order_by('-created_at').first()
        if log:
            log.github_uploaded = True
            log.save(update_fields=['github_uploaded'])
        return Response({
            'message': 'فایل با موفقیت به GitHub آپلود شد',
            'download_url': result.get('download_url'),
            'release_url': result.get('release_url'),
        })
    return Response({'error': result.get('error', 'خطا در آپلود به GitHub')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── GitHub OAuth ──────────────────────────────────────────


import requests as http_requests


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def github_auth_url(request):
    """Return GitHub OAuth authorization URL"""
    from .models import GitHubBackupConfig
    import secrets
    cfg = GitHubBackupConfig.objects.filter(id=1).first()
    client_id = (cfg.oauth_client_id if cfg and cfg.oauth_client_id else '') or settings.GITHUB_CLIENT_ID
    if not client_id:
        return Response({'error': 'GitHub Client ID تنظیم نشده است. ابتدا Client ID و Client Secret اپ گیت‌هاب را در تنظیمات وارد کنید.'}, status=status.HTTP_400_BAD_REQUEST)
    state = secrets.token_urlsafe(32)
    from django.core.cache import cache
    cache.set(f'gh_oauth_state:{state}', request.user.id, timeout=600)
    redirect_uri = request.build_absolute_uri('/api/backup/github/callback/')
    url = (
        f'https://github.com/login/oauth/authorize'
        f'?client_id={client_id}'
        f'&redirect_uri={redirect_uri}'
        f'&scope=repo'
        f'&state={state}'
    )
    return Response({'url': url})


@api_view(['GET'])
@permission_classes([AllowAny])
def github_callback(request):
    """Handle GitHub OAuth callback"""
    code = request.GET.get('code')
    state = request.GET.get('state', '')
    error = request.GET.get('error')
    if error:
        return HttpResponse(f'GitHub OAuth error: {error}', status=400)
    if not code:
        return HttpResponse('Missing code parameter', status=400)

    from django.core.cache import cache
    user_id = cache.get(f'gh_oauth_state:{state}')
    if not user_id:
        return HttpResponse('Invalid or expired state parameter. Please try again.', status=400)
    cache.delete(f'gh_oauth_state:{state}')

    from .models import GitHubBackupConfig
    cfg = GitHubBackupConfig.objects.filter(id=1).first()
    client_id = (cfg.oauth_client_id if cfg and cfg.oauth_client_id else '') or settings.GITHUB_CLIENT_ID
    client_secret = (cfg.oauth_client_secret if cfg and cfg.oauth_client_secret else '') or settings.GITHUB_CLIENT_SECRET
    if not client_id or not client_secret:
        return HttpResponse('GitHub OAuth not configured', status=400)

    # Exchange code for access token
    token_resp = http_requests.post(
        'https://github.com/login/oauth/access_token',
        json={
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
        },
        headers={'Accept': 'application/json'},
    )
    token_data = token_resp.json()
    access_token = token_data.get('access_token')
    if not access_token:
        return HttpResponse(f'Failed to get access token: {token_data.get("error_description", token_data.get("error", "unknown"))}', status=400)

    # Get user info
    user_resp = http_requests.get(
        'https://api.github.com/user',
        headers={
            'Authorization': f'token {access_token}',
            'Accept': 'application/vnd.github.v3+json',
        },
    )
    if user_resp.status_code != 200:
        return HttpResponse('Failed to get GitHub user info', status=400)
    user_data = user_resp.json()
    github_user = user_data.get('login', '')
    github_user_id = user_data.get('id')

    # Find the user from cached state
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
    except (ValueError, User.DoesNotExist):
        user = None

    from .models import GitHubBackupConfig
    cfg, _ = GitHubBackupConfig.objects.get_or_create(id=1)
    cfg.oauth_token = access_token
    cfg.github_user = github_user
    cfg.github_user_id = github_user_id
    cfg.save()

    frontend_url = settings.FRONTEND_URL.rstrip('/')
    return HttpResponse(f'''
    <!DOCTYPE html>
    <html dir="rtl">
    <head><meta charset="utf-8"><title>اتصال به GitHub</title></head>
    <body style="font-family:Tahoma;text-align:center;padding:50px;background:#f5f5f5;">
        <div style="background:white;max-width:400px;margin:auto;padding:30px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#28a745;">اتصال موفق ✅</h2>
            <p>حساب GitHub <strong>{github_user}</strong> با موفقیت متصل شد.</p>
            <p style="font-size:13px;color:#666;">اکنون می‌توانید این پنجره را ببندید.</p>
            <a href="{frontend_url}/panel/backup"
               style="display:inline-block;margin-top:15px;padding:10px 24px;background:#24292e;color:white;text-decoration:none;border-radius:6px;">
                بازگشت به پنل
            </a>
        </div>
        <script>
            setTimeout(function() {{ window.close(); }}, 2000);
        </script>
    </body></html>
    ''')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def github_disconnect(request):
    """Disconnect GitHub OAuth"""
    from .models import GitHubBackupConfig
    cfg, _ = GitHubBackupConfig.objects.get_or_create(id=1)
    cfg.oauth_token = ''
    cfg.github_user = ''
    cfg.github_user_id = None
    cfg.oauth_token_expires_at = None
    cfg.repo = ''
    cfg.save()
    return Response({'message': 'اتصال GitHub قطع شد'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def github_list_repos(request):
    """List user's GitHub repos using stored OAuth token"""
    from .models import GitHubBackupConfig
    cfg = GitHubBackupConfig.objects.filter(id=1).first()
    if not cfg or not cfg.oauth_token:
        return Response({'error': 'ابتدا به GitHub متصل شوید'}, status=status.HTTP_400_BAD_REQUEST)

    resp = http_requests.get(
        'https://api.github.com/user/repos?per_page=100&sort=updated&type=all',
        headers={
            'Authorization': f'token {cfg.oauth_token}',
            'Accept': 'application/vnd.github.v3+json',
        },
    )
    if resp.status_code != 200:
        return Response({'error': 'خطا در دریافت لیست ریپازیتوری‌ها'}, status=status.HTTP_400_BAD_REQUEST)

    repos = [{
        'full_name': r['full_name'],
        'name': r['name'],
        'private': r['private'],
        'description': r.get('description', ''),
        'html_url': r['html_url'],
        'default_branch': r['default_branch'],
    } for r in resp.json()]

    return Response({
        'repos': repos,
        'github_user': cfg.github_user,
        'connected': bool(cfg.oauth_token),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def github_status(request):
    """Check if GitHub OAuth is connected"""
    from .models import GitHubBackupConfig
    cfg = GitHubBackupConfig.objects.filter(id=1).first()
    return Response({
        'connected': bool(cfg and cfg.oauth_token),
        'github_user': cfg.github_user if cfg else '',
        'repo': cfg.repo if cfg else '',
    })


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def backup_verify(request):
    if request.user.role not in ('admin', 'super_support'):
        return Response({'error': 'دسترسی محدود'}, status=status.HTTP_403_FORBIDDEN)

    filename = request.data.get('filename', '')
    if not filename:
        return Response({'error': 'نام فایل وارد نشده'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        filepath = _safe_join(_get_backup_dir(), filename)
    except ValueError:
        return Response({'error': 'نام فایل نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)

    if not os.path.exists(filepath):
        return Response({'error': 'فایل یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    engine = settings.DATABASES['default']['ENGINE']

    if filepath.endswith('.enc'):
        try:
            from utils.encryption import get_fernet
            fernet = get_fernet()
            with open(filepath, 'rb') as ef:
                encrypted_data = ef.read()
            decrypted_data = fernet.decrypt(encrypted_data)
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.sqlite3')
            tmp.write(decrypted_data)
            tmp.close()
            verify = _verify_backup(tmp.name, engine)
            os.unlink(tmp.name)
        except Exception as e:
            return Response({'valid': False, 'error': f'خطا در رمزگشایی: {str(e)[:200]}'})
    else:
        verify = _verify_backup(filepath, engine)

    checksum = _get_checksum(filepath)

    return Response({
        'valid': verify.get('valid', False),
        'error': verify.get('error', ''),
        'tables': verify.get('tables', 0),
        'checksum': checksum,
        'file_size': os.path.getsize(filepath),
    })
