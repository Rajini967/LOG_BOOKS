"""
Custom User model for the LogBook system.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    """User role choices."""
    SUPER_ADMIN = 'super_admin', 'Super Admin'
    MANAGER = 'manager', 'Manager'
    SUPERVISOR = 'supervisor', 'Supervisor'
    OPERATOR = 'operator', 'Operator'
    CLIENT = 'client', 'Client'


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def get_queryset(self):
        """Return queryset excluding soft-deleted users by default."""
        return super().get_queryset().filter(is_deleted=False)
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        if extra_fields.get('role') != UserRole.SUPER_ADMIN:
            raise ValueError('Superuser must have role=SUPER_ADMIN.')
        
        return self.create_user(email, password, **extra_fields)
    
    def get_by_natural_key(self, email):
        """Retrieve a user by their natural key (email)."""
        return self.get(email=email)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with UUID, email authentication, and role-based access.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    
    # Role and permissions
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.OPERATOR,
    )
    
    # Status flags
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()  # Default manager (excludes soft-deleted)
    all_objects = models.Manager()  # Manager that includes all users
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def natural_key(self):
        """Return the natural key for the user (email)."""
        return (self.email,)
    
    def soft_delete(self):
        """Soft delete the user."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save()
    
    def restore(self):
        """Restore a soft-deleted user."""
        self.is_deleted = False
        self.deleted_at = None
        self.is_active = True
        self.save()
    
    @property
    def is_super_admin(self):
        """Check if user is Super Admin."""
        return self.role == UserRole.SUPER_ADMIN
    
    @property
    def is_manager(self):
        """Check if user is Manager."""
        return self.role == UserRole.MANAGER
    
    @property
    def is_supervisor(self):
        """Check if user is Supervisor."""
        return self.role == UserRole.SUPERVISOR
    
    @property
    def is_operator(self):
        """Check if user is Operator."""
        return self.role == UserRole.OPERATOR
    
    @property
    def is_client(self):
        """Check if user is Client."""
        return self.role == UserRole.CLIENT

