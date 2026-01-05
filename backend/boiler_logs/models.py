from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class BoilerLog(models.Model):
    """Boiler monitoring log model."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_id = models.CharField(max_length=100, db_index=True)
    site_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Boiler specific readings
    feed_water_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Feed water temperature (°C)")
    oil_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Oil temperature (°C)")
    steam_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Steam temperature (°C)")
    steam_pressure = models.FloatField(validators=[MinValueValidator(0)], help_text="Steam pressure (bar)")
    steam_flow_lph = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True, help_text="Steam flow (LPH)")
    
    remarks = models.TextField(blank=True, null=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='boiler_logs'
    )
    operator_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_boiler_logs'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'boiler_logs'
        ordering = ['-timestamp']
        verbose_name = 'Boiler Log'
        verbose_name_plural = 'Boiler Logs'

    def __str__(self):
        return f"Boiler {self.equipment_id} - {self.timestamp}"
