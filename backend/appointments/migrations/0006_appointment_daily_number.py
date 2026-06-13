from django.db import migrations, models


def backfill_daily_numbers(apps, schema_editor):
    Appointment = apps.get_model('appointments', 'Appointment')
    dates = Appointment.objects.values('date').distinct().order_by('date')
    for d in dates:
        apps_on_date = Appointment.objects.filter(date=d['date']).order_by('time', 'id')
        for idx, app in enumerate(apps_on_date, start=1):
            Appointment.objects.filter(id=app.id).update(daily_number=idx)


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0005_appointment_service_cost'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='daily_number',
            field=models.PositiveIntegerField(blank=True, null=True, verbose_name='شماره نوبت روزانه'),
        ),
        migrations.RunPython(backfill_daily_numbers),
    ]
