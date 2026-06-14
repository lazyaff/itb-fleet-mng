# Acceptance Criteria — BBM / Fuel Log Tab

**Feature:** BBM (Fuel Log) Tab on Vehicle Detail page
**Project:** Komuto Fleet Management System (ITB)
**Status:** Specced — ready for implementation

---

## Context

- New tab on the Vehicle Detail page, alongside existing Part Health / Service History / Active Alerts tabs.
- Follows the same overall pattern as Service History (table + actions + photo attachment), with a different field set and no approval flow.
- No approval flow — BBM records are created/edited/deleted directly.

---

## 1. List View & Summary Cards

- New "BBM" tab alongside Part Health / Service History / Active Alerts on the Vehicle Detail page.
- Three summary cards at top, scoped to the currently applied date filter:
  - **Total Fuel** — sum of Liters across records in range.
  - **Total Cost** — sum of Total Cost across records in range.
  - **Jumlah Pengisian** (Refuel Count) — count of records in range.
- Table columns: Date, Fuel (Liters), Cost, Payment Method, Receipt (view icon/link).
- Table rows ordered by date, most recent first (consistent with Service History).

## 2. Date Filter

- "Periode" date-range filter (from–to) with "Terapkan Filter" button, same pattern as the reconciliation table filter.
- Default range on first load: last 30 days from today.
- Applying a new range refilters both the table rows and the three summary cards.

## 3. Add Fuel Record

- Available to User Operasional, Admin Operasional, Superadmin.
- "+ Fuel Log" / "+ Add" button opens Add form: Date*, Total Cost (IDR)*, Fuel Volume (Liters)*, Payment Method* (Card/Cash dropdown), Receipt Photo (required, single file, PNG/JPG/WebP up to 10MB), Notes (optional).
- All fields marked `*` are required; submit is blocked with inline validation if any required field (including receipt photo) is missing.
- No approval flow — record is created directly and immediately visible in the table.
- Newly added record uses currently logged-in user's role for action-icon visibility per section 4.

## 4. Edit / Delete (Role-Gated)

- Admin Operasional and Superadmin: see Edit (pencil/form icon) and Delete (trash icon) actions on each row, matching Service History's Action column style.
- User Operasional: Action column shows no Edit/Delete icons (blank or icons omitted) — view-only on existing records beyond the Receipt link.
- Edit opens the same form as Add, pre-filled with existing values, including ability to replace the receipt photo ("Change Photo").
- Delete removes the fuel record. Standard delete — no soft-delete/reactivation requirement for this feature.

## 5. Receipt View / Change Photo

- "See Invoice"-style link/icon in the Receipt column opens a photo view: back-navigable panel showing the receipt image, with a "Change Photo" button at bottom.
- "Change Photo" button visible only to Admin Operasional / Superadmin (same gating as section 4 Edit). User Operasional sees the receipt image but no "Change Photo" button.
- "Back" returns to the BBM tab list view.

---

## Open Items / Confidence Notes

- **[Low confidence]** Exact summary card copy/labels in Indonesian ("Jumlah Pengisian" etc.) — plausible terms consistent with existing UI text, but should be confirmed with design before final implementation.
- Inspector role has no access to this tab (mobile-only inspection form scope, unchanged from original spec).
