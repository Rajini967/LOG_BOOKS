from django.contrib import admin
from .models import ChemicalPreparation


@admin.register(ChemicalPreparation)
class ChemicalPreparationAdmin(admin.ModelAdmin):
    list_display = ['operator_name', 'chemical_name', 'equipment_name', 'status', 'timestamp']
    list_filter = ['status', 'timestamp', 'created_at']
    search_fields = ['operator_name', 'chemical_name', 'equipment_name', 'checked_by']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
