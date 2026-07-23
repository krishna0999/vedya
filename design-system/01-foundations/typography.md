# Typography

How text looks and behaves across the product. One typeface, one scale, applied
by role — never ad-hoc font sizes in components (Principle 6/9). This is the
companion to the type values in [design-tokens](design-tokens.md); config wins on
any disagreement.

Related: [design-tokens](design-tokens.md) · [colors.md](colors.md) · [design-principles](design-principles.md)

---

## Font families

One brand face, with a system fallback stack. Set on `html` and exposed as
`font-sans`.

```
Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
```

- **Inter** — the brand face. Warm, highly legible, excellent at small sizes —
  the right feel for "professional but approachable."
- **System stack** — fallback while Inter loads / if it fails, so text never
  renders blank.
- `html` also sets `-webkit-font-smoothing: antialiased` and
  `text-rendering: optimizeLegibility`.

**No second family.** No serif, no display face. If code ever needs monospace
(rare — e.g. an ID or JSON preview), use the Tailwind `font-mono` default; it is
not a brand face.

**Form-theme font `(planned)`** — `FormVersion.theme.fontFamily` will drive a
`--fb-font` var scoped to `FormRenderer`. Product chrome always uses Inter
regardless of a form's font (Principle 10).

---

## Font weights

Inter ships many weights; we use four. More weights = muddier hierarchy.

| Weight       | Class           | Use                                 |
| ------------ | --------------- | ----------------------------------- |
| 400 Regular  | `font-normal`   | body, secondary text                |
| 500 Medium   | `font-medium`   | labels, buttons, emphasized inline  |
| 600 Semibold | `font-semibold` | headings, section titles            |
| 700 Bold     | `font-bold`     | rare — strong numeric/stat emphasis |

Prefer weight + size for hierarchy over color. Don't use `font-light` (300) — it
hurts legibility at body sizes.

---

## Font sizes

Uses **Tailwind's default type scale** (rem-based) — we have not overridden it, so
this _is_ our scale.

| Class       | Size     | ~px | Line-height (default) |
| ----------- | -------- | --- | --------------------- |
| `text-xs`   | 0.75rem  | 12  | 1rem (16)             |
| `text-sm`   | 0.875rem | 14  | 1.25rem (20)          |
| `text-base` | 1rem     | 16  | 1.5rem (24)           |
| `text-lg`   | 1.125rem | 18  | 1.75rem (28)          |
| `text-xl`   | 1.25rem  | 20  | 1.75rem (28)          |
| `text-2xl`  | 1.5rem   | 24  | 2rem (32)             |
| `text-3xl`  | 1.875rem | 30  | 2.25rem (36)          |
| `text-4xl`  | 2.25rem  | 36  | 2.5rem (40)           |

`text-base` (16px) is the floor for any text a user reads at length. `text-xs`
(12px) is for meta/captions only, never body.

---

## Line heights

Default to the size's paired line-height above. Override only for these cases:

| Class             | Value | Use                                 |
| ----------------- | ----- | ----------------------------------- |
| `leading-tight`   | 1.25  | large headings (`text-2xl`+)        |
| `leading-snug`    | 1.375 | multi-line labels, compact UI       |
| `leading-normal`  | 1.5   | body default                        |
| `leading-relaxed` | 1.625 | long-form help / description blocks |

Bigger text → tighter leading; smaller/long text → looser. Single-line UI (labels,
buttons) can ignore leading.

---

## Letter spacing

Inter is well-spaced by default — leave body text alone.

| Class            | Value   | Use                                   |
| ---------------- | ------- | ------------------------------------- |
| (default)        | 0       | all body, labels, buttons             |
| `tracking-tight` | -0.01em | large display headings (`text-3xl`+)  |
| `tracking-wide`  | 0.05em  | ALL-CAPS eyebrows / small caps labels |

Never track normal-case body text. Only ALL-CAPS strings (rare) get `tracking-wide`
for readability.

---

## Heading scale

Semantic hierarchy — pick by _role_, not by which size looks nice. Headings are
`font-semibold`, `ink-800`/`ink-900`.

| Role               | Recipe                                                     | Element    |
| ------------------ | ---------------------------------------------------------- | ---------- |
| Display / hero     | `text-3xl font-semibold tracking-tight leading-tight`      | `h1`       |
| Page title         | `text-2xl font-semibold leading-tight`                     | `h1`       |
| Section title      | `text-lg font-semibold`                                    | `h2`       |
| Subsection         | `text-base font-semibold`                                  | `h3`       |
| Eyebrow / overline | `text-xs font-medium uppercase tracking-wide text-ink-500` | `p`/`span` |

One `h1` per screen. Don't skip levels for size — restyle the correct level.

---

## Body text

| Role                   | Recipe                                              |
| ---------------------- | --------------------------------------------------- |
| Body (default)         | `text-base text-ink-900`                            |
| Body secondary         | `text-sm text-ink-500`                              |
| Long-form / help block | `text-sm text-ink-600 leading-relaxed`, `max-w-2xl` |
| Emphasized inline      | `font-medium` (not color)                           |

