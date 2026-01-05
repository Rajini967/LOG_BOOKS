from rest_framework import serializers
from .models import CompressorLog


class CompressorLogSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = CompressorLog
        fields = [
            'id', 'equipment_id', 'site_id',
            'compressor_supply_temp', 'compressor_return_temp',
            'compressor_pressure', 'compressor_flow',
            'remarks', 'operator_id', 'operator_name', 'status',
            'approved_by_id', 'approved_at', 'timestamp',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]

