from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilityLogViewSet

router = DefaultRouter()
router.register(r'utility-logs', UtilityLogViewSet, basename='utility-log')

urlpatterns = [
    path('', include(router.urls)),
]

