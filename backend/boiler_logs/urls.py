from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoilerLogViewSet

router = DefaultRouter()
router.register(r'boiler-logs', BoilerLogViewSet, basename='boiler-log')

urlpatterns = [
    path('', include(router.urls)),
]

