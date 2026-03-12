from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from accounts.permissions import IsManagerOrSuperAdmin
from reports.audit_helpers import log_object_create, log_object_delete, log_object_update, log_status_change

from .models import Department, EquipmentCategory, Equipment
from .serializers import (
    DepartmentSerializer,
    EquipmentCategorySerializer,
    EquipmentSerializer,
)


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD for Department master."""

    permission_classes = [IsAuthenticated]
    serializer_class = DepartmentSerializer
    queryset = Department.objects.all().order_by("name")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsManagerOrSuperAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        dept = serializer.save()
        log_object_create(
            user=self.request.user,
            object_type="department",
            object_id=str(dept.id),
            extra={"name": dept.name},
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old_name = instance.name
        dept = serializer.save()
        if old_name != dept.name:
            log_object_update(
                user=self.request.user,
                object_type="department",
                object_id=str(dept.id),
                changes={"name": (old_name, dept.name)},
                event_type="equipment_update",
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        dept_id = str(instance.id)
        name = instance.name
        response = super().destroy(request, *args, **kwargs)
        log_object_delete(
            user=request.user,
            object_type="department",
            object_id=dept_id,
            extra={"name": name},
        )
        return response


class EquipmentCategoryViewSet(viewsets.ModelViewSet):
    """CRUD for EquipmentCategory master."""

    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentCategorySerializer
    queryset = EquipmentCategory.objects.all().order_by("name")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsManagerOrSuperAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        cat = serializer.save()
        log_object_create(
            user=self.request.user,
            object_type="equipment_category",
            object_id=str(cat.id),
            extra={"name": cat.name},
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old = {"name": instance.name}
        cat = serializer.save()
        changes = {}
        if old["name"] != cat.name:
            changes["name"] = (old["name"], cat.name)
        if changes:
            log_object_update(
                user=self.request.user,
                object_type="equipment_category",
                object_id=str(cat.id),
                changes=changes,
                event_type="equipment_update",
            )

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting categories that are in use by Equipment (PROTECT FK).
        Return a clear 400 error instead of a 500 traceback.
        """
        instance: EquipmentCategory = self.get_object()
        try:
            name = instance.name
            response = super().destroy(request, *args, **kwargs)
            log_object_delete(
                user=request.user,
                object_type="equipment_category",
                object_id=str(instance.id),
                extra={"name": name},
            )
            return response
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "This equipment category cannot be deleted because it is already used by one or more equipment records. "
                        "Deactivate it instead."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class EquipmentViewSet(viewsets.ModelViewSet):
    """CRUD for Equipment master."""

    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentSerializer
    queryset = Equipment.objects.filter(is_active=True).order_by("equipment_number")

    def get_queryset(self):
        qs = super().get_queryset()
        department_id = self.request.query_params.get("department")
        category_id = self.request.query_params.get("category")

        if department_id:
            qs = qs.filter(department_id=department_id)
        if category_id:
            qs = qs.filter(category_id=category_id)

        return qs

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "approve"]:
            return [IsAuthenticated(), IsManagerOrSuperAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        equipment = serializer.save()
        log_object_create(
            user=self.request.user,
            object_type="equipment",
            object_id=str(equipment.id),
            extra={
                "equipment_number": equipment.equipment_number,
                "name": equipment.name,
                "status": getattr(equipment, "status", None),
            },
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        old_values = {
            "equipment_number": instance.equipment_number,
            "name": instance.name,
            "status": getattr(instance, "status", None),
        }
        equipment = serializer.save()
        changes = {}
        for field in ["equipment_number", "name", "status"]:
            before = old_values.get(field)
            after = getattr(equipment, field, None)
            if before != after:
                changes[field] = (before, after)
        if changes:
            log_object_update(
                user=self.request.user,
                object_type="equipment",
                object_id=str(equipment.id),
                changes=changes,
                event_type="equipment_update",
            )

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting equipment that is referenced by FilterAssignment (PROTECT FK).
        Return a clear 400 error instead of a 500 traceback.
        """
        instance = self.get_object()
        equip_id = str(instance.id)
        eq_number = instance.equipment_number
        try:
            response = super().destroy(request, *args, **kwargs)
            log_object_delete(
                user=request.user,
                object_type="equipment",
                object_id=equip_id,
                extra={"equipment_number": eq_number},
            )
            return response
        except ProtectedError as e:
            # e.protected_objects contains the related objects blocking deletion
            related_names = {type(obj).__name__ for obj in (e.protected_objects or [])}
            if "FilterAssignment" in related_names:
                msg = (
                    "This equipment cannot be deleted because it is assigned to one or more filters. "
                    "Remove the filter assignments first (E Log Book → Filter → settings/register or schedules), then try again."
                )
            else:
                msg = (
                    "This equipment cannot be deleted because it is referenced by other records. "
                    "Remove those references first, or deactivate the equipment instead."
                )
            return Response(
                {"detail": msg},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """
        Approve or reject an equipment master record.

        Body: { "action": "approve" | "reject" }
        Rule: approver must be different from the user who created the record.
        """
        equipment = self.get_object()
        action_type = (request.data.get("action") or "approve").strip().lower()

        if action_type not in ("approve", "reject"):
            raise ValidationError({"action": ["Invalid action. Use 'approve' or 'reject'."]})

        # Enforce different user for approval/rejection vs creator
        creator_id = getattr(equipment.created_by, "id", None)
        if creator_id and creator_id == request.user.id:
            raise ValidationError(
                {
                    "detail": [
                        "Equipment must be approved or rejected by a different user than the one who created it."
                    ]
                }
            )

        old_status = equipment.status
        if action_type == "approve":
            equipment.status = "approved"
        else:
            equipment.status = "rejected"

        equipment.approved_by = request.user
        equipment.approved_at = timezone.now()
        equipment.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

        # Audit approval/rejection status change
        event_type = "log_approved" if action_type == "approve" else "log_rejected"
        log_status_change(
            user=request.user,
            object_type="equipment",
            object_id=str(equipment.id),
            from_status=old_status,
            to_status=equipment.status,
            event_type=event_type,
            extra={
                "equipment_number": equipment.equipment_number,
                "action": action_type,
            },
        )

        serializer = self.get_serializer(equipment)
        return Response(serializer.data)

