from django.contrib import admin
from .models import HVACValidation


@admin.register(HVACValidation)
class HVACValidationAdmin(admin.ModelAdmin):
    list_display = ['room_name', 'iso_class', 'result', 'operator_name', 'status', 'timestamp']
    list_filter = ['iso_class', 'result', 'status', 'timestamp', 'created_at']
    search_fields = ['room_name', 'operator_name']
    readonly_fields = ['id', 'operator', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Room Information', {
            'fields': ('room_name', 'iso_class', 'room_volume')
        }),
        ('Test Results', {
            'fields': ('grid_readings', 'average_velocity', 'flow_rate_cfm', 'total_cfm', 'ach', 'design_spec', 'result')
        }),
        ('Status & Operator', {
            'fields': ('status', 'operator', 'operator_name', 'approved_by', 'approved_at', 'remarks')
        }),
        ('Timestamps', {
            'fields': ('timestamp', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    date_hierarchy = 'timestamp'
