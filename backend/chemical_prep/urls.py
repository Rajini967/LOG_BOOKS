from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChemicalPreparationViewSet

router = DefaultRouter()
router.register(r'chemical-preps', ChemicalPreparationViewSet, basename='chemical-prep')

urlpatterns = [
    path('', include(router.urls)),
]

