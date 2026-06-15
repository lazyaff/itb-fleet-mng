# Acceptance Criteria — User Reconciliation Table: Date Filter

**Feature:** Date filter on User Usage Reconciliation table (Vehicle Detail page)
**Project:** Komuto Fleet Management System (ITB)
**Status:** Specced — ready for implementation

---

## Context

- User Usage Reconciliation table (Renter, Date, Distance traveled) currently has no date filter on the dev branch.
- Reuses the same "Periode" date-range filter pattern already implemented for the BBM tab and Monthly Recap.

---

## 1. Date Filter

- Add "Periode" date-range filter (from–to) with "Terapkan Filter" button — same component/pattern as used in the BBM tab and Monthly Recap.
- Filters the User Usage Reconciliation table rows (Renter, Date, Distance traveled) to the selected date range.
- Default range on first load: last 30 days from today (consistent with BBM tab default).

## 2. Detail Button

- "View Detail..." button remains a placeholder — no functional change. Blocked on e-facility exposing renter/driver/trip detail data.
- Button exists, visually consistent with current design, and does nothing or shows a "coming soon"/disabled state.

---

## Open Items / Confidence Notes

- None outstanding — scope is limited to applying the existing filter pattern to this table.
