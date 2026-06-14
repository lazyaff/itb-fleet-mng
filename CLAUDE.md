# Komuto Fleet Management — Notes for Claude

Next.js 16 (App Router) + TypeScript + Prisma 6 (PostgreSQL) + Tailwind v4.
Fleet management app with an **admin** web dashboard and a mobile-first
**inspector** PWA-style section.

## Dev workflow

- Dev server: `npm run dev` → runs `next dev -p 3003` (port is hardcoded,
  always `http://localhost:3003`). It's often already running in the
  background — check before starting another instance.
- Seed DB: `npm run seed` (`prisma/seeder/index.ts`, includes
  `prisma/seeder/user.ts`, `formBuilder.ts`, etc.)
- Type check: `npx tsc --noEmit` (must pass clean before considering a task done)
- Format: `npx prettier --write <files>` after edits — the repo enforces
  prettier formatting and edits will get auto-reformatted anyway.
- Line endings: repo is checked out with LF but git config converts to CRLF
  on commit (`warning: LF will be replaced by CRLF` is normal/expected).

## Auth (for manual API testing via curl)

1. `POST /api/v1/auth` with header `Authorization: Basic base64(admin:admin)`
   (from `.env` `NEXT_PUBLIC_AUTH_USERNAME`/`NEXT_PUBLIC_AUTH_PASSWORD`, both
   `"admin"`) and body `{email, password}` → returns `data.token` (JWT).
2. Use `Authorization: Bearer <token>` for all other `/api/v1/*` routes.
3. `validateJWT(req, allowedRoles)` in [utils/auth.ts](utils/auth.ts) checks
   role against `inspection`-style role IDs: `SADM` (super admin), `ADM`
   (admin), `INSP` (inspector).

Seeded local users ([prisma/seeder/user.ts](prisma/seeder/user.ts)):
- `27584936@mahasiswa.itb.ac.id` / `admin` → role `ADM`
- `dummy.dkst@itb.ac.id` / `superadmin` → role `SADM`
- `fulan@itb.ac.id` / `inspektor` → role `INSP` (id
  `f3b8c6d2-7e41-4a9b-92fd-1c5e8a7d4b63`), has vehicle
  `3e7f1a9c-5d24-4b8e-9a6f-2c1d7e8b4f90` (plate `D 2127 RNN`).

## API response shape

Every `/api/v1/*` route returns
`{ success, status, message, data? }`. 401 → frontend calls
`signOut({redirect:false})` then redirects to `/`. Always wrap handlers in
try/catch returning a 500 in the same shape.

## i18n

- [context/Language.tsx](context/Language.tsx) provides `useLanguage()` →
  `{ t, lang }`. `t("namespace.key")` looks up
  [locales/en.json](locales/en.json) / [locales/id.json](locales/id.json)
  (flat dot-key JSON, both files must stay in sync, same key order).
- Some older inspector-facing pages hardcode Indonesian strings (e.g.
  literal `"Bagian {n}: {title}"`) instead of using `t()` — not fully
  consistent across the codebase.

## Inspection data: legacy vs dynamic (important!)

There are **two parallel systems** for inspection reports — any
list/detail API touching inspections must handle both:

1. **Legacy/static** — `inspection_report` + `inspection_answer` (+
   `inspection_section`/`inspection_question`/`inspection_option`). Answers
   are flat rows with denormalized `section_title`/`section_order`/
   `question_title`/etc, grouped in JS into `sections[].questions[]`.
2. **Dynamic (form-builder)** — `inspection_form_version` (`fields: Json` =
   `FormField[]`, one active version at a time) +
   `inspection_dynamic_report` (`answers: Json` =
   `{field_id, type, value}[]`, `conclusion: String`).

Pattern used in all 4 routes (admin list/detail +
inspector history list/detail):
- **List** (`app/api/v1/inspection/route.ts`,
  `app/api/v1/inspection/user/history/route.ts`): fetch `offset+limit` from
  *both* tables in parallel with the same `where`/`orderBy`, merge in-memory
  with a sort comparator, slice to the requested page, sum both `.count()`
  for `totalRecords`.
