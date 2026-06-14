# Acceptance Criteria — User Management (Komuto-side)

**Feature:** User Management (Superadmin-only)
**Project:** Komuto Fleet Management System (ITB)
**Status:** Specced — ready for implementation

---

## Context

- Auth model: ITB SSO handles **authentication** (proving identity via shared cookie/token). Komuto maintains its own local user table for **authorization** (role assignment + access allowlist).
- Komuto's user table acts as an **allowlist**: an email not present (or present but inactive) in this table is blocked from accessing Komuto entirely, even with valid ITB SSO authentication.
- Superadmin accounts are created via code/seeders only — never through this UI. This UI manages Admin Operasional, User Operasional, and Inspector roles only.

---

## 1. Access

- This page/section is visible and accessible only to Superadmin.
- Admin Operasional, User Operasional, and Inspector roles cannot see or access User Management (sidebar item hidden, route blocked).

## 2. List View

- Table layout consistent with other Komuto Fleet dashboard tables.
- Columns: Email, Name, Role, Status (Active/Inactive), Date Added, Last Login.
- Role values shown: Admin Operasional, User Operasional, Inspector (Superadmin not listed/manageable here).
- Inactive (revoked) users remain visible in the list with Status = Inactive — not hidden or removed.

## 3. Add User

- Fields: Email, Name, Role (dropdown: Admin Operasional / User Operasional / Inspector — Superadmin not selectable).
- Email must be a valid `@itb.ac.id` address — validate format on submit.
- If the email already exists in the table:
  - If existing record is **active**: show error, prevent duplicate.
  - If existing record is **inactive** (previously revoked): offer reactivation instead of creating a new record — reactivation restores active status and allows updating name/role at the same time.
- On successful Add: new record created with Status = Active, Date Added = now, Last Login = empty/null (until first SSO login).
- This is pre-provisioning — the person does not need to have logged in via SSO before being added.

## 4. Edit User

- Editable fields: Name, Role.
- Role dropdown excludes Superadmin (cannot promote/demote to Superadmin via this UI).
- Email is not editable (acts as the unique identifier).

## 5. Delete (Revoke) / Reactivation

- "Delete" action soft-deletes: sets Status = Inactive. Record (email, name, role history, Date Added, Last Login) is preserved, not removed from the database — required to maintain referential integrity with other records (e.g. inspection submissions, approval history) tied to this user.
- Revoked user loses access on their next authenticated request — middleware/token check confirms active status in Komuto's user table; inactive → request blocked/redirected to "not authorized."
- A revoked email can be reactivated via Add (see section 3) using the same email — this restores Status = Active and allows updating Name/Role.

## 6. Access Enforcement (Login Flow)

- On SSO login, if the authenticated email is not present in Komuto's user table (or present but Inactive), access to Komuto is blocked entirely — user sees "not authorized for this system" (or equivalent), regardless of valid ITB SSO authentication.
- If the email is present and Active, login proceeds and the assigned role determines access/permissions as normal.
- Last Login timestamp updates on each successful authenticated session start.

---

## Open Items / Confidence Notes

- **[Medium confidence]** Section 6's "not authorized" messaging and exact redirect behavior should match whatever existing auth-failure pattern exists in the repo (if any). If no such pattern exists yet, this may be new UI/UX that Claude Code needs to design — flag during planning rather than assuming.
