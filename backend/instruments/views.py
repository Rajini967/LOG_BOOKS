from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Instrument
from .serializers import InstrumentSerializer
from accounts.permissions import IsManagerOrSuperAdmin


class InstrumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing instruments."""
    permission_classes = [IsAuthenticated]
    serializer_class = InstrumentSerializer
    queryset = Instrument.objects.filter(is_active=True)
    
    def get_permissions(self):
        """Only managers and super admins can create/update/delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsManagerOrSuperAdmin()]
        return [IsAuthenticated()]
