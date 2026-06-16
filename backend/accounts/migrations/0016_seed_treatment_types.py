from django.db import migrations


TREATMENT_TYPES = [
    'TMS / rTMS',
    'نقشه مغزی (QEEG)',
    'tDCS',
    'توانبخشی شناختی',
    'روانشناسی (مشاوره)',
    'لیزر',
    'لورتا',
    'سایر',
]

REMOVE_TYPES = [
    'ویزیت',
    'مشاوره',
    'QEEG',
    'مشاور',
    'نوروفیدبک',
    'تحریک الکتریکی',
    'بیوفیدبک',
    'روانشناسی',
    'روانپزشکی',
    'گفتار درمانی',
    'کاردرمانی',
    'کاهش ولع اعتیاد به بازی',
]


def seed_treatment_types(apps, schema_editor):
    TreatmentType = apps.get_model('accounts', 'TreatmentType')

    TreatmentType.objects.filter(name__in=REMOVE_TYPES).delete()

    existing = set(TreatmentType.objects.values_list('name', flat=True))
    for name in TREATMENT_TYPES:
        if name not in existing:
            TreatmentType.objects.create(name=name)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0015_alter_treatmenttype_name_alter_user_role'),
    ]

    operations = [
        migrations.RunPython(seed_treatment_types),
    ]
