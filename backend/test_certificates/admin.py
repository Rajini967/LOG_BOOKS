from django.contrib import admin
from .models import (
    AirVelocityTest, AirVelocityRoom, AirVelocityFilter,
    FilterIntegrityTest, FilterIntegrityRoom, FilterIntegrityReading,
    RecoveryTest, RecoveryDataPoint,
    DifferentialPressureTest, DifferentialPressureReading,
    NVPCTest, NVPCRoom, NVPCSamplingPoint,
)


# ============================================================================
# AIR VELOCITY TEST ADMIN
# ============================================================================

class AirVelocityFilterInline(admin.TabularInline):
    model = AirVelocityFilter
    extra = 0


class AirVelocityRoomInline(admin.TabularInline):
    model = AirVelocityRoom
    extra = 0
    inlines = [AirVelocityFilterInline]


@admin.register(AirVelocityTest)
class AirVelocityTestAdmin(admin.ModelAdmin):
    list_display = ['certificate_no', 'client_name', 'date', 'status', 'operator_name', 'timestamp']
    list_filter = ['status', 'date', 'timestamp']
    search_fields = ['certificate_no', 'client_name', 'operator_name', 'prepared_by']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
    inlines = [AirVelocityRoomInline]


@admin.register(AirVelocityRoom)
class AirVelocityRoomAdmin(admin.ModelAdmin):
    list_display = ['room_name', 'room_number', 'test', 'ach']
    list_filter = ['test']
    search_fields = ['room_name', 'room_number']
    inlines = [AirVelocityFilterInline]


@admin.register(AirVelocityFilter)
class AirVelocityFilterAdmin(admin.ModelAdmin):
    list_display = ['filter_id', 'room', 'avg_velocity', 'air_flow_cfm']
    list_filter = ['room__test']
    search_fields = ['filter_id']


# ============================================================================
# FILTER INTEGRITY TEST ADMIN
# ============================================================================

class FilterIntegrityReadingInline(admin.TabularInline):
    model = FilterIntegrityReading
    extra = 0


class FilterIntegrityRoomInline(admin.TabularInline):
    model = FilterIntegrityRoom
    extra = 0
    inlines = [FilterIntegrityReadingInline]


@admin.register(FilterIntegrityTest)
class FilterIntegrityTestAdmin(admin.ModelAdmin):
    list_display = ['certificate_no', 'client_name', 'date', 'status', 'operator_name', 'timestamp']
    list_filter = ['status', 'date', 'timestamp']
    search_fields = ['certificate_no', 'client_name', 'operator_name', 'prepared_by']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
    inlines = [FilterIntegrityRoomInline]


@admin.register(FilterIntegrityRoom)
class FilterIntegrityRoomAdmin(admin.ModelAdmin):
    list_display = ['room_name', 'room_number', 'test']
    list_filter = ['test']
    search_fields = ['room_name', 'room_number']
    inlines = [FilterIntegrityReadingInline]


@admin.register(FilterIntegrityReading)
class FilterIntegrityReadingAdmin(admin.ModelAdmin):
    list_display = ['filter_id', 'room', 'test_status', 'downstream_leakage']
    list_filter = ['test_status', 'room__test']
    search_fields = ['filter_id']


# ============================================================================
# RECOVERY TEST ADMIN
# ============================================================================

class RecoveryDataPointInline(admin.TabularInline):
    model = RecoveryDataPoint
    extra = 0


@admin.register(RecoveryTest)
class RecoveryTestAdmin(admin.ModelAdmin):
    list_display = ['certificate_no', 'area_classification', 'recovery_time', 'test_status', 'status', 'timestamp']
    list_filter = ['test_status', 'status', 'area_classification', 'timestamp']
    search_fields = ['certificate_no', 'client_name', 'operator_name']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
    inlines = [RecoveryDataPointInline]


@admin.register(RecoveryDataPoint)
class RecoveryDataPointAdmin(admin.ModelAdmin):
    list_display = ['time', 'test', 'ahu_status', 'particle_count_05', 'particle_count_5']
    list_filter = ['ahu_status', 'test']
    search_fields = ['time']


# ============================================================================
# DIFFERENTIAL PRESSURE TEST ADMIN
# ============================================================================

class DifferentialPressureReadingInline(admin.TabularInline):
    model = DifferentialPressureReading
    extra = 0


@admin.register(DifferentialPressureTest)
class DifferentialPressureTestAdmin(admin.ModelAdmin):
    list_display = ['certificate_no', 'client_name', 'date', 'status', 'operator_name', 'timestamp']
    list_filter = ['status', 'date', 'timestamp']
    search_fields = ['certificate_no', 'client_name', 'operator_name']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
    inlines = [DifferentialPressureReadingInline]


@admin.register(DifferentialPressureReading)
class DifferentialPressureReadingAdmin(admin.ModelAdmin):
    list_display = ['room_positive', 'room_negative', 'test', 'dp_reading', 'test_status']
    list_filter = ['test_status', 'test']
    search_fields = ['room_positive', 'room_negative']


# ============================================================================
# NVPC TEST ADMIN
# ============================================================================

class NVPCSamplingPointInline(admin.TabularInline):
    model = NVPCSamplingPoint
    extra = 0


class NVPCRoomInline(admin.TabularInline):
    model = NVPCRoom
    extra = 0
    inlines = [NVPCSamplingPointInline]


@admin.register(NVPCTest)
class NVPCTestAdmin(admin.ModelAdmin):
    list_display = ['certificate_no', 'area_classification', 'area_name', 'status', 'operator_name', 'timestamp']
    list_filter = ['status', 'area_classification', 'timestamp']
    search_fields = ['certificate_no', 'client_name', 'operator_name', 'area_name']
    readonly_fields = ['id', 'operator', 'operator_name', 'approved_by', 'approved_at', 'timestamp', 'created_at', 'updated_at']
    date_hierarchy = 'timestamp'
    inlines = [NVPCRoomInline]


@admin.register(NVPCRoom)
class NVPCRoomAdmin(admin.ModelAdmin):
    list_display = ['room_name', 'room_number', 'test', 'iso_class', 'room_status']
    list_filter = ['room_status', 'iso_class', 'test']
    search_fields = ['room_name', 'room_number']
    inlines = [NVPCSamplingPointInline]


@admin.register(NVPCSamplingPoint)
class NVPCSamplingPointAdmin(admin.ModelAdmin):
    list_display = ['point_id', 'location', 'room', 'average_05', 'average_5', 'test_status']
    list_filter = ['test_status', 'room__test']
    search_fields = ['point_id', 'location']

