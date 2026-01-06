from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'report_type', 'site', 'created_by', 'approved_by', 'approved_at', 'timestamp')
    list_filter = ('report_type', 'approved_at', 'timestamp')
    search_fields = ('title', 'site', 'created_by')
    readonly_fields = ('id', 'timestamp', 'updated_at')
    date_hierarchy = 'approved_at'
