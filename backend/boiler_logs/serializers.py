from rest_framework import serializers
from .models import BoilerLog


class BoilerLogSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = BoilerLog
        fields = [
            'id', 'equipment_id', 'site_id',
            'feed_water_temp', 'oil_temp', 'steam_temp',
            'steam_pressure', 'steam_flow_lph',
            'remarks', 'operator_id', 'operator_name', 'status',
            'approved_by_id', 'approved_at', 'timestamp',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]

