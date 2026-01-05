from rest_framework import serializers
from .models import ChillerLog


class ChillerLogSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = ChillerLog
        fields = [
            'id', 'equipment_id', 'site_id',
            'chiller_supply_temp', 'chiller_return_temp',
            'cooling_tower_supply_temp', 'cooling_tower_return_temp',
            'ct_differential_temp', 'chiller_water_inlet_pressure',
            'chiller_makeup_water_flow',
            'remarks', 'operator_id', 'operator_name', 'status',
            'approved_by_id', 'approved_at', 'timestamp',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]

