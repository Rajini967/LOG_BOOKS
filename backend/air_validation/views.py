from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import HVACValidation
from .serializers import HVACValidationSerializer
from accounts.permissions import CanLogEntries, CanApproveReports


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
        """Set operator when creating a validation."""
        serializer.save(
            operator=self.request.user,
            operator_name=self.request.user.name or self.request.user.email
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve or reject an HVAC validation."""
        validation = self.get_object()
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
        
        serializer = self.get_serializer(validation)
        return Response(serializer.data)
