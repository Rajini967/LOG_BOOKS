from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("compressor_logs", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="compressorlog",
            name="activity_type",
            field=models.CharField(
                choices=[("operation", "Operation"), ("maintenance", "Maintenance"), ("shutdown", "Shutdown")],
                default="operation",
                help_text="Activity status for this log entry (drives reading applicability).",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="compressorlog",
            name="activity_from_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="compressorlog",
            name="activity_to_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="compressorlog",
            name="activity_from_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="compressorlog",
            name="activity_to_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="compressorlog",
            name="compressor_supply_temp",
            field=models.FloatField(
                blank=True,
                help_text="Compressor supply temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="compressorlog",
            name="compressor_return_temp",
            field=models.FloatField(
                blank=True,
                help_text="Compressor return temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="compressorlog",
            name="compressor_pressure",
            field=models.FloatField(
                blank=True,
                help_text="Compressor pressure (bar)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
    ]

