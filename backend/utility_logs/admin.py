from django.contrib import admin
from .models import UtilityLog


@admin.register(UtilityLog)
class UtilityLogAdmin(admin.ModelAdmin):
    list_display = ['equipment_type', 'equipment_id', 'operator_name', 'status', 'timestamp']
    list_filter = ['equipment_type', 'status', 'timestamp', 'created_at']
    search_fields = ['equipment_id', 'operator_name', 'site_id']
    readonly_fields = ['id', 'operator', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
