# Generated migration to rename AirValidation to HVACValidation

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('air_validation', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='AirValidation',
            new_name='HVACValidation',
        ),
        migrations.AlterModelTable(
            name='hvacvalidation',
            table='hvac_validations',
        ),
        migrations.AlterModelOptions(
            name='hvacvalidation',
            options={
                'verbose_name': 'HVAC Validation',
                'verbose_name_plural': 'HVAC Validations',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AlterField(
            model_name='hvacvalidation',
            name='operator',
            field=models.ForeignKey(
                null=True,
                on_delete=models.SET_NULL,
                related_name='hvac_validations',
                to='accounts.user'
            ),
        ),
    ]

