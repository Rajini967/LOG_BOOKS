from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing approved reports.
    Read-only because reports are created automatically when entries are approved.
    """
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Report.objects.all()
        
        # Filter by report type if provided
        report_type = self.request.query_params.get('type', None)
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        
        # Customers only see approved reports (already filtered by default)
        if self.request.user.role == 'customer':
            queryset = queryset.filter(report_type__in=['utility', 'validation', 'air_velocity', 'filter_integrity', 'recovery', 'differential_pressure', 'nvpc'])
        
        return queryset.order_by('-approved_at')
