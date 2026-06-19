from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0017_update_treatment_types'),
    ]

    operations = [
        migrations.AddField(
            model_name='clinicsetting',
            name='app_title',
            field=models.CharField(blank=True, default='', max_length=200, verbose_name='عنوان برنامه (title)'),
        ),
        migrations.AddField(
            model_name='clinicsetting',
            name='favicon',
            field=models.ImageField(blank=True, null=True, upload_to='clinic_logos/', verbose_name='آیکون مرورگر'),
        ),
        migrations.AddField(
            model_name='clinicsetting',
            name='primary_color',
            field=models.CharField(blank=True, default='', max_length=7, verbose_name='رنگ اصلی (مثلاً #4F46E5)'),
        ),
        migrations.AddField(
            model_name='clinicsetting',
            name='secondary_color',
            field=models.CharField(blank=True, default='', max_length=7, verbose_name='رنگ ثانویه (مثلاً #7C3AED)'),
        ),
        migrations.AddField(
            model_name='clinicsetting',
            name='features',
            field=models.JSONField(blank=True, default=dict, verbose_name='تنظیمات ویژگی‌ها'),
        ),
    ]
