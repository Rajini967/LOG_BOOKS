from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FilterLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('equipment_id', models.CharField(db_index=True, max_length=100)),
                ('category', models.CharField(choices=[('hvac', 'HVAC'), ('water_system', 'Water system'), ('compressed_air', 'Compressed air'), ('nitrogen_air', 'Nitrogen air')], max_length=32)),
                ('filter_no', models.CharField(max_length=100)),
                ('filter_micron', models.CharField(blank=True, max_length=100, null=True)),
                ('filter_size', models.CharField(blank=True, max_length=100, null=True)),
                ('installed_date', models.DateField()),
                ('integrity_done_date', models.DateField(blank=True, null=True)),
                ('integrity_due_date', models.DateField()),
                ('cleaning_done_date', models.DateField(blank=True, null=True)),
                ('cleaning_due_date', models.DateField()),
                ('replacement_due_date', models.DateField()),
                ('remarks', models.TextField(blank=True, null=True)),
                ('operator_name', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('pending_secondary_approval', 'Pending secondary approval')], default='draft', max_length=30)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('secondary_approved_at', models.DateTimeField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('approved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_filter_logs', to=settings.AUTH_USER_MODEL)),
                ('operator', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='filter_logs', to=settings.AUTH_USER_MODEL)),
                ('secondary_approved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='secondary_approved_filter_logs', to=settings.AUTH_USER_MODEL)),
                ('corrects', models.ForeignKey(blank=True, help_text='If this is a correction, points to the original log entry.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='corrections', to='filter_logs.filterlog')),
            ],
            options={
                'verbose_name': 'Filter Log',
                'verbose_name_plural': 'Filter Logs',
                'db_table': 'filter_logs',
                'ordering': ['-timestamp'],
            },
        ),
    ]

