# Spacing

How we use space. Space is a design element, not leftover room (Principle 3) —
generous, consistent spacing is what makes a stranger trust a form with real data.
Every gap comes from the scale below; never an arbitrary pixel value. Companion to
the spacing section in [design-tokens](design-tokens.md).

Related: [design-tokens](design-tokens.md) · [typography.md](typography.md) · [design-principles](design-principles.md)

---

## 8pt grid system

Layout rhythm is built on an **8-point grid** — the primary spacing values are
multiples of 8 (8, 16, 24, 32, 48…). This keeps everything aligned and calm, and
maps cleanly to Tailwind's scale (`gap-2` = 8px, `gap-4` = 16px, `gap-6` = 24px).

**4px is the half-step.** Tailwind's scale is 4px-based, so odd steps (`1` = 4px,
`3` = 12px) exist for *fine* adjustments — icon-to-text gaps, tight control
padding. Rule of thumb:

- **Layout & structure → 8pt multiples** (`2`, `4`, `6`, `8`, `12`).
- **Fine detail inside a component → 4px half-steps** (`1`, `3`) only when 8pt is
  too coarse.

If you reach for a value that isn't on the scale, the answer is a scale value, not
a new number.

---

## Spacing scale

Tailwind's default scale (1 unit = 4px). The values we actually use:

| Step | px | Grid | Typical use |
|---|---|---|---|
| `0.5` | 2  | ¼ | hairline nudge (rare) |
| `1`   | 4  | ½ | icon↔text gap, tightest padding |
| `2`   | 8  | ● | inside small controls, chip padding |
| `3`   | 12 | ½ | control padding (input y-padding) |
| `4`   | 16 | ● | **default gap** between elements |
| `5`   | 20 | — | input x-padding, medium gap |
| `6`   | 24 | ● | card padding, gap between fields |
| `8`   | 32 | ● | gap between groups |
| `10`  | 40 | — | large internal gap |
| `12`  | 48 | ● | section rhythm |
| `16`  | 64 | ● | major page section separation |

● = on the 8pt grid (preferred). Reach for these first.

---

## Margins

- **Vertical rhythm via `space-y-*`**, not per-element margins — set the gap once
  on the parent, don't sprinkle `mt-`/`mb-` on children (avoids collapsing-margin
  surprises and drift).
- **Between stacked elements:** `space-y-4` default; `space-y-6` for looser
  sections.
- **Section separation:** `space-y-8` / `space-y-12` between major blocks.
- **Auto margins for layout** (`mx-auto` to center a `max-w-*` container) are
  fine; avoid negative margins except for deliberate overlap.

## Padding

- **Interactive controls** get comfortable, tappable padding (see per-context
  sections below). Touch targets ≥ 40px tall.
- **Containers** (cards, panels) use even padding — `p-6` default.
- **Symmetric unless intentional.** Don't eyeball `pt-3 pb-2`; if top and bottom
  differ there should be a reason (e.g. optical alignment with a heading).
- Horizontal input padding slightly exceeds vertical (`px-4 py-3`) — reads better
  than square.

---

## Section spacing

| Context | Gap |
|---|---|
| Between related items in a group | `space-y-4` (16) |
| Between subsections | `space-y-6` (24) |
| Between major page sections | `space-y-8`–`space-y-12` (32–48) |
| Page top/bottom padding | `py-8` (32) mobile, `py-12` (48) desktop |
| Content max width | `max-w-2xl` (forms), `max-w-6xl` (dashboards) |

Grouping is meaning: tight space = "these belong together," wide space = "separate
idea." (Proximity does more than dividers.)

---

## Card spacing

| Property | Value |
|---|---|
| Padding | `p-6` (24) — `p-4` for dense/compact cards |
| Gap between cards (grid) | `gap-4`–`gap-6` |
| Internal header↔body gap | `space-y-4` |
| Header↔meta line gap | `space-y-1` (4) |
| Card radius / shadow | `rounded-lg shadow-card` (see [colors.md](colors.md)) |

Keep padding equal on all sides so the card feels balanced.

---

## Form spacing

The renderer's most important spacing — a form has to feel calm and unhurried.

