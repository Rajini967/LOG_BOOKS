from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Site
from .serializers import SiteSerializer
from accounts.permissions import IsManagerOrSuperAdmin
from reports.audit_helpers import log_object_create, log_object_delete, log_object_update


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

    def perform_create(self, serializer):
        site = serializer.save()
        log_object_create(
            user=self.request.user,
            object_type="site",
            object_id=str(site.id),
            extra={"name": site.name},
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old_name = instance.name
        site = serializer.save()
        if old_name != site.name:
            log_object_update(
                user=self.request.user,
                object_type="site",
                object_id=str(site.id),
                changes={"name": (old_name, site.name)},
                event_type="equipment_update",
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        site_id = str(instance.id)
        name = instance.name
        response = super().destroy(request, *args, **kwargs)
        log_object_delete(
            user=request.user,
            object_type="site",
            object_id=site_id,
            extra={"name": name},
        )
        return response
