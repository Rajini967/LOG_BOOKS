from rest_framework import serializers
from .models import ChemicalPreparation


class ChemicalPreparationSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    secondary_approved_by_id = serializers.UUIDField(source='secondary_approved_by.id', read_only=True, allow_null=True)
    corrects_id = serializers.UUIDField(source='corrects.id', read_only=True, allow_null=True)
    has_corrections = serializers.SerializerMethodField()

    class Meta:
        model = ChemicalPreparation
        fields = [
            'id', 'equipment_name', 'chemical_name', 'chemical_category',
            'chemical_percent', 'chemical_concentration', 'solution_concentration', 'water_qty', 'chemical_qty',
            'batch_no', 'done_by',
            'remarks', 'comment', 'checked_by', 'operator_id', 'operator_name', 'status',
            'approved_by_id', 'approved_at', 'secondary_approved_by_id', 'secondary_approved_at',
            'corrects_id', 'has_corrections', 'timestamp', 'created_at', 'updated_at'
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

    def get_has_corrections(self, obj: ChemicalPreparation) -> bool:
        return obj.corrections.exists()

