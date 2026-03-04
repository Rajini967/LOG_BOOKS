from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FilterLogViewSet

router = DefaultRouter()
router.register(r'filter-logs', FilterLogViewSet, basename='filter-log')

urlpatterns = [
    path('', include(router.urls)),
]

