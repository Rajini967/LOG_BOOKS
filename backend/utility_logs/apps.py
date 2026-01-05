from django.apps import AppConfig


class ELogBookConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'utility_logs'  # Keep as utility_logs for Django app compatibility
