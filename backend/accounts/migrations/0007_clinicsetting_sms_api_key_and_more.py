from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_user_page_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='clinicsetting',
            name='sms_api_key',
            field=models.CharField(blank=True, max_length=300, verbose_name='کلید API سامانه پیامک'),
        ),
        migrations.AddField(
            model_name='clinicsetting',
            name='sms_line_number',
            field=models.CharField(blank=True, max_length=30, verbose_name='شماره خط ارسال'),
        ),
        migrations.AddField(
            model_name='clinicsetting',
            name='sms_provider',
            field=models.CharField(blank=True, default='sms_ir', max_length=20, verbose_name='ارائه‌دهنده پیامک'),
        ),
    ]
