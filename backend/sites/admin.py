from django.contrib import admin
from .models import Site


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'client_id', 'is_active', 'created_at']
    list_filter = ['is_active', 'client_id', 'created_at']
    search_fields = ['name', 'location', 'client_id']
    readonly_fields = ['id', 'created_at', 'updated_at']
