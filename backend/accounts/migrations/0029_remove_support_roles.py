from django.db import migrations, models


def convert_support_users_to_admin(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role__in=['support', 'super_support']).update(role='admin')


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0028_user_restrictions'),
    ]

    operations = [
        migrations.RunPython(convert_support_users_to_admin, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('admin', 'مدیر کلینیک'),
                    ('reception', 'پذیرش'),
                    ('doctor', 'درمانگر'),
                    ('psychologist', 'روانشناس / درمانگر'),
                    ('rtms', 'کاربر ویژه'),
                ],
                default='reception', max_length=20, verbose_name='نقش'
            ),
        ),
    ]
