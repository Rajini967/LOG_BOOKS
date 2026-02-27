from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("chiller_logs", "0002_chillerlog_avg_motor_current_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="chillerlog",
            name="cooling_tower_blowdown_time_min",
            field=models.FloatField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text="Cooling tower blow down time (minutes)",
            ),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="chilled_water_pump_chemical_name",
            field=models.CharField(
                max_length=100,
                blank=True,
                null=True,
                help_text="Chilled water pump chemical name",
            ),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="chilled_water_pump_chemical_qty_kg",
            field=models.FloatField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text="Chilled water pump chemical quantity added per day (kg)",
            ),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="cooling_tower_fan_chemical_name",
            field=models.CharField(
                max_length=100,
                blank=True,
                null=True,
                help_text="Cooling tower fan chemical name",
            ),
        ),
        migrations.AddField(
            model_name="chillerlog",
            name="cooling_tower_fan_chemical_qty_kg",
            field=models.FloatField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text="Cooling tower fan chemical quantity added per day (kg)",
            ),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="cooling_tower_chemical_name",
            field=models.CharField(
                max_length=100,
                blank=True,
                null=True,
                help_text="Cooling tower pump chemical name",
            ),
        ),
        migrations.AlterField(
            model_name="chillerlog",
            name="cooling_tower_chemical_qty_per_day",
            field=models.FloatField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text="Cooling tower pump chemical quantity added per day (kg)",
            ),
        ),
    ]

