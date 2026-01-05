from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompressorLogViewSet

router = DefaultRouter()
router.register(r'compressor-logs', CompressorLogViewSet, basename='compressor-log')

urlpatterns = [
    path('', include(router.urls)),
]

