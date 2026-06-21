import os
import logging
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from smtplib import SMTP, SMTP_SSL, SMTPException
from datetime import datetime
from django.conf import settings

logger = logging.getLogger(__name__)


def get_config():
    from .models import EmailBackupConfig
    obj, _ = EmailBackupConfig.objects.get_or_create(id=1)
    return obj


def send_backup_email(filepath, filename):
    cfg = get_config()
    if not cfg.sender_email or not cfg.recipient_email:
        return {'success': False, 'error': 'ایمیل فرستنده یا گیرنده تنظیم نشده'}

    if not os.path.exists(filepath):
        return {'success': False, 'error': 'فایل پشتیبان یافت نشد'}

    try:
        msg = MIMEMultipart()
        msg['From'] = cfg.sender_email
        msg['To'] = cfg.recipient_email
        msg['Subject'] = f'پشتیبان کلینیک - {filename}'

        body = MIMEText(f'فایل پشتیبان سیستم کلینیک\n'
                        f'نام فایل: {filename}\n'
                        f'حجم: {os.path.getsize(filepath) / 1024:.1f} KB\n'
                        f'تاریخ: {datetime.now().strftime("%Y-%m-%d %H:%M")}',
                        'plain', 'utf-8')
        msg.attach(body)

        with open(filepath, 'rb') as f:
            part = MIMEApplication(f.read(), Name=filename)
            part['Content-Disposition'] = f'attachment; filename="{filename}"'
            msg.attach(part)

        if cfg.smtp_port == 465:
            server = SMTP_SSL(cfg.smtp_host, cfg.smtp_port, timeout=30)
        else:
            server = SMTP(cfg.smtp_host, cfg.smtp_port, timeout=30)
            if cfg.use_tls:
                server.starttls()

        if cfg.sender_password:
            server.login(cfg.sender_email, cfg.sender_password)

        server.sendmail(cfg.sender_email, [cfg.recipient_email], msg.as_string())
        server.quit()

        cfg.last_sent_at = datetime.now()
        cfg.save(update_fields=['last_sent_at'])

        logger.info(f'Backup email sent: {filename} to {cfg.recipient_email}')
        return {'success': True, 'message': f'ایمیل با موفقیت به {cfg.recipient_email} ارسال شد'}

    except SMTPException as e:
        logger.error(f'SMTP error: {e}')
        return {'success': False, 'error': f'خطای SMTP: {e}'}
    except Exception as e:
        logger.error(f'Email send failed: {e}')
        return {'success': False, 'error': str(e)}


def test_connection():
    cfg = get_config()
    if not cfg.sender_email:
        return {'success': False, 'error': 'ایمیل فرستنده تنظیم نشده'}

    try:
        if cfg.smtp_port == 465:
            server = SMTP_SSL(cfg.smtp_host, cfg.smtp_port, timeout=15)
        else:
            server = SMTP(cfg.smtp_host, cfg.smtp_port, timeout=15)
            if cfg.use_tls:
                server.starttls()

        if cfg.sender_password:
            server.login(cfg.sender_email, cfg.sender_password)

        server.quit()
        return {'success': True, 'message': 'اتصال SMTP با موفقیت برقرار شد'}

    except SMTPException as e:
        return {'success': False, 'error': f'خطای SMTP: {e}'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
