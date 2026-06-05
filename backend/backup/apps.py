from django.apps import AppConfig

class BackupConfig(AppConfig):
    name = 'backup'
    verbose_name = 'پشتیبان‌گیری'

    def ready(self):
        from .scheduler import init_scheduler
        init_scheduler()