Cap reading measure at `max-w-2xl` (~65ch) for comfort. Body never goes below
`text-sm`.

---

## Labels

Form and control labels — the workhorse of a form builder.

| Role                       | Recipe                             |
| -------------------------- | ---------------------------------- |
| Field label                | `text-sm font-medium text-ink-900` |
| Optional/hint beside label | `text-xs text-ink-500`             |
| Required marker            | `text-danger` `*` after label      |
| Toggle / checkbox label    | `text-sm text-ink-800`             |

Every input has a real `<label>` (accessibility). Labels sit above the field
(single-column forms).

---

## Captions

Smallest text — supporting, never essential-only.

| Role                 | Recipe                 |
| -------------------- | ---------------------- |
| Helper / description | `text-sm text-ink-500` |
| Caption / meta       | `text-xs text-ink-500` |
| Timestamp / count    | `text-xs text-ink-500` |
| Error caption        | `text-sm text-danger`  |

`text-xs` is the absolute floor and only for genuinely secondary info. Don't hide
required instructions in a caption.

---

## Buttons

Button text is `font-medium`, single-line, no letter-spacing.

| Size    | Recipe                                      |
| ------- | ------------------------------------------- |
| Small   | `text-sm font-medium`                       |
| Default | `text-sm font-medium` (with larger padding) |
| Large   | `text-base font-medium`                     |

- Sentence case ("Save changes"), not Title Case or ALL CAPS.
- Text color: white on `brand-600`; `ink-800` on secondary; `brand-600` on ghost.
- Never wrap button labels — keep them short.

---

## Forms

The renderer is where typography earns trust — a stranger reads this on a phone.

| Element               | Recipe                             |
| --------------------- | ---------------------------------- |
| Field label           | `text-sm font-medium text-ink-900` |
| Input text            | `text-base text-ink-900`           |
| Placeholder           | `text-base text-ink-400`           |
| Field description     | `text-sm text-ink-500`             |
| Inline validation     | `text-sm text-danger`              |
| Section break title   | `text-lg font-semibold`            |
| Form title (renderer) | `text-2xl font-semibold`           |

**Input text is `text-base` (16px) deliberately** — smaller triggers iOS
zoom-on-focus and reads as cramped. Don't shrink inputs.

---

## Tables

Responses table (dashboard). Dense but scannable.

| Element                 | Recipe                                                     |
| ----------------------- | ---------------------------------------------------------- |
| Column header           | `text-xs font-medium uppercase tracking-wide text-ink-500` |
| Cell                    | `text-sm text-ink-800`                                     |
| Numeric cell            | `text-sm tabular-nums text-ink-800` (right-aligned)        |
| Muted cell (empty/meta) | `text-sm text-ink-400`                                     |
| Row count / footer      | `text-xs text-ink-500`                                     |

Use `tabular-nums` for any column of numbers so digits align. Keep headers quiet;
let data be the focus.

---

## Responsive typography

Mobile-first. Body sizes stay constant across breakpoints (16px is right
everywhere); only large headings scale up.

| Role                   | Mobile      | `md`+         |
| ---------------------- | ----------- | ------------- |
| Display                | `text-2xl`  | `md:text-3xl` |
| Page title             | `text-xl`   | `md:text-2xl` |
| Section title          | `text-base` | `md:text-lg`  |
| Body / labels / inputs | unchanged   | unchanged     |

- **Never shrink body or input text on mobile** — 16px is the floor everywhere
  (readability + iOS zoom).
- Scale only headings, and only up, using `md:`/`lg:` prefixes.
- Tighten heading leading (`leading-tight`) so large text doesn't over-space on
  narrow screens.

---

## Usage examples

**Field (renderer):**

```html
<label class="text-sm font-medium text-ink-900">
  Email <span class="text-danger">*</span>
</label>
<input
  class="text-base text-ink-900 placeholder:text-ink-400"
  placeholder="you@example.com"
/>
<p class="text-sm text-ink-500">We'll only use this to send your receipt.</p>
<p class="text-sm text-danger">Enter a valid email.</p>
```

**Card header:**

```html
<h2 class="text-lg font-semibold text-ink-900">Recent responses</h2>
<p class="text-sm text-ink-500">Updated just now</p>
```

**Primary button:**

```html
<button class="text-sm font-medium text-white bg-brand-600">
  Publish form
</button>
```

**Table header + cell:**

```html
<th class="text-xs font-medium uppercase tracking-wide text-ink-500">
  Submitted
</th>
<td class="text-sm text-ink-800 tabular-nums">2026-07-23</td>
```

---

**Rules of thumb:** one typeface; four weights; `text-base` floor for read-at-
length text; hierarchy from size+weight, not color; scale headings up on `md:`,
never scale body down.
