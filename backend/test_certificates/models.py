"""
Test Certificate Models with Separate Tables for Each Test Type and Subcomponents
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


# ============================================================================
# AIR VELOCITY TEST
# ============================================================================

class AirVelocityTest(models.Model):
    """Air Velocity Test Certificate - Main table."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_no = models.CharField(max_length=100, unique=True, db_index=True)
    client_name = models.CharField(max_length=255)
    client_address = models.TextField()
    date = models.DateField()
    test_reference = models.CharField(max_length=255, blank=True, null=True)
    ahu_number = models.CharField(max_length=100)
    inference = models.TextField(blank=True, null=True)
    
    # Instrument details
    instrument_name = models.CharField(max_length=255)
    instrument_make = models.CharField(max_length=255)
    instrument_model = models.CharField(max_length=255)
    instrument_serial_number = models.CharField(max_length=255)
    instrument_id_number = models.CharField(max_length=255, blank=True, null=True)
    instrument_calibration_date = models.DateField(blank=True, null=True)
    instrument_calibration_due_date = models.DateField(blank=True, null=True)
    instrument_flow_rate = models.CharField(max_length=50, blank=True, null=True)
    instrument_sampling_time = models.CharField(max_length=50, blank=True, null=True)
    
    # Status and approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='air_velocity_tests'
    )
    operator_name = models.CharField(max_length=255)
    prepared_by = models.CharField(max_length=255)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_air_velocity_tests'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'air_velocity_tests'
        ordering = ['-timestamp']
        verbose_name = 'Air Velocity Test'
        verbose_name_plural = 'Air Velocity Tests'
    
    def __str__(self):
        return f"Air Velocity Test - {self.certificate_no}"


class AirVelocityRoom(models.Model):
    """Air Velocity Test - Room subcomponent."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(
        AirVelocityTest,
        on_delete=models.CASCADE,
        related_name='rooms'
    )
    room_name = models.CharField(max_length=255)
    room_number = models.CharField(max_length=100, blank=True, null=True)
    total_air_flow_cfm = models.FloatField(validators=[MinValueValidator(0)])
    room_volume_cft = models.FloatField(validators=[MinValueValidator(0)])
    ach = models.FloatField(validators=[MinValueValidator(0)])
    design_acph = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'air_velocity_rooms'
        ordering = ['room_name']
        verbose_name = 'Air Velocity Room'
        verbose_name_plural = 'Air Velocity Rooms'
    
    def __str__(self):
        return f"{self.room_name} - {self.test.certificate_no}"


class AirVelocityFilter(models.Model):
    """Air Velocity Test - Filter subcomponent."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        AirVelocityRoom,
        on_delete=models.CASCADE,
        related_name='filters'
    )
    filter_id = models.CharField(max_length=255)
    filter_area = models.FloatField(validators=[MinValueValidator(0)])
    reading_1 = models.FloatField(validators=[MinValueValidator(0)])
    reading_2 = models.FloatField(validators=[MinValueValidator(0)])
    reading_3 = models.FloatField(validators=[MinValueValidator(0)])
    reading_4 = models.FloatField(validators=[MinValueValidator(0)])
    reading_5 = models.FloatField(validators=[MinValueValidator(0)])
    avg_velocity = models.FloatField(validators=[MinValueValidator(0)])
    air_flow_cfm = models.FloatField(validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'air_velocity_filters'
        ordering = ['filter_id']
        verbose_name = 'Air Velocity Filter'
        verbose_name_plural = 'Air Velocity Filters'
    
    def __str__(self):
        return f"{self.filter_id} - {self.room.room_name}"


# ============================================================================
# FILTER INTEGRITY TEST
# ============================================================================

class FilterIntegrityTest(models.Model):
    """Filter Integrity Test Certificate - Main table."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_no = models.CharField(max_length=100, unique=True, db_index=True)
    client_name = models.CharField(max_length=255)
    client_address = models.TextField()
    date = models.DateField()
    test_reference = models.CharField(max_length=255, blank=True, null=True)
    ahu_number = models.CharField(max_length=100)
    inference = models.TextField()
    
    # Instrument details
    instrument_name = models.CharField(max_length=255)
    instrument_make = models.CharField(max_length=255)
    instrument_model = models.CharField(max_length=255)
    instrument_serial_number = models.CharField(max_length=255)
    instrument_id_number = models.CharField(max_length=255, blank=True, null=True)
    instrument_calibration_date = models.DateField(blank=True, null=True)
    instrument_calibration_due_date = models.DateField(blank=True, null=True)
    instrument_flow_rate = models.CharField(max_length=50, blank=True, null=True)
    instrument_sampling_time = models.CharField(max_length=50, blank=True, null=True)
    
    # Status and approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='filter_integrity_tests'
    )
    operator_name = models.CharField(max_length=255)
    prepared_by = models.CharField(max_length=255)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_filter_integrity_tests'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'filter_integrity_tests'
        ordering = ['-timestamp']
        verbose_name = 'Filter Integrity Test'
        verbose_name_plural = 'Filter Integrity Tests'
    
    def __str__(self):
        return f"Filter Integrity Test - {self.certificate_no}"


class FilterIntegrityRoom(models.Model):
    """Filter Integrity Test - Room subcomponent."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(
        FilterIntegrityTest,
        on_delete=models.CASCADE,
        related_name='rooms'
    )
    room_name = models.CharField(max_length=255)
    room_number = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'filter_integrity_rooms'
        ordering = ['room_name']
        verbose_name = 'Filter Integrity Room'
        verbose_name_plural = 'Filter Integrity Rooms'
    
    def __str__(self):
        return f"{self.room_name} - {self.test.certificate_no}"


