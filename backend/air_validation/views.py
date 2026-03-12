from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import HVACValidation
from .serializers import HVACValidationSerializer
from accounts.permissions import CanLogEntries, CanApproveReports
from reports.audit_helpers import log_object_create, log_object_delete, log_status_change


class HVACValidationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing HVAC validations."""
    permission_classes = [IsAuthenticated]
    serializer_class = HVACValidationSerializer
    queryset = HVACValidation.objects.all()
    
    def get_permissions(self):
        """Different permissions for different actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated(), CanLogEntries()]
        elif self.action == 'approve':
            return [IsAuthenticated(), CanApproveReports()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Set operator when creating a validation and record creation in audit trail."""
        validation = serializer.save(
            operator=self.request.user,
            operator_name=self.request.user.name or self.request.user.email
        )

        log_object_create(
            user=self.request.user,
            object_type="hvac_validation",
            object_id=str(validation.id),
            extra={
                "room_name": validation.room_name,
                "status": validation.status,
                "timestamp": validation.timestamp.isoformat() if getattr(validation, "timestamp", None) else None,
            },
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve or reject an HVAC validation."""
        validation = self.get_object()
        old_status = validation.status
        action_type = request.data.get('action', 'approve')  # 'approve' or 'reject'
        remarks = request.data.get('remarks', '')
        
        if action_type == 'approve':
            validation.status = 'approved'
        elif action_type == 'reject':
            validation.status = 'rejected'
        else:
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validation.approved_by = request.user
        from django.utils import timezone
        validation.approved_at = timezone.now()
        if remarks:
            validation.remarks = remarks
        validation.save()

        # Audit status transition
        event_type = "log_update"
        if action_type == "approve" and validation.status == "approved":
            event_type = "log_approved"
        elif action_type == "reject":
            event_type = "log_rejected"
        log_status_change(
            user=request.user,
            object_type="hvac_validation",
            object_id=str(validation.id),
            from_status=old_status,
            to_status=validation.status,
            event_type=event_type,
            extra={
                "remarks": remarks,
                "action": action_type,
                "room_name": validation.room_name,
            },
        )
        
        # Create report entry when approved
        if action_type == 'approve':
            from reports.utils import create_report_entry
            title = f"HVAC Validation - {validation.room_name or 'N/A'}"
            create_report_entry(
                report_type='validation',
                source_id=str(validation.id),
                source_table='hvac_validations',
                title=title,
                site=validation.room_name or 'N/A',
                created_by=validation.operator_name or 'Unknown',
                created_at=validation.created_at,
                approved_by=request.user,
                remarks=remarks
            )
        
        serializer = self.get_serializer(validation)
        return Response(serializer.data)


    def destroy(self, request, *args, **kwargs):
        """
        Delete an HVAC validation entry while recording the deletion in the audit trail.
        """
        instance = self.get_object()
        validation_id = str(instance.id)
        room_name = instance.room_name

        response = super().destroy(request, *args, **kwargs)

        log_object_delete(
            user=request.user,
            object_type="hvac_validation",
            object_id=validation_id,
            extra={
                "room_name": room_name,
            },
        )

        return response
