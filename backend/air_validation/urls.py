from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HVACValidationViewSet

router = DefaultRouter()
router.register(r'hvac-validations', HVACValidationViewSet, basename='hvac-validation')

urlpatterns = [
    path('', include(router.urls)),
]

