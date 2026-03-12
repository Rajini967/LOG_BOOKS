from django.db.models.deletion import ProtectedError
from django.utils import timezone
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from accounts.permissions import IsManagerOrSuperAdmin
from reports.utils import log_limit_change
from core.log_slot_utils import (
    get_interval_for_equipment,
    get_tolerance_minutes_for_equipment,
    compute_log_entry_window,
)

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


class EquipmentCategoryViewSet(viewsets.ModelViewSet):
    """CRUD for EquipmentCategory master."""

    permission_classes = [IsAuthenticated]
    serializer_class = EquipmentCategorySerializer
    queryset = EquipmentCategory.objects.all().order_by("name")

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsManagerOrSuperAdmin()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting categories that are in use by Equipment (PROTECT FK).
        Return a clear 400 error instead of a 500 traceback.
        """
        instance: EquipmentCategory = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
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

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting equipment that is referenced by FilterAssignment (PROTECT FK).
        Return a clear 400 error instead of a 500 traceback.
        """
        instance = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
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

    def perform_create(self, serializer):
        equipment = serializer.save()
        user = self.request.user if getattr(self.request, "user", None) and self.request.user.is_authenticated else None
        # Record initial configuration fields in audit trail (config_update)
        try:
            tracked = ("log_entry_interval", "shift_duration_hours", "tolerance_minutes", "is_active")
            for field in tracked:
                log_limit_change(
                    user=user,
                    object_type="equipment",
                    key=str(equipment.id),
                    field_name=field,
                    old=None,
                    new=getattr(equipment, field, None),
                    extra={
                        "equipment_number": equipment.equipment_number,
                        "equipment_name": equipment.name,
                    },
                    event_type="config_update",
                )
        except Exception:
            pass

    def perform_update(self, serializer):
        instance: Equipment = serializer.instance
        user = self.request.user if getattr(self.request, "user", None) and self.request.user.is_authenticated else None
        tracked = ("log_entry_interval", "shift_duration_hours", "tolerance_minutes", "is_active")
        old_values = {f: getattr(instance, f, None) for f in tracked}
        equipment = serializer.save()
        try:
            for field in tracked:
                old = old_values.get(field)
                new = getattr(equipment, field, None)
                if old == new:
                    continue
                log_limit_change(
                    user=user,
                    object_type="equipment",
                    key=str(equipment.id),
                    field_name=field,
                    old=old,
                    new=new,
                    extra={
                        "equipment_number": equipment.equipment_number,
                        "equipment_name": equipment.name,
                    },
                    event_type="config_update",
                )
        except Exception:
            pass

    @action(detail=False, methods=["get"], url_path="scheduled_status")
    def scheduled_status(self, request):
        """
        GET /api/equipment/scheduled_status/?log_type=chiller|boiler|filter|chemical

        Returns per-row schedule window status used by logbook equipment list UIs.
        """
        log_type = (request.query_params.get("log_type") or "").strip().lower()
        if log_type not in ("chiller", "boiler", "filter", "chemical"):
            raise ValidationError({"log_type": ["log_type must be one of: chiller, boiler, filter, chemical."]})

        now = timezone.now()
        near_delay_threshold = timezone.timedelta(minutes=5)

        def interval_minutes(interval: str, shift_hours: int) -> int:
            i = (interval or "").strip().lower() or "hourly"
            if i == "daily":
                return 24 * 60
            if i == "shift":
                return max(1, int(shift_hours or 8)) * 60
            return 60

        rows = []

        if log_type in ("chiller", "boiler", "chemical"):
            # Resolve equipment list by category name
            category_q = Q(category__name__iexact=log_type) | Q(category__name__iexact=f"{log_type}s")
            qs = (
                Equipment.objects.filter(is_active=True)
                .filter(category_q)
                .order_by("equipment_number")
            )

            # Pick correct log model and lookup strategy for last entry
            if log_type == "chiller":
                from chiller_logs.models import ChillerLog

                def get_last_ts(equipment_number: str):
                    obj = (
                        ChillerLog.objects.filter(equipment_id=equipment_number)
                        .exclude(timestamp__isnull=True)
                        .order_by("-timestamp")
                        .first()
                    )
                    return obj.timestamp if obj else None

                identifier_for_resolve = lambda eq: eq.equipment_number
            elif log_type == "boiler":
                from boiler_logs.models import BoilerLog

                def get_last_ts(equipment_number: str):
                    obj = (
                        BoilerLog.objects.filter(equipment_id=equipment_number)
                        .exclude(timestamp__isnull=True)
                        .order_by("-timestamp")
                        .first()
                    )
                    return obj.timestamp if obj else None

                identifier_for_resolve = lambda eq: eq.equipment_number
            else:
                from chemical_prep.models import ChemicalPreparation

                def get_last_ts(equipment_number: str):
                    # Chemical logs may store equipment_name as "EQ-001 – Something"
                    obj = (
                        ChemicalPreparation.objects.filter(equipment_name__startswith=equipment_number)
                        .exclude(timestamp__isnull=True)
                        .order_by("-timestamp")
                        .first()
                    )
                    return obj.timestamp if obj else None

                identifier_for_resolve = lambda eq: eq.equipment_number

            for eq in qs:
                identifier = identifier_for_resolve(eq)
                interval, shift_hours = get_interval_for_equipment(identifier, log_type)
                tol = get_tolerance_minutes_for_equipment(identifier, log_type)
                last_ts = get_last_ts(eq.equipment_number)
                window = compute_log_entry_window(last_ts, interval, shift_hours, tol) if last_ts else None

                if window:
                    if now < window["start_window"]:
                        state = "too_early"
                    elif now <= window["end_window"]:
                        # Near-delay = last 5 minutes before end of allowed window
                        state = "near_delay" if (window["end_window"] - near_delay_threshold) <= now else "allowed"
                    else:
                        state = "delayed"
                    expected_time = window["expected_time"]
                    start_window = window["start_window"]
                    end_window = window["end_window"]
                else:
                    state = "allowed"
                    expected_time = None
                    start_window = None
                    end_window = None

                rows.append(
                    {
                        "equipment_number": eq.equipment_number,
                        "name": eq.name,
                        "interval": interval,
                        "interval_minutes": interval_minutes(interval, shift_hours),
                        "shift_duration_hours": shift_hours,
                        "tolerance_minutes": tol,
                        "last_entry": timezone.localtime(last_ts).isoformat() if last_ts else None,
                        "expected_entry": timezone.localtime(expected_time).isoformat() if expected_time else None,
                        "start_window": timezone.localtime(start_window).isoformat() if start_window else None,
                        "end_window": timezone.localtime(end_window).isoformat() if end_window else None,
                        "state": state,
                    }
                )

            return Response({"log_type": log_type, "rows": rows}, status=status.HTTP_200_OK)

        # filter: status by filter_id (stored in FilterLog.equipment_id)
        from filter_master.models import FilterMaster
        from filter_logs.models import FilterLog

        filters = FilterMaster.objects.all().order_by("filter_id")
        for fm in filters:
            filter_id = (fm.filter_id or "").strip()
            if not filter_id:
                continue
            interval, shift_hours = get_interval_for_equipment(filter_id, "filter")
            tol = get_tolerance_minutes_for_equipment(filter_id, "filter")
            last_obj = (
                FilterLog.objects.filter(equipment_id=filter_id)
                .exclude(timestamp__isnull=True)
                .order_by("-timestamp")
                .first()
            )
            last_ts = last_obj.timestamp if last_obj else None
            window = compute_log_entry_window(last_ts, interval, shift_hours, tol) if last_ts else None

            if window:
                if now < window["start_window"]:
                    state = "too_early"
                elif now <= window["end_window"]:
                    state = "near_delay" if (window["end_window"] - near_delay_threshold) <= now else "allowed"
                else:
                    state = "delayed"
                expected_time = window["expected_time"]
                start_window = window["start_window"]
                end_window = window["end_window"]
            else:
                state = "allowed"
                expected_time = None
                start_window = None
                end_window = None

            rows.append(
                {
                    "filter_id": filter_id,
                    "name": getattr(fm, "name", None) or None,
                    "interval": interval,
                    "interval_minutes": interval_minutes(interval, shift_hours),
                    "shift_duration_hours": shift_hours,
                    "tolerance_minutes": tol,
                    "last_entry": timezone.localtime(last_ts).isoformat() if last_ts else None,
                    "expected_entry": timezone.localtime(expected_time).isoformat() if expected_time else None,
                    "start_window": timezone.localtime(start_window).isoformat() if start_window else None,
                    "end_window": timezone.localtime(end_window).isoformat() if end_window else None,
                    "state": state,
                }
            )

        return Response({"log_type": log_type, "rows": rows}, status=status.HTTP_200_OK)

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

        if action_type == "approve":
            equipment.status = "approved"
        else:
            equipment.status = "rejected"

        equipment.approved_by = request.user
        equipment.approved_at = timezone.now()
        equipment.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

        serializer = self.get_serializer(equipment)
        return Response(serializer.data)

