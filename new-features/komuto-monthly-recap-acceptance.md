# Acceptance Criteria — Monthly Recap (Rekap Bulanan)

**Feature:** Monthly Report / Monthly Recap page
**Project:** Komuto Fleet Management System (ITB)
**Status:** Specced — ready for implementation

---

## Context

- New top-level "Monthly Report" page under the Reports section in the sidebar.
- Provides a per-vehicle operational summary (km, service, inspection, fuel) over a selectable date range, with CSV export.

---

## 1. Access

- New top-level "Monthly Report" page under Reports section in sidebar.
- Visible/accessible to Superadmin, Admin Operasional, User Operasional.
- Not accessible to Inspector.

## 2. Date Filter & Default Range

- "Periode" date-range filter (from–to) with "Terapkan Filter" button, same pattern as BBM/reconciliation filters.
- Default range on first load: 1st day of current calendar month → today.
- Applying a new range refilters both summary cards and the per-vehicle table.

## 3. Summary Cards

Four cards, scoped to the applied date range, aggregated across all vehicles:

- **Total KM Armada** — sum of total km traveled by all vehicles in range.
- **Total Liter BBM** — sum of fuel liters across all vehicles in range.
- **Total Biaya BBM** — sum of fuel cost across all vehicles in range, displayed in abbreviated Rupiah format (e.g. "Rp 7.1 jt").
- **Total Servis** — count of service history entries across all vehicles in range.

## 4. Per-Vehicle Table ("Rekap per Kendaraan")

- No subtitle/count line above the table (e.g. "4 kendaraan · Mei 2026" — removed from design).
- Columns: Kendaraan (plate + unit name), Kesehatan, Total KM, Avg KM/Hari, Servis (count), Inspeksi (count), Isi BBM (count), Litter (sum), Biaya BBM (sum, full Rupiah format e.g. "Rp 2.035.000").
- **Kesehatan** values (Sehat / Butuh Maintenance / Terlambat) use the same health classification logic as the existing Vehicle List "Fleet Status" (Healthy / Near Service / Overdue), displayed with matching colors (green/orange/red).
- All numeric columns (Total KM, Avg KM/Hari, Servis, Inspeksi, Isi BBM, Litter, Biaya BBM) are calculated within the applied date range.
- Avg KM/Hari = Total KM in range ÷ number of days in range.
- Table includes one row per vehicle, respecting the existing visibility toggle (hidden/unlinked vehicles excluded, consistent with other reports).

## 5. CSV Export

- "Ekspor CSV" button exports the per-vehicle table rows only, with columns matching the visible table (Kendaraan, Kesehatan, Total KM, Avg KM/Hari, Servis, Inspeksi, Isi BBM, Litter, Biaya BBM).
- Exported data reflects the currently applied date filter range.
- Summary cards are not included in the CSV export.

---

## Open Items / Confidence Notes

- **[Medium confidence]** Default range assumed as "1st of current month → today" rather than full calendar month (1st → end of month) — confirm this is the intended first-load behavior before final implementation.
- **[Low confidence]** Rupiah formatting: summary card uses abbreviated format ("Rp 7.1 jt"), table uses full format ("Rp 2.035.000") — both observed in design reference, assumed intentional, but should be confirmed with design.
