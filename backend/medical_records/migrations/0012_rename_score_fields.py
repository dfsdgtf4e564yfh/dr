from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical_records', '0011_tmsform_scores'),
    ]

    operations = [
        migrations.RenameField(
            model_name='tmsform',
            old_name='score_u',
            new_name='score_x',
        ),
        migrations.RenameField(
            model_name='tmsform',
            old_name='score_mt1',
            new_name='score_mt80',
        ),
        migrations.RenameField(
            model_name='tmsform',
            old_name='score_mt2',
            new_name='score_mt90',
        ),
        migrations.RenameField(
            model_name='tmsform',
            old_name='score_mt3',
            new_name='score_mt100',
        ),
        migrations.RenameField(
            model_name='tmsform',
            old_name='score_mt4',
            new_name='score_mt120',
        ),
        migrations.AddField(
            model_name='tmsform',
            name='score_mt130',
            field=models.FloatField(blank=True, null=True, verbose_name='Mt130'),
        ),
    ]
