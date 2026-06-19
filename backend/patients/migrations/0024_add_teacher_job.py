from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('patients', '0023_patient_visible_to_rtms'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patient',
            name='job',
            field=models.CharField(blank=True, choices=[
                ('doctor', 'پزشک'), ('midwife', 'ماما'), ('engineer', 'مهندس'),
                ('nurse', 'پرستار'), ('employee', 'کارمند'), ('worker', 'کارگر'),
                ('housewife', 'خانه دار'), ('freelance', 'آزاد'),
                ('teacher', 'معلم / استاد'),
            ], max_length=50, null=True, verbose_name='شغل'),
        ),
    ]