class FilterIntegrityReading(models.Model):
    """Filter Integrity Test - Filter reading subcomponent."""
    
    TEST_STATUS_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        FilterIntegrityRoom,
        on_delete=models.CASCADE,
        related_name='readings'
    )
    filter_id = models.CharField(max_length=255)
    upstream_concentration = models.FloatField(validators=[MinValueValidator(0)])
    aerosol_concentration = models.FloatField(validators=[MinValueValidator(0)])
    downstream_concentration = models.FloatField(validators=[MinValueValidator(0)])
    downstream_leakage = models.FloatField(validators=[MinValueValidator(0)])
    acceptable_limit = models.FloatField(validators=[MinValueValidator(0)])
    test_status = models.CharField(max_length=10, choices=TEST_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'filter_integrity_readings'
        ordering = ['filter_id']
        verbose_name = 'Filter Integrity Reading'
        verbose_name_plural = 'Filter Integrity Readings'
    
    def __str__(self):
        return f"{self.filter_id} - {self.room.room_name}"


# ============================================================================
# RECOVERY TEST
# ============================================================================

class RecoveryTest(models.Model):
    """Recovery Test Certificate - Main table."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    TEST_STATUS_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_no = models.CharField(max_length=100, unique=True, db_index=True)
    client_name = models.CharField(max_length=255)
    client_address = models.TextField()
    date = models.DateField()
    area_classification = models.CharField(max_length=255)
    ahu_number = models.CharField(max_length=100)
    room_name = models.CharField(max_length=255, blank=True, null=True)
    room_number = models.CharField(max_length=100, blank=True, null=True)
    test_condition = models.CharField(max_length=255, blank=True, null=True)
    recovery_time = models.FloatField(validators=[MinValueValidator(0)], help_text="Recovery time in minutes")
    test_status = models.CharField(max_length=10, choices=TEST_STATUS_CHOICES, blank=True, null=True)
    audit_statement = models.TextField(blank=True, null=True)
    
    # Instrument details
    instrument_name = models.CharField(max_length=255)
    instrument_make = models.CharField(max_length=255)
    instrument_model = models.CharField(max_length=255)
    instrument_serial_number = models.CharField(max_length=255)
    instrument_id_number = models.CharField(max_length=255, blank=True, null=True)
    instrument_calibration_date = models.DateField(blank=True, null=True)
    instrument_calibration_due_date = models.DateField(blank=True, null=True)
    instrument_flow_rate = models.CharField(max_length=50, blank=True, null=True)
    instrument_sampling_time = models.CharField(max_length=50, blank=True, null=True)
    
    # Status and approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='recovery_tests'
    )
    operator_name = models.CharField(max_length=255)
    prepared_by = models.CharField(max_length=255)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_recovery_tests'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recovery_tests'
        ordering = ['-timestamp']
        verbose_name = 'Recovery Test'
        verbose_name_plural = 'Recovery Tests'
    
    def __str__(self):
        return f"Recovery Test - {self.certificate_no}"


class RecoveryDataPoint(models.Model):
    """Recovery Test - Time series data point subcomponent."""
    
    AHU_STATUS_CHOICES = [
        ('ON', 'On'),
        ('OFF', 'Off'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(
        RecoveryTest,
        on_delete=models.CASCADE,
        related_name='data_points'
    )
    time = models.CharField(max_length=50)
    ahu_status = models.CharField(max_length=10, choices=AHU_STATUS_CHOICES)
    particle_count_05 = models.IntegerField(validators=[MinValueValidator(0)], help_text="≥0.5μm")
    particle_count_5 = models.IntegerField(validators=[MinValueValidator(0)], help_text="≥5μm")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recovery_data_points'
        ordering = ['time']
        verbose_name = 'Recovery Data Point'
        verbose_name_plural = 'Recovery Data Points'
    
    def __str__(self):
        return f"{self.time} - {self.test.certificate_no}"


# ============================================================================
# DIFFERENTIAL PRESSURE TEST
# ============================================================================

class DifferentialPressureTest(models.Model):
    """Differential Pressure Test Certificate - Main table."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_no = models.CharField(max_length=100, unique=True, db_index=True)
    client_name = models.CharField(max_length=255)
    client_address = models.TextField()
    date = models.DateField()
    ahu_number = models.CharField(max_length=100)
    
    # Instrument details
    instrument_name = models.CharField(max_length=255)
    instrument_make = models.CharField(max_length=255)
    instrument_model = models.CharField(max_length=255)
    instrument_serial_number = models.CharField(max_length=255)
    instrument_id_number = models.CharField(max_length=255, blank=True, null=True)
    instrument_calibration_date = models.DateField(blank=True, null=True)
    instrument_calibration_due_date = models.DateField(blank=True, null=True)
    instrument_flow_rate = models.CharField(max_length=50, blank=True, null=True)
    instrument_sampling_time = models.CharField(max_length=50, blank=True, null=True)
    
    # Status and approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='differential_pressure_tests'
    )
    operator_name = models.CharField(max_length=255)
    prepared_by = models.CharField(max_length=255)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_differential_pressure_tests'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'differential_pressure_tests'
        ordering = ['-timestamp']
        verbose_name = 'Differential Pressure Test'
        verbose_name_plural = 'Differential Pressure Tests'
    
    def __str__(self):
        return f"Differential Pressure Test - {self.certificate_no}"


