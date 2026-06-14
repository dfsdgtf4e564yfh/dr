from django.apps import AppConfig


class AppointmentsConfig(AppConfig):
    name = 'appointments'
    verbose_name = 'نوبت‌ها'

    def ready(self):
        import appointments.signals
