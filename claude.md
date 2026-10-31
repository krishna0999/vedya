# CLAUDE.md — Form Builder

Context and conventions for working in this repo. Read this fully before scaffolding or writing code.

---

## 1. What this is

A web-based form builder. Users design forms in a visual editor, publish them, share a public link, and collect responses. Think Tally / Typeform / Google Forms category.

**Positioning — read this before you over-build anything.**
The general form builder is the **cost of entry, not the product.** Tally already gives away a clean general builder for free; out-polishing it is not a business. v1 must be a _credible_ general builder — not a gold-plated one. The moat and the money come from what we layer on top _later_ (logic/quiz/calculator forms, forms that take payments, forms that trigger workflows). So:

- Ship the **thinnest credible general engine** that a real user would trust with a real form.
- Do **not** spend weeks perfecting general-form niceties. ~8 field types is enough to launch.
- Every architectural decision in v1 must leave the door open for the wedges in §9. Where there's a tension between "perfect v1 polish" and "clean extension point," choose the extension point.

Freemium from day one: generous free tier, a few things behind a paywall (see §8).

---

## 2. Stack

**Frontend** (carries over from prior work — don't re-litigate):

- Vue 3 (`<script setup>`, Composition API), Vite, TypeScript (strict), Tailwind CSS, Pinia.

**Backend** (we own a real backend this time):

- Node + TypeScript, **Fastify** for the API.
- **Postgres** (Neon). Form schemas stored as `jsonb`; responses stored relationally + `jsonb` answers.
- **Lucia** for auth (don't hand-roll sessions/passwords).
- **Cloudflare R2** for file storage (added when file-upload fields land — not v1 core).
- **Zod** for runtime validation at API boundaries.

**Billing** (when paid tier goes live):

- **Lemon Squeezy or Paddle** as merchant-of-record. Do **not** wire raw Stripe — MoR handles global VAT/GST/sales-tax across jurisdictions, which we are not going to own as a solo operation.

**Repo:** a single git repo with two top-level app directories.

```
Main repo
  ├── frontend     # Vue 3 builder + public renderer
  ├── backend      # Fastify API + the shared form schema (source of truth)
  └── claude.md
```

**Where the shared schema lives.** The form schema (TS types + pure `validateAnswers`)
is the one thing both sides must agree on, so it has exactly one home:
`backend/src/schema`. The backend is the server-side trust boundary, so it owns the
canonical definition. The **frontend imports it** via a Vite path alias (`@schema`) —
it never re-declares or copies it. One definition, two consumers (see §10).

```
frontend/
  src/
    components/        # Ui* primitives, FormRenderer, builder UI
    stores/            # Pinia (thin)
    pages/
  vite.config.ts       # alias @schema -> ../backend/src/schema
backend/
  src/
    schema/            # SHARED: FieldType, Field, FormVersion, validateAnswers — the single source of truth
    routes/            # Fastify route handlers (framework-thin)
    services/          # plain TS business logic, testable without Fastify
    db/                # migrations, queries
    index.ts
```

---

## 3. The one decision everything hangs on: the form schema

The **form schema is the contract** between builder, renderer, validation, storage, and export. It is the only thing that is genuinely painful to change once real forms exist in the wild. Get this right and everything else flows.

### Three non-negotiables (cheap now, agonizing to retrofit)

1. **Immutable field IDs (UUID).** A field's `id` is its identity forever. Responses are keyed by `id`, never by label or position. Renaming or reordering a field must never orphan a single response.
2. **Immutable published versions + versioning.** Publishing snapshots the current schema into a frozen `FormVersion`. Published versions are **never mutated.** Every submission records the `versionId` it was collected under, so old responses always map to the exact schema that produced them.
3. **Label snapshot on submit.** At submission time, denormalize each field's label onto the response (`labelSnapshot`). A CSV export stays human-readable even after the form has been edited or fields deleted.

### Schema types (`backend/src/schema`)

```ts
type FieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "single_select"
  | "multi_select"
  | "dropdown"
  | "multi_dropdown"
  | "date"
  | "rating"
  | "section_break"; // `date` supports single/range via Field.date

interface FieldOption {
  id: string; // stable uuid (selects only)
  label: string;
  value?: string; // defaults to label
  description?: string; // optional helper text shown under the option label
}

interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

interface Field {
  id: string; // IMMUTABLE uuid — the response key, forever
  type: FieldType;
  label: string;
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: FieldOption[]; // select-family only
  validation?: FieldValidation;
  date?: DateConfig; // `date` fields: { mode: 'single'|'range', showPresets, presets[] }
  // RESERVED for the logic wedge (§9). Renderer must already no-op on it
  // so v1 forms are forward-compatible with v2 logic.
  visibleIf?: unknown; // becomes `Condition` in v2
}

interface Theme {
  primaryColor: string;
  fontFamily: string;
  borderRadius: number;
}

interface FormDraft {
  // editable working copy
  id: string;
  ownerId: string;
  title: string;
  fields: Field[];
  theme: Theme;
  updatedAt: string;
}

interface FormVersion {
  // IMMUTABLE — created on publish
  versionId: string;
  formId: string;
  version: number; // monotonic: 1, 2, 3…
  fields: Field[]; // frozen
  theme: Theme;
  publishedAt: string;
}

interface Submission {
  id: string;
  formId: string;
  versionId: string; // schema version collected under
  answers: Record<string, unknown>; // keyed by Field.id
  labelSnapshot: Record<string, string>; // Field.id -> label at submit time
  meta: { submittedAt: string; ip?: string; userAgent?: string };
}
```

### Validation lives here, used by BOTH sides

`backend/src/schema` exports a **pure** `validateAnswers(version: FormVersion, answers): ValidationResult`. The client uses it for instant feedback; the server uses the _same_ function as the trust boundary. One source of truth — never two divergent validators. The client validator is UX; the **server re-validates every submission** and is authoritative. Never trust the client.

---

## 4. Build order — renderer BEFORE builder

Counterintuitive but correct. A schema-driven renderer that eats a hand-written form JSON and produces a working, validating, submittable form proves the entire model end-to-end _before_ any drag-and-drop exists — and it guarantees builder and renderer can never drift, because **the builder is just a UI that emits the JSON the renderer already consumes.** (This is the design-system instinct: schema is the props contract, renderer is the dumb consumer.)

1. **`backend/src/schema`** — TS types + `validateAnswers`. Zero runtime deps. Build and test this first, in isolation.
2. **Schema-driven renderer** — `<FormRenderer :version="FormVersion" />` in `frontend`. Renders every field type, runs client validation, emits a submission payload. Test by hand-authoring `FormVersion` JSON fixtures. **No builder yet.**
3. **Builder UI** — field palette, drag/reorder, per-field config panel, live preview (which is literally `<FormRenderer>` fed the draft). Emits `FormDraft`. Pinia holds builder state.
4. **Persistence + submissions + responses** — API, Postgres, public submit endpoint, responses table view, CSV export.
5. **Auth + freemium gate** — Lucia, plan/limits, the paywall.

Do not start step _n+1_ until step _n_ works end to end.

---

## 5. Data model (Postgres)

```sql
users          (id uuid pk, email citext unique, plan text default 'free', created_at timestamptz)
forms          (id uuid pk, owner_id uuid fk, title text,
                current_draft jsonb,           -- the editable FormDraft
                published_version_id uuid null, -- -> form_versions.id
                created_at, updated_at)
form_versions  (id uuid pk, form_id uuid fk, version int,
                schema jsonb,                  -- frozen Field[]
                theme jsonb, published_at timestamptz)   -- IMMUTABLE rows
submissions    (id uuid pk, form_id uuid fk, version_id uuid fk,
                answers jsonb,                 -- keyed by Field.id
                label_snapshot jsonb,
                submitted_at timestamptz, meta jsonb)
```

- `form_versions` rows are **insert-only**. No updates, ever.
- Index `submissions(form_id, submitted_at)` for the responses view.
- CSV export = union of field ids across the form's versions, headers from `label_snapshot`, one row per submission.

---

## 6. API (Fastify)

```
# Authenticated (owner)
POST   /api/forms                       create
GET    /api/forms                       list
GET    /api/forms/:id                   get draft
PATCH  /api/forms/:id                   update draft (autosave)
POST   /api/forms/:id/publish           snapshot draft -> new form_version, set published_version_id
DELETE /api/forms/:id
GET    /api/forms/:id/submissions       list responses
GET    /api/forms/:id/submissions.csv   export

# Public (no auth)
GET    /api/f/:formId                    returns the PUBLISHED FormVersion for the renderer
POST   /api/f/:formId/submissions        validate (server-side) against published version, store
```

- Public submit handler: load the published `FormVersion`, run `validateAnswers`, reject on failure, write `labelSnapshot` from that version. Rate-limit this endpoint.
- All boundary payloads parsed with Zod before they touch logic.

---

## 7. Conventions

- **Components use the `Ui` prefix** (`UiButton`, `UiField`, `UiTextInput`, `UiSelect`…) for design-system primitives. The prefix also satisfies Vue's multi-word component-name rule, avoiding collisions with native HTML elements. Build a small set of primitives first; the renderer and builder both consume them.
- `<script setup lang="ts">` everywhere. TS `strict: true`. No `any` without a `// reason:` comment.
- The `backend/src/schema` types are the **only** definition of field shapes. Never redeclare a `Field` shape in `frontend` — import it via the `@schema` alias.
- Pinia stores are thin; business logic that's shared (validation, schema migration) lives in `backend/src/schema`, not in a store.
- Keep the `backend` framework-thin: routes call services; services are plain TS and testable without Fastify.
- Commit messages: imperative, scoped (`renderer: add date field`, `schema: reserve visibleIf`).

### Design system — design is a feature, not a coat of paint

We compete on trust and polish. A stranger has to feel safe typing real data into a
form we rendered; a creator has to feel the builder is a serious tool. So design is a
first-class concern, built as a reusable system — not styled per screen.

**Direction: calm & credible, professional.** Soft surfaces, comfortably rounded
corners, an emerald brand accent on cool slate neutrals with neutral-gray edges,
generous spacing, gentle elevation, and subtle motion (~150–200ms ease).
Approachable, but never toy-like — a stranger has to feel safe typing real data
into it. Cyan is the secondary accent (data, informational emphasis); it never
takes the primary action.

**Custom components only — no raw browser controls.** Every interactive element in our
surface is a styled `Ui*` primitive that consumes tokens. Native `<select>`, checkbox,
radio, and file inputs must be visually replaced (custom chevron, custom check/radio
marks, custom rating), never shipped with default browser chrome. If it looks like an
unstyled HTML element, it's a bug.

**Tokens are the single source of visual truth.** Colors, typography, spacing, radius,
shadow, and motion live as design tokens (Tailwind theme + CSS variables in
`frontend/src/styles/tokens.css`). Components reference tokens, never hardcoded hex.
Retuning the brand = editing tokens, not hunting through components.

**Two theme layers — keep them separate (this is architectural, not cosmetic):**

1. **Product theme** — _our_ brand. Fixed tokens used by all app chrome (builder,
   dashboard, buttons, panels). This is where "professionalism" is expressed.
2. **Form theme** — the _end-user's_ per-form styling (`FormVersion.theme`:
   `primaryColor`, `fontFamily`, `borderRadius`). `FormRenderer` applies it via CSS
   variables **scoped to the rendered form only**. Its defaults derive from product
   tokens, but a creator overrides them per form.
   - Never let form-theme variables leak into product chrome, and never bake our brand
     into the form output. The renderer must theme purely from `FormVersion.theme`.

**Accessibility is part of polish:** visible focus rings (`focus-visible`), real labels,
full keyboard operability, and ARIA on custom controls. A custom checkbox that a
keyboard can't toggle is not done.

**Icon & muted-text defaults (apply unless a case calls for otherwise):**

- Icons default to `h-5 w-5`. Only deviate when a specific size is required.
- Lighter / muted text defaults to `gray-500`. Only use a different color when the
  design specifically needs one.

---

## 8. Freemium gate (v1)

Centralize all limits in one `limits.ts` — never scatter plan checks.

- **Free:** unlimited forms, N responses/month (start at 100), the core field types, a small "Made with —" badge on public forms.
- **Paid:** remove the badge, file-upload fields, higher/unlimited responses, (custom domains later).

Gate is a single middleware + the central limits map. The badge-removal + file-uploads + response cap is the standard, proven shape — don't get clever for v1.

---

## 9. Future wedges — leave the door open, don't build them yet

These are _post-v1_. Listed so v1 doesn't accidentally wall them off:

- **Logic / quiz / calculator** (likely first wedge): activate the reserved `Field.visibleIf` into a real `Condition` type; renderer evaluates conditions to show/hide/score. The renderer already ignores `visibleIf` in v1, so v1 forms stay valid.
- **Forms that take payments:** a `payment` field type + MoR integration; `FormVersion` gains pricing config.
- **Forms that do something:** post-submission actions (webhooks, email, approvals) keyed off a submission-created event. Keep submission writes in a place where emitting an event later is trivial.
- **Template marketplace:** grow the static catalog (`backend/src/data/templates.ts`) into an ecosystem — richer metadata (tags, cover image, difficulty, industries), real usage counts instead of the curated `badge`/`stat` labels, favorites, "save my form as a template", then community/company publishing. The seam is already right: a template is just `Field[]` + metadata, the same JSON the builder emits, so user-published templates need no schema work. Don't start before there's traffic — a marketplace needs a market, and community publishing drags in moderation and an org/teams ownership model. Cheapest first step when the time comes: count instantiations on the from-template endpoint and feed `stat` from data.

When you build a wedge, it rides on the _same_ engine — that's the whole reason general-core comes first.

---

## 10. Hard DON'Ts (these are the known failure modes)

- ❌ Don't gold-plate the v1 general builder. Credible, not exhaustive. Ship.
- ❌ Don't key responses by label or position — only by immutable `Field.id`.
- ❌ Don't mutate a published `FormVersion`. Publishing always inserts a new version.
- ❌ Don't trust client validation — the server re-validates with the same shared function.
- ❌ Don't hand-roll auth — use Lucia.
- ❌ Don't wire raw Stripe for tax — use a merchant-of-record.
- ❌ Don't build logic/payments/workflows in v1 — only reserve their seams.
- ❌ Don't let two definitions of the schema exist. `backend/src/schema` (imported by the frontend via `@schema`) or nothing.
- ❌ Don't use Em dash (—) anywhere in the app. Not in the comments, nor in the UI.

---

## 11. Commands

Each app manages its own dependencies. Run commands from within `frontend/` or `backend/`.

```bash
# backend/  (owns the shared schema — build/test it first)
pnpm i                  # install backend deps
pnpm test               # schema + api tests
pnpm dev                # Fastify API
pnpm migrate            # run db migrations

# frontend/
pnpm i                  # install frontend deps
pnpm dev                # Vue app (Vite; @schema alias -> ../backend/src/schema)
```

---

## 12. Definition of done for v1

A real user can: sign up → build a form with ~8 field types and required/validation rules → publish it → share a public link → have a stranger fill and submit it on mobile and desktop → see responses in a table → export CSV → and the free/paid gate works. Nothing more. That's the launch line.
