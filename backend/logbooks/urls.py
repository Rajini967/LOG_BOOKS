from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogbookSchemaViewSet, LogbookEntryViewSet

router = DefaultRouter()
router.register(r'schemas', LogbookSchemaViewSet, basename='logbook-schema')
router.register(r'entries', LogbookEntryViewSet, basename='logbook-entry')

urlpatterns = [
    path('', include(router.urls)),
]

