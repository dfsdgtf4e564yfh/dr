import os
from django.apps import AppConfig

class BackupConfig(AppConfig):
    name = 'backup'
    verbose_name = 'پشتیبان‌گیری'

    def ready(self):
        if os.environ.get('RUN_MAIN') == 'true' or os.environ.get('SERVER_STARTED'):
            from .scheduler import init_scheduler
            init_scheduler()
        elif not os.environ.get('GUNICORN_CMD_ARGS') and not os.environ.get('SERVER_SOFTWARE', '').startswith('gunicorn'):
            from .scheduler import init_scheduler
            init_scheduler()
