from rest_framework import serializers
from .models import (
    AirVelocityTest, AirVelocityRoom, AirVelocityFilter,
    FilterIntegrityTest, FilterIntegrityRoom, FilterIntegrityReading,
    RecoveryTest, RecoveryDataPoint,
    DifferentialPressureTest, DifferentialPressureReading,
    NVPCTest, NVPCRoom, NVPCSamplingPoint,
)


# ============================================================================
# AIR VELOCITY TEST SERIALIZERS
# ============================================================================

class AirVelocityFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirVelocityFilter
        fields = [
            'id', 'filter_id', 'filter_area',
            'reading_1', 'reading_2', 'reading_3', 'reading_4', 'reading_5',
            'avg_velocity', 'air_flow_cfm'
        ]
        extra_kwargs = {
            'room': {'write_only': True}
        }


class AirVelocityRoomSerializer(serializers.ModelSerializer):
    filters = AirVelocityFilterSerializer(many=True, read_only=True)
    
    class Meta:
        model = AirVelocityRoom
        fields = [
            'id', 'room_name', 'room_number',
            'total_air_flow_cfm', 'room_volume_cft', 'ach', 'design_acph',
            'filters'
        ]
        extra_kwargs = {
            'test': {'write_only': True}
        }


class AirVelocityTestSerializer(serializers.ModelSerializer):
    rooms = AirVelocityRoomSerializer(many=True, read_only=True)
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = AirVelocityTest
        fields = [
            'id', 'certificate_no', 'client_name', 'client_address',
            'date', 'test_reference', 'ahu_number', 'inference',
            'instrument_name', 'instrument_make', 'instrument_model',
            'instrument_serial_number', 'instrument_id_number',
            'instrument_calibration_date', 'instrument_calibration_due_date',
            'instrument_flow_rate', 'instrument_sampling_time',
            'status', 'operator_id', 'operator_name', 'prepared_by',
            'approved_by_id', 'approved_at', 'remarks',
            'timestamp', 'created_at', 'updated_at',
            'rooms'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]


# ============================================================================
# FILTER INTEGRITY TEST SERIALIZERS
# ============================================================================

class FilterIntegrityReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilterIntegrityReading
        fields = [
            'id', 'filter_id', 'upstream_concentration',
            'aerosol_concentration', 'downstream_concentration',
            'downstream_leakage', 'acceptable_limit', 'test_status'
        ]


class FilterIntegrityRoomSerializer(serializers.ModelSerializer):
    readings = FilterIntegrityReadingSerializer(many=True, read_only=True)
    
    class Meta:
        model = FilterIntegrityRoom
        fields = ['id', 'room_name', 'room_number', 'readings']


class FilterIntegrityTestSerializer(serializers.ModelSerializer):
    rooms = FilterIntegrityRoomSerializer(many=True, read_only=True)
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = FilterIntegrityTest
        fields = [
            'id', 'certificate_no', 'client_name', 'client_address',
            'date', 'test_reference', 'ahu_number', 'inference',
            'instrument_name', 'instrument_make', 'instrument_model',
            'instrument_serial_number', 'instrument_id_number',
            'instrument_calibration_date', 'instrument_calibration_due_date',
            'instrument_flow_rate', 'instrument_sampling_time',
            'status', 'operator_id', 'operator_name', 'prepared_by',
            'approved_by_id', 'approved_at', 'remarks',
            'timestamp', 'created_at', 'updated_at',
            'rooms'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]


# ============================================================================
# RECOVERY TEST SERIALIZERS
# ============================================================================

class RecoveryDataPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecoveryDataPoint
        fields = [
            'id', 'time', 'ahu_status',
            'particle_count_05', 'particle_count_5'
        ]


class RecoveryTestSerializer(serializers.ModelSerializer):
    data_points = RecoveryDataPointSerializer(many=True, read_only=True)
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = RecoveryTest
        fields = [
            'id', 'certificate_no', 'client_name', 'client_address',
            'date', 'area_classification', 'ahu_number',
            'room_name', 'room_number', 'test_condition',
            'recovery_time', 'test_status', 'audit_statement',
            'instrument_name', 'instrument_make', 'instrument_model',
            'instrument_serial_number', 'instrument_id_number',
            'instrument_calibration_date', 'instrument_calibration_due_date',
            'instrument_flow_rate', 'instrument_sampling_time',
            'status', 'operator_id', 'operator_name', 'prepared_by',
            'approved_by_id', 'approved_at', 'remarks',
            'timestamp', 'created_at', 'updated_at',
            'data_points'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]


# ============================================================================
# DIFFERENTIAL PRESSURE TEST SERIALIZERS
# ============================================================================

class DifferentialPressureReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DifferentialPressureReading
        fields = [
            'id', 'room_positive', 'room_negative',
            'dp_reading', 'limit', 'test_status'
        ]


class DifferentialPressureTestSerializer(serializers.ModelSerializer):
    readings = DifferentialPressureReadingSerializer(many=True, read_only=True)
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = DifferentialPressureTest
        fields = [
            'id', 'certificate_no', 'client_name', 'client_address',
            'date', 'ahu_number',
            'instrument_name', 'instrument_make', 'instrument_model',
            'instrument_serial_number', 'instrument_id_number',
            'instrument_calibration_date', 'instrument_calibration_due_date',
            'instrument_flow_rate', 'instrument_sampling_time',
            'status', 'operator_id', 'operator_name', 'prepared_by',
            'approved_by_id', 'approved_at', 'remarks',
            'timestamp', 'created_at', 'updated_at',
            'readings'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]


# ============================================================================
# NVPC TEST SERIALIZERS
# ============================================================================

class NVPCSamplingPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = NVPCSamplingPoint
        fields = [
            'id', 'point_id', 'location',
            'readings_05', 'readings_5',
            'average_05', 'average_5',
            'limit_05', 'limit_5', 'test_status'
        ]


class NVPCRoomSerializer(serializers.ModelSerializer):
    sampling_points = NVPCSamplingPointSerializer(many=True, read_only=True)
    
    class Meta:
        model = NVPCRoom
        fields = [
            'id', 'room_name', 'room_number', 'iso_class',
            'mean_05', 'mean_5', 'room_status',
            'sampling_points'
        ]


class NVPCTestSerializer(serializers.ModelSerializer):
    rooms = NVPCRoomSerializer(many=True, read_only=True)
    operator_id = serializers.UUIDField(source='operator.id', read_only=True)
    approved_by_id = serializers.UUIDField(source='approved_by.id', read_only=True, allow_null=True)
    
    class Meta:
        model = NVPCTest
        fields = [
            'id', 'certificate_no', 'client_name', 'client_address',
            'date', 'area_classification', 'ahu_number', 'area_name', 'inference',
            'instrument_name', 'instrument_make', 'instrument_model',
            'instrument_serial_number', 'instrument_id_number',
            'instrument_calibration_date', 'instrument_calibration_due_date',
            'instrument_flow_rate', 'instrument_sampling_time',
            'status', 'operator_id', 'operator_name', 'prepared_by',
            'approved_by_id', 'approved_at', 'remarks',
            'timestamp', 'created_at', 'updated_at',
            'rooms'
        ]
        read_only_fields = [
            'id', 'operator_id', 'operator_name', 'approved_by_id', 'approved_at',
            'timestamp', 'created_at', 'updated_at'
        ]

