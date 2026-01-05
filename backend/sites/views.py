from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Site
from .serializers import SiteSerializer
from accounts.permissions import IsManagerOrSuperAdmin


class SiteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing sites."""
    permission_classes = [IsAuthenticated]
    serializer_class = SiteSerializer
    queryset = Site.objects.all()
    
    def get_permissions(self):
        """Only managers and super admins can create/update/delete."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsManagerOrSuperAdmin()]
        return [IsAuthenticated()]
