from django.db import models
import uuid


class Site(models.Model):
    """Site/Location model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    client_id = models.CharField(max_length=100, db_index=True, default='svu-enterprises')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sites'
        ordering = ['name']
        verbose_name = 'Site'
        verbose_name_plural = 'Sites'

    def __str__(self):
        return f"{self.name} - {self.location}"
