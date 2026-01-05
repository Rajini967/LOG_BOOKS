"""
Serializers for User model.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, UserRole


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that uses email instead of username."""
    
    username_field = 'email'
    
    def validate(self, attrs):
        """Validate and return user with email authentication."""
        # Change 'username' to 'email' in attrs
        if 'username' in attrs:
            attrs['email'] = attrs.pop('username')
        
        data = super().validate(attrs)
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (read operations)."""
    
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'name',
            'role',
            'role_display',
            'is_active',
            'is_staff',
            'is_superuser',
            'is_deleted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'is_deleted',
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users."""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'name',
            'password',
            'password_confirm',
            'role',
            'is_active',
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness."""
        # Check both active and soft-deleted users since email has unique constraint
        if User.all_objects.filter(email=value).exists():
            existing_user = User.all_objects.get(email=value)
            if existing_user.is_deleted:
                raise serializers.ValidationError(
                    f"A user with this email already exists but is soft-deleted. "
                    f"Please restore the existing user (ID: {existing_user.id}) or use a different email."
                )
            else:
                raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_role(self, value):
        """Validate role assignment."""
        request = self.context.get('request')
        if request and request.user:
            # Prevent privilege escalation
            if value == UserRole.SUPER_ADMIN and request.user.role != UserRole.SUPER_ADMIN:
                raise serializers.ValidationError(
                    "Only Super Admin can create Super Admin users."
                )
            if value == UserRole.MANAGER and request.user.role == UserRole.MANAGER:
                raise serializers.ValidationError(
                    "Managers cannot create other Manager users."
                )
        return value
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        email = validated_data.pop('email')
        user = User.objects.create_user(email=email, password=password, **validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users."""
    
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
        style={'input_type': 'password'},
        allow_null=True
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'name',
            'password',
            'role',
            'is_active',
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness (excluding current user)."""
        user = self.instance
        # Only validate uniqueness if email is being changed
        if user and user.email != value:
            if User.objects.filter(email=value, is_deleted=False).exclude(id=user.id).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_role(self, value):
        """Validate role assignment and prevent privilege escalation."""
        request = self.context.get('request')
        user = self.instance
        
        if request and request.user:
            # Prevent users from elevating their own role
            if user.id == request.user.id:
                raise serializers.ValidationError(
                    "You cannot change your own role."
                )
            
            # Prevent privilege escalation
            if value == UserRole.SUPER_ADMIN and request.user.role != UserRole.SUPER_ADMIN:
                raise serializers.ValidationError(
                    "Only Super Admin can assign Super Admin role."
                )
            
            # Managers cannot assign Manager role
            if value == UserRole.MANAGER and request.user.role == UserRole.MANAGER:
                raise serializers.ValidationError(
                    "Managers cannot assign Manager role to other users."
                )
            
            # Prevent downgrading Super Admin
            if user.role == UserRole.SUPER_ADMIN and value != UserRole.SUPER_ADMIN:
                raise serializers.ValidationError(
                    "Cannot change Super Admin role."
                )
        
        return value
    
    def update(self, instance, validated_data):
        """Update user."""
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Only update fields that have changed
        for attr, value in validated_data.items():
            # Skip email if it hasn't changed to avoid unnecessary database updates
            if attr == 'email' and instance.email == value:
                continue
            setattr(instance, attr, value)
        
        instance.save()
        return instance

