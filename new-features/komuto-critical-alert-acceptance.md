# Acceptance Criteria — Critical Alert: Bell Notification + Email

**Feature:** Critical Alert notifications (bell + email)
**Project:** Komuto Fleet Management System (ITB)
**Status:** Specced — ready for implementation

---

## Context

- Builds on existing maintenance overdue logic (Healthy / Near Service / Overdue classification, already implemented for Vehicle List / Dashboard Critical Alerts panel).
- Two delivery channels fire on the same trigger: in-app bell notification, and email to all inspectors.
- No manual dismiss action — alerts auto-clear when the underlying issue is resolved (new service logged).

---

## 1. Trigger

- Fires once per (vehicle, part) combination when that part's service interval (km-based or time-based) is crossed into "overdue" status.
- No repeat firing while the part remains overdue — the alert event fires exactly once until reset.
- Reset condition: a new service history entry is logged for that (vehicle, part) — this resets the maintenance interval (existing behavior) and automatically clears the associated alert (bell entry disappears). No manual dismiss action ("Tandai Selesai" removed from scope).
- Each (vehicle, part) overdue combination is tracked and alerted independently — e.g. Vehicle A's Engine Oil and Vehicle A's Brake Pads going overdue are two separate alert events.

## 2. Bell Notification

- Visible to Superadmin, Admin Operasional, User Operasional. Not visible to Inspector.
- Each overdue (vehicle, part) event appears as one entry in the bell dropdown/panel.
- Entry shows vehicle plate + part name + overdue status, consistent with the existing Dashboard "Critical Alerts" panel item style (e.g. "Brake Failure Risk / Vehicle: D 2109 NNZ").
- Entry disappears automatically once the reset condition (new service logged for that part) is met — no manual resolve/dismiss action.

## 3. Email Notification

- Sent to all inspectors system-wide (no per-vehicle assignment), once per (vehicle, part) overdue event — same trigger and dedup rules as the bell.
- Email content: notification text only (e.g. "Vehicle D 2109 NNZ — Engine Oil service overdue"). No deep link/URL to the vehicle detail page.
- Recipient list = current inspector emails as synced/registered via existing inspector account data.

---

## Open Items / Confidence Notes

- **[Low confidence]** Bell notification entry styling assumed to reuse the existing Dashboard "Critical Alerts" panel item component/style — confirm this is the same visual component during implementation, not a new one.
