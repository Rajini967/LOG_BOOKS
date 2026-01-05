"""
Django admin configuration for User model.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserRole


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""
    
    list_display = ['email', 'role', 'is_active', 'is_staff', 'is_deleted', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser', 'is_deleted', 'created_at']
    search_fields = ['email']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Status', {
            'fields': ('is_deleted', 'deleted_at'),
        }),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'is_active', 'is_staff', 'is_superuser'),
        }),
    )
    
    readonly_fields = ['last_login', 'created_at', 'updated_at', 'deleted_at']
    
    def get_queryset(self, request):
        """Show all users including soft-deleted ones in admin."""
        # Use all_objects to include soft-deleted users
        qs = self.model.all_objects.all()
        ordering = self.get_ordering(request)
        if ordering:
            qs = qs.order_by(*ordering)
        return qs

