from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AirVelocityTestViewSet,
    FilterIntegrityTestViewSet,
    RecoveryTestViewSet,
    DifferentialPressureTestViewSet,
    NVPCTestViewSet,
)

router = DefaultRouter()
router.register(r'air-velocity-tests', AirVelocityTestViewSet, basename='air-velocity-test')
router.register(r'filter-integrity-tests', FilterIntegrityTestViewSet, basename='filter-integrity-test')
router.register(r'recovery-tests', RecoveryTestViewSet, basename='recovery-test')
router.register(r'differential-pressure-tests', DifferentialPressureTestViewSet, basename='differential-pressure-test')
router.register(r'nvpc-tests', NVPCTestViewSet, basename='nvpc-test')

urlpatterns = [
    path('', include(router.urls)),
]

