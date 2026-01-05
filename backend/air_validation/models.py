from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class HVACValidation(models.Model):
    """HVAC Validation model for storing validation test results."""
    
    RESULT_CHOICES = [
        ('pass', 'Pass'),
        ('fail', 'Fail'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    ISO_CLASS_CHOICES = [
        (5, 'ISO 5'),
        (6, 'ISO 6'),
        (7, 'ISO 7'),
        (8, 'ISO 8'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_name = models.CharField(max_length=255)
    iso_class = models.IntegerField(choices=ISO_CLASS_CHOICES)
    room_volume = models.FloatField(validators=[MinValueValidator(0)])
    grid_readings = models.JSONField(default=list)
    average_velocity = models.FloatField(validators=[MinValueValidator(0)])
    flow_rate_cfm = models.FloatField(validators=[MinValueValidator(0)])
    total_cfm = models.FloatField(validators=[MinValueValidator(0)])
    ach = models.FloatField(validators=[MinValueValidator(0)])
    design_spec = models.FloatField(validators=[MinValueValidator(0)])
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    operator_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_hvac_validations'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='hvac_validations'
    )
    
    class Meta:
        db_table = 'hvac_validations'
        verbose_name = 'HVAC Validation'
        verbose_name_plural = 'HVAC Validations'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.room_name} - {self.get_iso_class_display()} - {self.result}"
