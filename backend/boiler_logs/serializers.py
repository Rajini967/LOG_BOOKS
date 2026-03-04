from rest_framework import serializers
from .models import BoilerLog


class BoilerLogSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    secondary_approved_by_id = serializers.UUIDField(source='secondary_approved_by.id', read_only=True, allow_null=True)
    corrects_id = serializers.UUIDField(source='corrects.id', read_only=True, allow_null=True)
    has_corrections = serializers.SerializerMethodField()

    class Meta:
        model = BoilerLog
        fields = [
            'id', 'equipment_id', 'site_id',
            'feed_water_temp', 'oil_temp', 'steam_temp',
            'steam_pressure', 'steam_flow_lph',
            'fo_hsd_ng_day_tank_level', 'feed_water_tank_level',
            'fo_pre_heater_temp', 'burner_oil_pressure', 'burner_heater_temp',
            'boiler_steam_pressure', 'stack_temperature', 'steam_pressure_after_prv',
            'feed_water_hardness_ppm', 'feed_water_tds_ppm', 'fo_hsd_ng_consumption',
            'mobrey_functioning', 'manual_blowdown_time',
            'remarks', 'comment', 'operator_id', 'operator_name', 'status',
            'approved_by_id', 'approved_at', 'secondary_approved_by_id', 'secondary_approved_at',
            'corrects_id', 'has_corrections', 'timestamp',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'secondary_approved_by_id', 'secondary_approved_at',
            'corrects_id', 'has_corrections',
            'created_at', 'updated_at'
        ]

    def update(self, instance, validated_data):
        timestamp = validated_data.pop('timestamp', None)
        if timestamp is not None and instance.status not in ('rejected', 'pending_secondary_approval'):
            validated_data['timestamp'] = instance.timestamp
        elif timestamp is not None:
            validated_data['timestamp'] = timestamp
        return super().update(instance, validated_data)

    def get_has_corrections(self, obj: BoilerLog) -> bool:
        return obj.corrections.exists()

