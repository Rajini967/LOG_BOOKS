from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class UtilityLog(models.Model):
    """Utility monitoring log model (Chiller, Boiler, Compressor)."""
    
    EQUIPMENT_TYPE_CHOICES = [
        ('chiller', 'Chiller'),
        ('boiler', 'Boiler'),
        ('compressor', 'Compressor'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    equipment_type = models.CharField(max_length=20, choices=EQUIPMENT_TYPE_CHOICES)
    equipment_id = models.CharField(max_length=100, db_index=True)
    site_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Monitoring readings
    t1 = models.FloatField(validators=[MinValueValidator(0)], help_text="Temperature 1")
    t2 = models.FloatField(validators=[MinValueValidator(0)], help_text="Temperature 2")
    p1 = models.FloatField(validators=[MinValueValidator(0)], help_text="Pressure 1")
    p2 = models.FloatField(validators=[MinValueValidator(0)], help_text="Pressure 2")
    flow_rate = models.FloatField(validators=[MinValueValidator(0)], blank=True, null=True)
    
    remarks = models.TextField(blank=True, null=True)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='utility_logs'
    )
    operator_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_utility_logs'
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'utility_logs'
        ordering = ['-timestamp']
        verbose_name = 'Utility Log'
        verbose_name_plural = 'Utility Logs'

    def __str__(self):
        return f"{self.get_equipment_type_display()} - {self.equipment_id} - {self.timestamp}"