| Element | Value |
|---|---|
| Between fields | `space-y-6` (24) |
| Label ↔ input | `space-y-1.5` (6) — snug, they're one unit |
| Input ↔ description/error | `mt-1.5` (6) |
| Input padding | `px-4 py-3` (16 × 12) |
| Input min height | 44px (comfortable touch target) |
| Section break spacing | `space-y-8` (32) above/below |
| Submit button top gap | `mt-8` (32) |
| Form container | `max-w-2xl mx-auto`, single column |

Fields are **single-column, always** — never side-by-side (readability + mobile
parity). Generous `space-y-6` between fields keeps the form from feeling like a
questionnaire wall.

---

## Dashboard layout spacing

| Region | Value |
|---|---|
| Page padding | `px-6 py-8` mobile, `px-8 py-12` desktop |
| Content max width | `max-w-6xl mx-auto` |
| Header ↔ content | `space-y-8` |
| Between dashboard sections | `space-y-8`–`space-y-12` |
| Card grid gap | `gap-6` |
| Table row padding | `px-4 py-3` per cell |
| Table header ↔ first row | shared border, no extra gap |

Dashboards can be denser than forms — data is the point — but keep section rhythm
on the 8pt grid.

---

## Builder layout spacing

Three-region editor: field palette · canvas · config panel.

| Region | Value |
|---|---|
| Region gutters (between panels) | `gap-6` or a 1px divider + `px-6` |
| Palette item padding | `px-3 py-2` |
| Palette item gap | `space-y-1` |
| Canvas padding | `p-6`–`p-8` (canvas is a live preview — mirror renderer feel) |
| Canvas field gap | matches form spacing (`space-y-6`) so preview = output |
| Config panel padding | `p-6` |
| Config field group gap | `space-y-5` |
| Panel section headers | `mt-6` above, `space-y-3` within |

The **canvas spacing must match the renderer's form spacing exactly** — the
builder's preview is literally `<FormRenderer>`, so what the creator sees is what
ships.

---

## Responsive spacing

Mobile-first: tighten outer padding on small screens, expand it up.

| Property | Mobile | `md`+ |
|---|---|---|
| Page horizontal padding | `px-4` | `md:px-8` |
| Page vertical padding | `py-8` | `md:py-12` |
| Section gaps | `space-y-8` | `md:space-y-12` |
| Card padding | `p-4` | `md:p-6` |
| Form field gap | `space-y-6` | unchanged |

- **Don't shrink form/touch spacing on mobile** — controls stay tappable
  (≥44px) and fields keep `space-y-6`. Compress *outer chrome*, not the content a
  finger has to hit.
- Scale outer padding and section rhythm up on larger screens; keep component
  internals constant.

---

## Alignment rules

- **Everything snaps to the grid.** Edges of related elements line up on the same
  vertical axis — labels, inputs, and helper text share a left edge.
- **One text alignment: left.** Body, labels, and form content are left-aligned
  (LTR). Center only short, standalone things (empty states, a modal's single
  message). Never center paragraphs.
- **Numbers right-align** in tables (`tabular-nums`) so digits stack.
- **Optical over mathematical** for icons: nudge an icon a half-step if it *looks*
  off-center next to text, even if the math says centered.
- **Consistent baselines:** items in a row align on their text baseline or center,
  not top — pick one per row and hold it.

---

## White space guidelines

- **White space is intentional, not empty.** Room around an element is what makes
  it feel considered and trustworthy. Resist the urge to fill it.
- **Proximity = relationship.** Put related things close, separate unrelated
  things clearly. Space groups better than borders do — reach for space first, a
  divider only when space alone is ambiguous.
- **Give the primary action room.** Don't crowd the main button; isolation makes
  it read as *the* action (Principle 1).
- **Consistent rhythm beats tight packing.** A predictable vertical rhythm
  (`space-y-6` everywhere similar) feels more professional than cramming more above
  the fold.
- **Let forms breathe.** A calm, spacious form converts better and feels safer than
  a dense one — density reads as "cheap."
- **When unsure, add space.** Crowding is the more common failure than emptiness in
  this product.

---

**Rules of thumb:** 8pt grid for layout, 4px half-steps for fine detail; group
with space before dividers; single-column forms with `space-y-6`; never shrink
touch spacing on mobile; when in doubt, more space.
