from django.contrib import admin
from .models import ChillerLog


@admin.register(ChillerLog)
class ChillerLogAdmin(admin.ModelAdmin):
    list_display = ['equipment_id', 'chiller_supply_temp', 'chiller_return_temp', 'operator_name', 'status', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['equipment_id', 'operator_name', 'site_id']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
