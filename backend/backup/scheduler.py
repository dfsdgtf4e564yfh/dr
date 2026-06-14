import os
import json
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from django.conf import settings

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()
SCHEDULER_JOB_ID = 'auto_backup'
EMAIL_BACKUP_JOB_ID = 'email_backup'


def run_backup():
    from .tasks import execute_backup
    result = execute_backup(backup_type='auto')
    if result.get('success'):
        logger.info(f'Auto backup completed: {result.get("file")}')
        if result.get('deleted_old'):
            logger.info(f'Cleaned {len(result["deleted_old"])} old backups')
    else:
        logger.error(f'Auto backup failed: {result.get("error")}')
        _send_alert(f'Auto backup failed: {result.get("error")}')


def run_email_backup():
    try:
        from .models import EmailBackupConfig
        from .email_backup import send_backup_email
        cfg = EmailBackupConfig.objects.filter(id=1).first()
        if not cfg or not cfg.auto_send or not cfg.sender_email:
            return
        backup_dir = getattr(settings, 'BACKUP_DIR', os.path.join(settings.BASE_DIR, 'backups'))
        if not os.path.isdir(backup_dir):
            return
        for f in sorted(os.listdir(backup_dir)):
            if f.endswith('.meta.json'):
                continue
            fpath = os.path.join(backup_dir, f)
            if not os.path.isfile(fpath):
                continue
            result = send_backup_email(fpath, f)
            if result.get('success'):
                logger.info(f'Email sent: {f}')
    except Exception as e:
        logger.error(f'Email auto send failed: {e}')


def _send_alert(message: str):
    try:
        from django.core.mail import send_mail
        recipients = getattr(settings, 'ALERT_EMAIL_RECIPIENTS', [])
        if recipients:
            send_mail('Clinic Backup Alert', message,
                      settings.DEFAULT_FROM_EMAIL, recipients, fail_silently=True)
    except Exception as e:
        logger.error(f'Alert failed: {e}')


def get_schedule_config():
    from backup.models import BackupSchedule
    obj, _ = BackupSchedule.objects.get_or_create(id=1, defaults={
        'enabled': True, 'hour': 3, 'minute': 0, 'retention_days': 30,
    })
    return obj


def update_schedule(hour, minute, enabled):
    from backup.models import BackupSchedule
    obj, _ = BackupSchedule.objects.get_or_create(id=1)
    obj.hour = hour
    obj.minute = minute
    obj.enabled = enabled
    obj.save()
    start_scheduler(hour, minute)
    return obj


def start_scheduler(hour=None, minute=None):
    if hour is None or minute is None:
        cfg = get_schedule_config()
        hour, minute = cfg.hour, cfg.minute
    if scheduler.get_job(SCHEDULER_JOB_ID):
        scheduler.remove_job(SCHEDULER_JOB_ID)
    scheduler.add_job(
        run_backup,
        CronTrigger(hour=hour, minute=minute, timezone='Asia/Tehran'),
        id=SCHEDULER_JOB_ID,
        replace_existing=True,
    )
    if not scheduler.running:
        scheduler.start()
    logger.info(f'Scheduler started: daily backup at {hour:02d}:{minute:02d}')


def start_email_send_scheduler():
    from .models import EmailBackupConfig
    cfg = EmailBackupConfig.objects.filter(id=1).first()
    if not cfg or not cfg.auto_send:
        if scheduler.get_job(EMAIL_BACKUP_JOB_ID):
            scheduler.remove_job(EMAIL_BACKUP_JOB_ID)
        logger.info('Email auto-send scheduler stopped')
        return
    if scheduler.get_job(EMAIL_BACKUP_JOB_ID):
        scheduler.reschedule_job(EMAIL_BACKUP_JOB_ID, trigger=IntervalTrigger(hours=8))
    else:
        scheduler.add_job(
            run_email_backup,
            IntervalTrigger(hours=8),
            id=EMAIL_BACKUP_JOB_ID,
            replace_existing=True,
        )
    if not scheduler.running:
        scheduler.start()
    logger.info('Email auto-send scheduler started: every 8 hours')


def stop_scheduler():
    for jid in (SCHEDULER_JOB_ID, EMAIL_BACKUP_JOB_ID):
        if scheduler.get_job(jid):
            scheduler.remove_job(jid)
    logger.info('Scheduler stopped')


def init_scheduler():
    import os
    # Only init scheduler in the main server process, not during migrate/collectstatic
    if os.environ.get('RUN_MAIN') == 'true' or os.environ.get('SERVER_STARTED'):
        _do_init_scheduler()
    else:
        # Delay-init: will be called when first request comes in
        from django.db import connection
        try:
            table_names = connection.introspection.table_names()
            if 'backup_backupschedule' in table_names:
                _do_init_scheduler()
        except Exception as e:
            logger.warning(f'Scheduler init deferred: {e}')


def _do_init_scheduler():
    try:
        cfg = get_schedule_config()
        if cfg.enabled:
            start_scheduler(cfg.hour, cfg.minute)
        start_email_send_scheduler()
    except Exception as e:
        logger.warning(f'Scheduler init skipped (will retry): {e}')
