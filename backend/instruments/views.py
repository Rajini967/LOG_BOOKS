from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Instrument
from .serializers import InstrumentSerializer
from accounts.permissions import IsManagerOrSuperAdmin
from reports.audit_helpers import log_object_create, log_object_delete, log_object_update


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

    def perform_create(self, serializer):
        instrument = serializer.save()
        log_object_create(
            user=self.request.user,
            object_type="instrument",
            object_id=str(instrument.id),
            extra={"name": instrument.name},
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old = {"name": instance.name}
        instrument = serializer.save()
        changes = {}
        if old["name"] != instrument.name:
            changes["name"] = (old["name"], instrument.name)
        if changes:
            log_object_update(
                user=self.request.user,
                object_type="instrument",
                object_id=str(instrument.id),
                changes=changes,
                event_type="equipment_update",
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        inst_id = str(instance.id)
        name = instance.name
        response = super().destroy(request, *args, **kwargs)
        log_object_delete(
            user=request.user,
            object_type="instrument",
            object_id=inst_id,
            extra={"name": name},
        )
        return response
