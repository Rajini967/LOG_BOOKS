from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UtilityLog
from .serializers import UtilityLogSerializer
from accounts.permissions import CanLogEntries, CanApproveReports
from reports.audit_helpers import log_object_create, log_object_delete, log_status_change


class UtilityLogViewSet(viewsets.ModelViewSet):
    """ViewSet for managing utility logs."""
    permission_classes = [IsAuthenticated]
    serializer_class = UtilityLogSerializer
    queryset = UtilityLog.objects.all()
    
    def get_permissions(self):
        """Different permissions for different actions."""
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated(), CanLogEntries()]
        elif self.action == 'approve':
            return [IsAuthenticated(), CanApproveReports()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Set operator when creating a log and record creation in audit trail."""
        log = serializer.save(
            operator=self.request.user,
            operator_name=self.request.user.name or self.request.user.email
        )

        log_object_create(
            user=self.request.user,
            object_type="utility_log",
            object_id=str(log.id),
            extra={
                "status": log.status,
                "timestamp": log.timestamp.isoformat() if getattr(log, "timestamp", None) else None,
            },
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve or reject a utility log."""
        log = self.get_object()
        old_status = log.status
        action_type = request.data.get('action', 'approve')  # 'approve' or 'reject'
        remarks = request.data.get('remarks', '')
        
        if action_type == 'approve':
            log.status = 'approved'
        elif action_type == 'reject':
            log.status = 'rejected'
        else:
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        log.approved_by = request.user
        from django.utils import timezone
        log.approved_at = timezone.now()
        if remarks:
            log.remarks = remarks
        log.save()

        # Audit status transition
        event_type = "log_update"
        if action_type == "approve" and log.status == "approved":
            event_type = "log_approved"
        elif action_type == "reject":
            event_type = "log_rejected"
        log_status_change(
            user=request.user,
            object_type="utility_log",
            object_id=str(log.id),
            from_status=old_status,
            to_status=log.status,
            event_type=event_type,
            extra={
                "remarks": remarks,
                "action": action_type,
            },
        )
        
        serializer = self.get_serializer(log)
        return Response(serializer.data)


    def destroy(self, request, *args, **kwargs):
        """
        Delete a utility log entry while recording the deletion in the audit trail.
        """
        instance = self.get_object()
        log_id = str(instance.id)

        response = super().destroy(request, *args, **kwargs)

        log_object_delete(
            user=request.user,
            object_type="utility_log",
            object_id=log_id,
            extra={},
        )

        return response
