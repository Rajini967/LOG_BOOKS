from rest_framework import serializers
from .models import HVACValidation


class HVACValidationSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = HVACValidation
        fields = [
            'id', 'room_name', 'iso_class', 'room_volume', 'grid_readings',
            'average_velocity', 'flow_rate_cfm', 'total_cfm', 'ach', 'design_spec',
            'result', 'operator_id', 'operator_name', 'status',
            'approved_by_id', 'approved_at', 'remarks', 'timestamp', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]

