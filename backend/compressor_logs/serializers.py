from rest_framework import serializers
from .models import CompressorLog


class CompressorLogSerializer(serializers.ModelSerializer):
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = CompressorLog
        fields = [
            'id', 'equipment_id', 'site_id',
            'activity_type', 'activity_from_date', 'activity_to_date', 'activity_from_time', 'activity_to_time',
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

    def validate(self, attrs):
        remarks = (attrs.get("remarks") if "remarks" in attrs else getattr(self.instance, "remarks", None)) or ""
        if not str(remarks).strip():
            raise serializers.ValidationError({"remarks": ["Remarks are required."]})

        activity_type = attrs.get("activity_type") if "activity_type" in attrs else getattr(self.instance, "activity_type", "operation")
        if (activity_type or "operation") == "operation":
            required = ["compressor_supply_temp", "compressor_return_temp", "compressor_pressure"]
            missing = [f for f in required if attrs.get(f, getattr(self.instance, f, None)) in (None, "")]
            if missing:
                raise serializers.ValidationError({f: ["This field is required when activity_type is operation."] for f in missing})
        return super().validate(attrs)

