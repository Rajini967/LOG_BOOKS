from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid


class Instrument(models.Model):
    """Instrument/Equipment model for calibration tracking."""
    
    STATUS_CHOICES = [
        ('valid', 'Valid'),
        ('expiring', 'Expiring Soon'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    make = models.CharField(max_length=255)
    model = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=255, unique=True, db_index=True)
    id_number = models.CharField(max_length=255, blank=True, null=True)
    calibration_date = models.DateField()
    calibration_due_date = models.DateField()
    certificate_url = models.URLField(blank=True, null=True)
    site_id = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'instruments'
        ordering = ['-calibration_due_date']
        verbose_name = 'Instrument'
        verbose_name_plural = 'Instruments'

    def __str__(self):
        return f"{self.name} - {self.serial_number}"

    @property
    def status(self):
        """Calculate status based on calibration due date."""
        today = timezone.now().date()
        days_until_due = (self.calibration_due_date - today).days
        
        if days_until_due < 0:
            return 'expired'
        elif days_until_due < 30:
            return 'expiring'
        else:
            return 'valid'
