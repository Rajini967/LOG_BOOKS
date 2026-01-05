"""
Views for authentication and user management.
"""
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import IntegrityError

from .models import User, UserRole
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import (
    CanCreateUsers,
    CanManageUsers,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login view.
    Returns access and refresh tokens.
    Uses email instead of username.
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {'error': 'Invalid credentials. Please check your email and password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user = serializer.user
        if not user.is_active or user.is_deleted:
            return Response(
                {'error': 'User account is inactive or deleted.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """Custom JWT refresh view."""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return Response(
                {'error': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    JWT logout view with token blacklisting.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Blacklist the refresh token."""
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Successfully logged out.'},
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {'error': 'Invalid refresh token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations.
    """
    queryset = User.objects.filter(is_deleted=False)
    permission_classes = [IsAuthenticated, CanManageUsers]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Override permissions for create action."""
        if self.action == 'create':
            return [IsAuthenticated(), CanCreateUsers()]
        return super().get_permissions()
    
    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        
        # Super Admin can see all users
        if user.role == UserRole.SUPER_ADMIN:
            return User.objects.filter(is_deleted=False)
        
        # Manager can see Supervisor, Operator, Client (not Super Admin or Manager)
        if user.role == UserRole.MANAGER:
            return User.objects.filter(
                is_deleted=False,
                role__in=[UserRole.SUPERVISOR, UserRole.OPERATOR, UserRole.CLIENT]
            )
        
        # Others cannot list users
        return User.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Create a new user."""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        try:
            user = serializer.save()
        except IntegrityError as e:
            # Handle database-level unique constraint violations
            error_message = str(e)
            if 'email' in error_message.lower() or 'users_email_key' in error_message:
                # Check if it's a soft-deleted user
                email = request.data.get('email')
                if email:
                    try:
                        existing_user = User.all_objects.get(email=email)
                        if existing_user.is_deleted:
                            error_msg = (
                                f"A user with this email already exists but is soft-deleted. "
                                f"Please restore the existing user or use a different email."
                            )
                        else:
                            error_msg = "A user with this email already exists."
                    except User.DoesNotExist:
                        error_msg = "A user with this email already exists."
                else:
                    error_msg = "A user with this email already exists."
                
                return Response(
                    {
                        'email': [error_msg]
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Re-raise if it's not an email-related error
            raise
        
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Update a user."""
        instance = self.get_object()
        
        # Check object-level permissions
        if not request.user.role == UserRole.SUPER_ADMIN:
            if instance.role == UserRole.SUPER_ADMIN:
                return Response(
                    {'error': 'Cannot modify Super Admin user.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if instance.role == UserRole.MANAGER and request.user.role == UserRole.MANAGER:
                return Response(
                    {'error': 'Managers cannot modify other Manager users.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.context['request'] = request
        serializer.save()
        
        return Response(UserSerializer(instance).data)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete a user."""
        instance = self.get_object()
        
        # Prevent self-deletion
        if instance.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prevent deleting Super Admin
        if instance.role == UserRole.SUPER_ADMIN:
            return Response(
                {'error': 'Cannot delete Super Admin user.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check permissions
        if not request.user.role == UserRole.SUPER_ADMIN:
            if instance.role == UserRole.MANAGER:
                return Response(
                    {'error': 'Managers cannot delete other Manager users.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Soft delete
        instance.soft_delete()
        
        return Response(
            {'message': 'User deleted successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user information."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

