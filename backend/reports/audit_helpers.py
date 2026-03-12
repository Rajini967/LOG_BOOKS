"""
Helper utilities for writing unified audit trail events to ``AuditEvent``.

These helpers should be used by apps when recording configuration changes,
limit updates, log lifecycle events, and master-data operations, so that all
events share a consistent schema and conventions.
"""

import logging
from typing import Any, Dict, Optional

from .models import AuditEvent

logger = logging.getLogger(__name__)


def log_event(
    *,
    event_type: str,
    user: Optional[Any] = None,
    object_type: str,
    object_id: Optional[str] = None,
    field_name: str = "",
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Low-level helper to record a single audit event.

    This is intentionally tolerant of failures and will never raise;
    failures are logged for operators but do not affect the main flow.
    """
    try:
        AuditEvent.objects.create(
            user=user if getattr(user, "is_authenticated", False) else None,
            event_type=event_type,
            object_type=object_type,
            object_id=str(object_id) if object_id is not None else None,
            field_name=field_name,
            old_value=str(old_value) if old_value is not None else None,
            new_value=str(new_value) if new_value is not None else None,
            extra=extra or {},
        )
    except Exception:  # pragma: no cover - safety net
        logger.exception("Failed to write audit event (type=%s, object_type=%s)", event_type, object_type)


def log_field_change(
    *,
    user: Optional[Any],
    object_type: str,
    object_id: Optional[str],
    field_name: str,
    old_value: Any,
    new_value: Any,
    event_type: str,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Convenience wrapper for a single field change on an object.
    """
    if old_value == new_value:
        return

    log_event(
        event_type=event_type,
        user=user,
        object_type=object_type,
        object_id=object_id,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        extra=extra,
    )


def log_object_create(
    *,
    user: Optional[Any],
    object_type: str,
    object_id: Optional[str],
    extra: Optional[Dict[str, Any]] = None,
    event_type: str = "log_created",
) -> None:
    """
    Record that a new object has been created.
    """
    log_event(
        event_type=event_type,
        user=user,
        object_type=object_type,
        object_id=object_id,
        field_name="",
        old_value=None,
        new_value=None,
        extra=extra,
    )


def log_object_delete(
    *,
    user: Optional[Any],
    object_type: str,
    object_id: Optional[str],
    extra: Optional[Dict[str, Any]] = None,
    event_type: str = "log_deleted",
) -> None:
    """
    Record that an object has been deleted (or soft-deleted).
    """
    log_event(
        event_type=event_type,
        user=user,
        object_type=object_type,
        object_id=object_id,
        field_name="",
        old_value=None,
        new_value=None,
        extra=extra,
    )


def log_status_change(
    *,
    user: Optional[Any],
    object_type: str,
    object_id: Optional[str],
    from_status: Optional[str],
    to_status: Optional[str],
    event_type: str = "log_update",
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Helper focused on status/workflow transitions.
    """
    payload: Dict[str, Any] = {"from_status": from_status, "to_status": to_status}
    if extra:
        payload.update(extra)

    log_field_change(
        user=user,
        object_type=object_type,
        object_id=object_id,
        field_name="status",
        old_value=from_status,
        new_value=to_status,
        event_type=event_type,
        extra=payload,
    )


def log_object_update(
    *,
    user: Optional[Any],
    object_type: str,
    object_id: Optional[str],
    changes: Dict[str, Any],
    event_type: str = "log_update",
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log a set of field changes for an object.

    ``changes`` should be a mapping of field_name -> (old_value, new_value).
    """
    for field_name, pair in changes.items():
        if not isinstance(pair, (list, tuple)) or len(pair) != 2:
            continue
        old_value, new_value = pair
        log_field_change(
            user=user,
            object_type=object_type,
            object_id=object_id,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            event_type=event_type,
            extra=extra,
        )

