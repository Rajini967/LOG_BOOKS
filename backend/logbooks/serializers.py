from rest_framework import serializers
from .models import LogbookSchema, LogbookRoleAssignment, LogbookEntry
from accounts.models import UserRole


class LogbookRoleAssignmentSerializer(serializers.ModelSerializer):
    assigned_by_name = serializers.CharField(source='assigned_by.name', read_only=True)
    
    class Meta:
        model = LogbookRoleAssignment
        fields = ['id', 'role', 'assigned_at', 'assigned_by', 'assigned_by_name']
        read_only_fields = ['id', 'assigned_at', 'assigned_by']


class LogbookSchemaSerializer(serializers.ModelSerializer):
    assigned_roles = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = LogbookSchema
        fields = [
            'id', 'name', 'description', 'client_id', 'category',
            'fields', 'workflow', 'display', 'metadata',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'assigned_roles'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_assigned_roles(self, obj):
        """Get list of roles assigned to this logbook."""
        assignments = LogbookRoleAssignment.objects.filter(schema=obj)
        return [assignment.role for assignment in assignments]


class LogbookSchemaCreateSerializer(serializers.ModelSerializer):
    assigned_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=UserRole.choices),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = LogbookSchema
        fields = [
            'name', 'description', 'client_id', 'category',
            'fields', 'workflow', 'display', 'metadata',
            'assigned_roles'
        ]
    
    def create(self, validated_data):
        assigned_roles = validated_data.pop('assigned_roles', [])
        request = self.context.get('request')
        
        # created_by is set in perform_create, so don't set it here
        schema = LogbookSchema.objects.create(**validated_data)
        
        # Create role assignments
        for role in assigned_roles:
            LogbookRoleAssignment.objects.create(
                schema=schema,
                role=role,
                assigned_by=request.user if request else None
            )
        
        return schema


class LogbookSchemaUpdateSerializer(serializers.ModelSerializer):
    assigned_roles = serializers.ListField(
        child=serializers.ChoiceField(choices=UserRole.choices),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = LogbookSchema
        fields = [
            'name', 'description', 'client_id', 'category',
            'fields', 'workflow', 'display', 'metadata',
            'assigned_roles'
        ]
    
    def update(self, instance, validated_data):
        assigned_roles = validated_data.pop('assigned_roles', None)
        request = self.context.get('request')
        
        # Update schema fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update role assignments if provided
        if assigned_roles is not None:
            # Clear existing assignments
            LogbookRoleAssignment.objects.filter(schema=instance).delete()
            
            # Create new assignments
            for role in assigned_roles:
                LogbookRoleAssignment.objects.create(
                    schema=instance,
                    role=role,
                    assigned_by=request.user if request else None
                )
        
        return instance


class LogbookEntrySerializer(serializers.ModelSerializer):
    schema_name = serializers.CharField(source='schema.name', read_only=True)
    operator_name = serializers.CharField(read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)
    
    class Meta:
        model = LogbookEntry
        fields = [
            'id', 'schema', 'schema_name', 'client_id', 'site_id',
            'data', 'operator', 'operator_name', 'status',
            'approved_by', 'approved_by_name', 'approved_at',
            'remarks', 'attachments', 'timestamp',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'operator', 'operator_name', 'approved_by', 'approved_by_name',
            'approved_at', 'timestamp', 'created_at', 'updated_at'
        ]

