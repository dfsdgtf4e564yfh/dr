from django.db import migrations


def delete_support_role_records(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name__in=['support', 'super_support']).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0029_remove_support_roles'),
    ]

    operations = [
        migrations.RunPython(delete_support_role_records, migrations.RunPython.noop),
    ]
