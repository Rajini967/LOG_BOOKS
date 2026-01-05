from rest_framework import serializers
from .models import ChemicalPreparation


class ChemicalPreparationSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = ChemicalPreparation
        fields = [
            'id', 'equipment_name', 'chemical_name',
            'chemical_percent', 'solution_concentration', 'water_qty', 'chemical_qty',
            'remarks', 'checked_by', 'operator_id', 'operator_name', 'status',
            'approved_by_id', 'approved_at', 'timestamp', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]

