from django.contrib import admin
from .models import Instrument


@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'make', 'model', 'serial_number', 'calibration_due_date', 'get_status', 'is_active']
    list_filter = ['is_active', 'calibration_due_date', 'created_at']
    search_fields = ['name', 'make', 'model', 'serial_number', 'id_number']
    readonly_fields = ['id', 'get_status', 'created_at', 'updated_at']
    date_hierarchy = 'calibration_due_date'
    
    def get_status(self, obj):
        """Display the computed status."""
        return obj.status
    get_status.short_description = 'Status'
    get_status.admin_order_field = 'calibration_due_date'  # Allow sorting by due date