class DifferentialPressureReading(models.Model):
    """Differential Pressure Test - Reading subcomponent."""
    
    TEST_STATUS_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(
        DifferentialPressureTest,
        on_delete=models.CASCADE,
        related_name='readings'
    )
    room_positive = models.CharField(max_length=255)
    room_negative = models.CharField(max_length=255)
    dp_reading = models.FloatField(validators=[MinValueValidator(0)], help_text="Differential pressure in Pascals")
    limit = models.FloatField(validators=[MinValueValidator(0)], help_text="Limit in Pascals")
    test_status = models.CharField(max_length=10, choices=TEST_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'differential_pressure_readings'
        ordering = ['room_positive']
        verbose_name = 'Differential Pressure Reading'
        verbose_name_plural = 'Differential Pressure Readings'
    
    def __str__(self):
        return f"{self.room_positive} → {self.room_negative} - {self.test.certificate_no}"


# ============================================================================
# NVPC TEST
# ============================================================================

class NVPCTest(models.Model):
    """Non-Viable Particle Count Test Certificate - Main table."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_no = models.CharField(max_length=100, unique=True, db_index=True)
    client_name = models.CharField(max_length=255)
    client_address = models.TextField()
    date = models.DateField()
    area_classification = models.CharField(max_length=255)
    ahu_number = models.CharField(max_length=100)
    area_name = models.CharField(max_length=255, blank=True, null=True)
    inference = models.TextField(blank=True, null=True)
    
    # Instrument details
    instrument_name = models.CharField(max_length=255)
    instrument_make = models.CharField(max_length=255)
    instrument_model = models.CharField(max_length=255)
    instrument_serial_number = models.CharField(max_length=255)
    instrument_id_number = models.CharField(max_length=255, blank=True, null=True)
    instrument_calibration_date = models.DateField(blank=True, null=True)
    instrument_calibration_due_date = models.DateField(blank=True, null=True)
    instrument_flow_rate = models.CharField(max_length=50, blank=True, null=True)
    instrument_sampling_time = models.CharField(max_length=50, blank=True, null=True)
    
    # Status and approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='nvpc_tests'
    )
    operator_name = models.CharField(max_length=255)
    prepared_by = models.CharField(max_length=255)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_nvpc_tests'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'nvpc_tests'
        ordering = ['-timestamp']
        verbose_name = 'NVPC Test'
        verbose_name_plural = 'NVPC Tests'
    
    def __str__(self):
        return f"NVPC Test - {self.certificate_no}"


class NVPCRoom(models.Model):
    """NVPC Test - Room subcomponent."""
    
    ROOM_STATUS_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(
        NVPCTest,
        on_delete=models.CASCADE,
        related_name='rooms'
    )
    room_name = models.CharField(max_length=255)
    room_number = models.CharField(max_length=100, blank=True, null=True)
    iso_class = models.IntegerField(blank=True, null=True)
    mean_05 = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True, help_text="Mean ≥0.5μm")
    mean_5 = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True, help_text="Mean ≥5μm")
    room_status = models.CharField(max_length=10, choices=ROOM_STATUS_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'nvpc_rooms'
        ordering = ['room_name']
        verbose_name = 'NVPC Room'
        verbose_name_plural = 'NVPC Rooms'
    
    def __str__(self):
        return f"{self.room_name} - {self.test.certificate_no}"


class NVPCSamplingPoint(models.Model):
    """NVPC Test - Sampling point subcomponent."""
    
    TEST_STATUS_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        NVPCRoom,
        on_delete=models.CASCADE,
        related_name='sampling_points'
    )
    point_id = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    readings_05 = models.JSONField(default=list, help_text="Array of readings for ≥0.5μm")
    readings_5 = models.JSONField(default=list, help_text="Array of readings for ≥5μm")
    average_05 = models.FloatField(validators=[MinValueValidator(0)], help_text="Average ≥0.5μm")
    average_5 = models.FloatField(validators=[MinValueValidator(0)], help_text="Average ≥5μm")
    limit_05 = models.FloatField(validators=[MinValueValidator(0)], help_text="Limit ≥0.5μm")
    limit_5 = models.FloatField(validators=[MinValueValidator(0)], help_text="Limit ≥5μm")
    test_status = models.CharField(max_length=10, choices=TEST_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'nvpc_sampling_points'
        ordering = ['point_id']
        verbose_name = 'NVPC Sampling Point'
        verbose_name_plural = 'NVPC Sampling Points'
    
    def __str__(self):
        return f"{self.point_id} - {self.room.room_name}"
