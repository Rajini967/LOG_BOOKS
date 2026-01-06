from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True, allow_null=True)
    approved_by_email = serializers.CharField(source='approved_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = Report
        fields = [
            'id',
            'report_type',
            'source_id',
            'source_table',
            'title',
            'site',
            'created_by',
            'created_at',
            'approved_by',
            'approved_by_name',
            'approved_by_email',
            'approved_at',
            'remarks',
            'timestamp',
            'updated_at',
        ]
        read_only_fields = ['id', 'approved_at', 'timestamp', 'updated_at']

