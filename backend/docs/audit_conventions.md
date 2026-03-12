## Audit Event Conventions

This document summarizes how the unified audit trail is modeled and how
applications should write `AuditEvent` rows.

### 1. Core model

All audit events are stored in `reports.AuditEvent`:

- `event_type`: high-level category of the event (see below).
- `object_type`: short string describing the domain object (`"chiller_log"`, `"equipment"`, `"user"`, etc.).
- `object_id`: identifier of the object (usually the UUID or primary key).
- `field_name`: name of the field that changed, or a logical field such as `"status"`.
- `old_value` / `new_value`: string representations of values before and after the change.
- `extra`: JSON payload for contextual information.

### 2. Event types

Common `event_type` values:

- Configuration / limits:
  - `limit_update` – limit-like field changes (equipment limits, logbook field limits, etc.).
  - `config_update` – non-limit configuration changes (session settings, schema metadata).
- Log lifecycle:
  - `log_created` – log or dynamic entry created.
  - `log_update` – log fields updated in place.
  - `log_correction` – a new correcting log created for an existing entry.
  - `log_approved` – log or certificate approved.
  - `log_rejected` – log or certificate rejected.
  - `log_deleted` – log or entry deleted.
- User lifecycle:
  - `user_created` – new user created.
  - `user_updated` – user updated or soft-deleted.
  - `password_changed` – password changed or reset.
  - `user_locked` / `user_unlocked` – account lock/unlock events.
  - `login` / `logout` – authentication session events.
- Master data:
  - `equipment_update` – updates to master data (equipment, site, instrument, department, categories).

### 3. Object types

`object_type` is a short, stable label. Examples:

- Logs and dynamic entries:
  - `"chiller_log"`, `"boiler_log"`, `"filter_log"`, `"compressor_log"`, `"chemical_log"`, `"utility_log"`.
  - `"hvac_validation"`, `"test_certificate"`.
  - `"logbook_entry"`, `"logbook_schema"`, `"logbook_field_limit"`.
- Limits and configuration:
  - `"chiller_limit"`, `"boiler_limit"`, `"session_setting"`, `"chiller_dashboard"`, `"chemical_dashboard"`.
- Users and access:
  - `"user"`, `"department"`, `"equipment"`, `"equipment_category"`, `"site"`, `"instrument"`.

### 4. Helpers

Applications should prefer using helpers from `reports.audit_helpers`:

- `log_event(...)` – low-level single event writer.
- `log_field_change(...)` – single field change for an object.
- `log_object_create(...)` – creation of a new object (`event_type="log_created"` by default).
- `log_object_update(...)` – a set of field changes for an object.
- `log_object_delete(...)` – deletion or soft-deletion (`event_type="log_deleted"` by default).
- `log_status_change(...)` – workflow transitions (`from_status` → `to_status`).

Existing limit/configuration code uses `reports.utils.log_limit_change(...)` which
is implemented on top of `log_field_change(...)`.

### 5. Typical `extra` payloads

`extra` is used to add context. Typical keys:

- For logs:
  - `"equipment_id"`, `"site_id"`, `"timestamp"`, `"original_id"`, `"correction_id"`.
- For approvals:
  - `"action"` (`"approve"` or `"reject"`), `"remarks"`, `"certificate_no"`, `"room_name"`.
- For master data:
  - `"equipment_number"`, `"name"`.
- For schemas:
  - `"schema_name"`, `"client_id"`, `"category"`, `"field_label"`.

Writers should keep `extra` small but sufficient to understand the event
without dereferencing the source object.