- **Detail** (`app/api/v1/inspection/detail/route.ts`,
  `app/api/v1/inspection/user/history/detail/route.ts`): try
  `inspection_report.findFirst` first; if null, fall back to
  `inspection_dynamic_report.findFirst` (include `form_version`), then map
  `fields`/`answers` into the **same** `{sections[].questions[].answer:
  {label, description, value}}` shape the frontend already renders — no
  frontend changes needed for the fallback.

Both detail responses render in
[app/admin/inspection/page.tsx](app/admin/inspection/page.tsx) and
[app/inspector/detail/[id]/page.tsx](app/inspector/detail/[id]/page.tsx)
(and `app/inspector/report/page.tsx` for the legacy view), which all print
`Bagian {section.order}: {section.title}`.

## Form Builder (`src/formBuilder.ts`)

`FormField = { id, type: "PG" | "TEXT" | "SECTION", name, choices?: string[] }`
- `PG` = multiple choice, exactly 4 choices required by
  `validateFormFields`.
- `TEXT` = free text, rendered as `<textarea maxLength={150}>`.
- `SECTION` = a header-only marker (just `id`+`name`, no choices/answer). Used
  purely to group the *following* fields under a "Bagian N: {name}" heading.

`groupFieldsIntoSections(fields)` → `{title, fields}[]`: splits the flat
array on `SECTION` markers. Fields before the first `SECTION` (or all fields,
if there are no markers) land in a section with `title: ""` — consumers
should fall back to a default title (e.g. `"Inspection Form"`) for empty
titles to preserve old single-section forms.

**Anywhere you iterate `FormField[]` to validate/submit answers, filter out
`type === "SECTION"` first** — they have no `answers[field.id]` entry. This
bit us once already in `app/api/v1/inspector/dynamic-report/route.ts`
(missing-field check) and `app/inspector/dynamic-report/page.tsx`
(`isComplete()` + submit payload mapping).

### Builder pages/components
- [app/admin/form-builder/page.tsx](app/admin/form-builder/page.tsx) — admin
  builder. Sliding Builder/Preview toggle (`view` state). "+ Add Field" (PG,
  blue dashed), "+ Add Text Field" (purple dashed), "+ Add Section" (gray
  dashed) buttons → `handleAddField(type)`. DnD reorder via `@dnd-kit`.
  Publish → `POST /api/v1/form-builder/publish` (creates new
  `inspection_form_version`, deactivates the previous one).
- `components/form-builder/PGFieldCard.tsx`,
  `TextFieldCard.tsx`, `SectionFieldCard.tsx` — one card type per
  `FormFieldType`, all share the same drag/move/delete prop contract.
- `components/form-builder/RecommendationCard.tsx` — static, non-editable
  preview of the required final recommendation (locked, always last).
- [components/form-builder/FormFieldsView.tsx](components/form-builder/FormFieldsView.tsx)
  — shared renderer, `mode: "preview"` (admin, read-only grids: PG choices
  2-col, recommendation 3-col) vs `"interactive"` (inspector, one-per-line
  with radio/textarea bound to `answers`/`onAnswerChange`). Renders section
  headers via `groupFieldsIntoSections`. Used by both
  `app/admin/form-builder/page.tsx` (preview tab) and
  `app/inspector/dynamic-report/page.tsx` (live form fill).
- `RECOMMENDATION_OPTIONS` (in `src/formBuilder.ts`) values
  (`"Siap Jalan"`/`"Butuh Servis"`/`"Dilarang Jalan"`) must match
  `inspectionConclusion` keys in `src/dropdown.ts`.

### Submission flow
`app/inspector/dynamic-report/page.tsx` → `POST
/api/v1/inspector/dynamic-report` with `{form_version_id, vehicle_id,
conclusion, answers}`. Server re-validates the submitted `form_version_id`
is still the active version (409 if stale → frontend shows reload prompt).

## Active branch context

On `feature/form-builder` (off `dev`), building out the dynamic form builder
feature end-to-end: schema/seed → API routes → admin builder UI → inspector
fill/report UI → section grouping. Each slice has been a separate commit
(`feat(form-builder): ...`). PR not yet opened — GitHub suggests
`/pull/new/feature/form-builder` against `dev`.

There's an unrelated untracked file
`new-features/komuto-user-management-acceptance.md` sitting in the working
tree (not created by form-builder work) — leave it alone unless asked.
