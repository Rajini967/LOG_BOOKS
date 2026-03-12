from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("chiller_logs", "0018_alter_chillerequipmentstatusaudit_field_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="chillerlog",
            name="activity_type",
            field=models.CharField(
                choices=[("operation", "Operation"), ("maintenance", "Maintenance"), ("shutdown", "Shutdown")],
                default="operation",
                help_text="Activity status for this log entry (drives reading applicability).",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="activity_from_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="activity_to_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="activity_from_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="activity_to_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="chiller_supply_temp",
            field=models.FloatField(
                blank=True,
                help_text="Chiller supply temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="chiller_return_temp",
            field=models.FloatField(
                blank=True,
                help_text="Chiller return temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="cooling_tower_supply_temp",
            field=models.FloatField(
                blank=True,
                help_text="Cooling tower supply temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="cooling_tower_return_temp",
            field=models.FloatField(
                blank=True,
                help_text="Cooling tower return temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="ct_differential_temp",
            field=models.FloatField(
                blank=True,
                help_text="CT differential temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="chiller_water_inlet_pressure",
            field=models.FloatField(
                blank=True,
                help_text="Chiller water inlet pressure (bar)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
    ]

