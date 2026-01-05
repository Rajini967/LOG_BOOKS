from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class ChillerLog(models.Model):
    """Chiller monitoring log model."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_id = models.CharField(max_length=100, db_index=True)
    site_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Chiller specific readings
    chiller_supply_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Chiller supply temperature (°C)")
    chiller_return_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Chiller return temperature (°C)")
    cooling_tower_supply_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Cooling tower supply temperature (°C)")
    cooling_tower_return_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Cooling tower return temperature (°C)")
    ct_differential_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="CT differential temperature (°C)")
    chiller_water_inlet_pressure = models.FloatField(validators=[MinValueValidator(0)], help_text="Chiller water inlet pressure (bar)")
    chiller_makeup_water_flow = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True, help_text="Chiller makeup water flow (LPH)")
    
    remarks = models.TextField(blank=True, null=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='chiller_logs'
    )
    operator_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_chiller_logs'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chiller_logs'
        ordering = ['-timestamp']
        verbose_name = 'Chiller Log'
        verbose_name_plural = 'Chiller Logs'

    def __str__(self):
        return f"Chiller {self.equipment_id} - {self.timestamp}"
