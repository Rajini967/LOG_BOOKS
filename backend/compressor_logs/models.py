from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class CompressorLog(models.Model):
    """Compressor monitoring log model."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_id = models.CharField(max_length=100, db_index=True)
    site_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Compressor specific readings
    compressor_supply_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Compressor supply temperature (°C)")
    compressor_return_temp = models.FloatField(validators=[MinValueValidator(0)], help_text="Compressor return temperature (°C)")
    compressor_pressure = models.FloatField(validators=[MinValueValidator(0)], help_text="Compressor pressure (bar)")
    compressor_flow = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True, help_text="Compressor flow (L/min)")
    
    remarks = models.TextField(blank=True, null=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='compressor_logs'
    )
    operator_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_compressor_logs'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'compressor_logs'
        ordering = ['-timestamp']
        verbose_name = 'Compressor Log'
        verbose_name_plural = 'Compressor Logs'

    def __str__(self):
        return f"Compressor {self.equipment_id} - {self.timestamp}"
