from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChillerLogViewSet

router = DefaultRouter()
router.register(r'chiller-logs', ChillerLogViewSet, basename='chiller-log')

urlpatterns = [
    path('', include(router.urls)),
]

