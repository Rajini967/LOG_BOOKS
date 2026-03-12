from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("boiler_logs", "0010_boiler_dashboard_fields_and_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="boilerlog",
            name="activity_type",
            field=models.CharField(
                choices=[("operation", "Operation"), ("maintenance", "Maintenance"), ("shutdown", "Shutdown")],
                default="operation",
                help_text="Activity status for this log entry (drives reading applicability).",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="boilerlog",
            name="activity_from_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="boilerlog",
            name="activity_to_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="boilerlog",
            name="activity_from_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="boilerlog",
            name="activity_to_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="boilerlog",
            name="feed_water_temp",
            field=models.FloatField(
                blank=True,
                help_text="Feed water temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="boilerlog",
            name="oil_temp",
            field=models.FloatField(
                blank=True,
                help_text="Oil temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="boilerlog",
            name="steam_temp",
            field=models.FloatField(
                blank=True,
                help_text="Steam temperature (°C)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="boilerlog",
            name="steam_pressure",
            field=models.FloatField(
                blank=True,
                help_text="Steam pressure (bar)",
                null=True,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
    ]

