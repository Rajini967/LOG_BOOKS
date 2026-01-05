from rest_framework import serializers
from .models import Instrument


class InstrumentSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    
    class Meta:
        model = Instrument
        fields = [
            'id', 'name', 'make', 'model', 'serial_number', 'id_number',
            'calibration_date', 'calibration_due_date', 'certificate_url',
            'site_id', 'is_active', 'status', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

