from django.contrib import admin
from .models import CompressorLog


@admin.register(CompressorLog)
class CompressorLogAdmin(admin.ModelAdmin):
    list_display = ['equipment_id', 'compressor_supply_temp', 'compressor_return_temp', 'compressor_pressure', 'operator_name', 'status', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['equipment_id', 'operator_name', 'site_id']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
