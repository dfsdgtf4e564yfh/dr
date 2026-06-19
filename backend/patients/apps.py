from django.apps import AppConfig
from django.db.models.signals import post_save


class PatientsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'patients'

    def ready(self):
        import patients.models
        import patients.signals
