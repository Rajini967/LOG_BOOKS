from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CompressorLog
from .serializers import CompressorLogSerializer
from accounts.permissions import CanLogEntries, CanApproveReports
from reports.audit_helpers import log_object_create, log_object_delete, log_status_change


class CompressorLogViewSet(viewsets.ModelViewSet):
    """ViewSet for managing compressor logs."""
    permission_classes = [IsAuthenticated]
    serializer_class = CompressorLogSerializer
    queryset = CompressorLog.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action != 'list':
            return qs
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        equipment_id = self.request.query_params.get('equipment_id')
        if equipment_id:
            qs = qs.filter(equipment_id=equipment_id)
        if date_from:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, timezone.get_current_timezone())
                qs = qs.filter(timestamp__gte=dt)
            except (ValueError, TypeError):
                pass
        if date_to:
            try:
                from datetime import datetime
                dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                if timezone.is_naive(dt):
                    dt = timezone.make_aware(dt, timezone.get_current_timezone())
                qs = qs.filter(timestamp__lte=dt)
            except (ValueError, TypeError):
                pass
        return qs.order_by('-timestamp')

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
            object_type="compressor_log",
            object_id=str(log.id),
            extra={
                "equipment_id": log.equipment_id,
                "status": log.status,
                "timestamp": timezone.localtime(log.timestamp).isoformat() if log.timestamp else None,
            },
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve or reject a compressor log."""
        log = self.get_object()
        old_status = log.status
        action_type = request.data.get('action', 'approve')
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
            object_type="compressor_log",
            object_id=str(log.id),
            from_status=old_status,
            to_status=log.status,
            event_type=event_type,
            extra={
                "remarks": remarks,
                "action": action_type,
                "equipment_id": log.equipment_id,
            },
        )
        
        # Create report entry when approved
        if action_type == 'approve':
            from reports.utils import create_report_entry
            title = f"Air Compressor Monitoring - {log.equipment_id or 'N/A'}"
            create_report_entry(
                report_type='utility',
                source_id=str(log.id),
                source_table='compressor_logs',
                title=title,
                site=log.equipment_id or 'N/A',
                created_by=log.operator_name or 'Unknown',
                created_at=log.created_at,
                approved_by=request.user,
                remarks=remarks
            )
        
        serializer = self.get_serializer(log)
        return Response(serializer.data)


    def destroy(self, request, *args, **kwargs):
        """
        Delete a compressor log entry while recording the deletion in the audit trail.
        """
        instance = self.get_object()
        log_id = str(instance.id)
        equipment_id = instance.equipment_id

        response = super().destroy(request, *args, **kwargs)

        log_object_delete(
            user=request.user,
            object_type="compressor_log",
            object_id=log_id,
            extra={
                "equipment_id": equipment_id,
            },
        )

        return response
