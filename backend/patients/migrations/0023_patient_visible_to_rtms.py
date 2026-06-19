from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('patients', '0022_rehash_with_hmac'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='visible_to_rtms',
            field=models.BooleanField(default=False, verbose_name='قابل مشاهده برای کاربران ویژه'),
        ),
    ]
