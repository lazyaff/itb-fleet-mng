# Acceptance Criteria — Dynamic Inspection Form Builder

**Feature:** Dynamic Form Builder (replaces fixed three-region inspection form)
**Project:** Komuto Fleet Management System (ITB)
**Status:** Specced — ready for implementation

---

## 1. Build

- Admin/Superadmin can add new fields via "Add Field" (Pilihan Ganda / PG type) or "Add Text Field" (Text type).
- PG fields have exactly 4 choices, each independently editable as free text.
- Field name (block title) is editable as free text for both PG and Text fields.
- Text fields render a placeholder input ("Inspector types here...") in builder/preview — not editable by admin, just a display placeholder.
- Recommendation field is always present, always last, visually marked "REQUIRED — Cannot be removed," and has no edit/delete/reorder controls.
- No autosave — all changes are local/unsaved until Publish.
- No maximum field limit.

## 2. Reorder / Delete

- Up/down arrows reorder PG and Text fields (Recommendation excluded — fixed last).
- Arrows disable/grey out at top and bottom boundaries appropriately (topmost field's up arrow, bottommost non-Recommendation field's down arrow).
- Delete (trash icon) triggers an inline confirmation banner ("Delete the '[Field Name]' field?") with Delete/Cancel buttons — no modal.
- Cancel dismisses the banner with no changes. Delete removes the field immediately (still unsaved/unpublished).
- Recommendation field has no delete icon.

## 3. Preview

- Toggle between Builder and Preview views without losing unsaved changes.
- Preview renders the form as an inspector would see it: PG fields as radio groups, Text fields as input boxes, Recommendation as three fixed buttons (Ready to Drive / Service Required / Do Not Drive).
- Preview is read-only — no edit/reorder/delete controls visible.

## 4. Publish & Validation

- Clicking "Publish Form" validates:
  - Every PG and Text field has a non-empty name.
  - Every PG field has all 4 choices non-empty.
- If validation fails: do not publish. Highlight each offending field with a red border/outline and show a generic "Field required" message near each one. No positional ("Field 3") references.
- If validation passes: show a publish confirmation modal (pattern reused from existing source code modals) summarizing the action before committing.
- On confirm: increment version number (e.g. v1 → v2), update "Published [date]" timestamp, persist the new form structure as the active form.
- Cancel on the confirmation modal returns to Builder with no changes published.

## 5. Versioning / Snapshot

- Each publish creates a new immutable version record (full field structure, not just a version number/ID).
- Each inspection submission stores a reference/snapshot to the form version active at time of submission.
- If the form is republished (new version) while an inspector has a submission in progress (unsubmitted), that submission fails on attempted submit. Inspector sees a red toast notification (e.g. "Form has been updated, please reload and try again") and must reload to get the new version.
- Historical inspection reports must render using the form version snapshot stored at submission time, not the current active version.

---

## Open Items / Confidence Notes

- **[Medium confidence]** Section 5 submission-failure UX is now specified (red toast), but exact wording and toast styling should match existing error-handling patterns in the repo — confirm during implementation rather than inventing new toast styles.
