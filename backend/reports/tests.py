from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import AuditEvent
from .audit_helpers import log_event, log_field_change, log_object_create, log_object_delete, log_status_change, log_object_update


User = get_user_model()


class AuditHelpersTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(email="tester@example.com", password="test123")

    def test_log_event_creates_row(self):
        log_event(
            event_type="config_update",
            user=self.user,
            object_type="session_setting",
            object_id="1",
            field_name="auto_logout_minutes",
            old_value=30,
            new_value=45,
            extra={"reason": "test"},
        )
        evt = AuditEvent.objects.get()
        self.assertEqual(evt.event_type, "config_update")
        self.assertEqual(evt.object_type, "session_setting")
        self.assertEqual(evt.object_id, "1")
        self.assertEqual(evt.field_name, "auto_logout_minutes")
        self.assertEqual(evt.old_value, "30")
        self.assertEqual(evt.new_value, "45")
        self.assertEqual(evt.extra.get("reason"), "test")

    def test_log_field_change_skips_unchanged(self):
        log_field_change(
            user=self.user,
            object_type="equipment",
            object_id="123",
            field_name="name",
            old_value="Pump-1",
            new_value="Pump-1",
            event_type="equipment_update",
            extra=None,
        )
        self.assertEqual(AuditEvent.objects.count(), 0)

    def test_log_object_create_and_delete(self):
        log_object_create(
            user=self.user,
            object_type="equipment",
            object_id="123",
            extra={"equipment_number": "EQ-001"},
        )
        self.assertEqual(AuditEvent.objects.filter(event_type="log_created").count(), 1)

        log_object_delete(
            user=self.user,
            object_type="equipment",
            object_id="123",
            extra={"equipment_number": "EQ-001"},
        )
        self.assertEqual(AuditEvent.objects.filter(event_type="log_deleted").count(), 1)

    def test_log_status_change_and_update(self):
        log_status_change(
            user=self.user,
            object_type="chiller_log",
            object_id="abc",
            from_status="pending",
            to_status="approved",
            event_type="log_approved",
            extra={"remarks": "OK"},
        )
        evt = AuditEvent.objects.get(event_type="log_approved")
        self.assertEqual(evt.field_name, "status")
        self.assertEqual(evt.old_value, "pending")
        self.assertEqual(evt.new_value, "approved")
        self.assertEqual(evt.extra.get("remarks"), "OK")

        AuditEvent.objects.all().delete()
        log_object_update(
            user=self.user,
            object_type="equipment",
            object_id="123",
            changes={"name": ("Old", "New")},
            event_type="equipment_update",
            extra={"equipment_number": "EQ-001"},
        )
        evt = AuditEvent.objects.get()
        self.assertEqual(evt.field_name, "name")
        self.assertEqual(evt.old_value, "Old")
        self.assertEqual(evt.new_value, "New")
        self.assertEqual(evt.extra.get("equipment_number"), "EQ-001")

