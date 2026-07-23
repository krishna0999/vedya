# Colors

The full color system. Every color in the product resolves to a token here — no
raw hex in components (Principle 9). This is the human-readable companion to the
values in [design-tokens](design-tokens.md); when they disagree, the config files
(`tailwind.config.js`, `tokens.css`) win.

Related: [design-tokens](design-tokens.md) · [design-principles](design-principles.md)

---

## Brand colors

Our identity is **indigo/violet** on a **warm, slightly violet-tinted neutral**.
The combination reads as *warm & approachable, professional* — Notion/Typeform
warmth with product precision. Two families carry it:

- **Brand (indigo/violet)** — action, identity, focus.
- **Ink (warm neutral)** — everything structural: surfaces, borders, text.

Semantic colors (success/warn/danger) are used sparingly and only for meaning,
never decoration.

> **Product vs form brand:** the brand scale is *our* chrome only. A creator's
> per-form accent comes from `FormVersion.theme.primaryColor` (`--fb-primary`),
> applied scoped to the rendered form. Our indigo never bakes into a published
> form (Principle 10).

---

## Primary palette

**Brand — indigo/violet.** `brand-600` is the default action color.

| Token | Hex | Role |
|---|---|---|
| `brand-50`  | `#eef2ff` | tint background (selected row, subtle fill) |
| `brand-100` | `#e0e7ff` | hover fill on brand-tinted surfaces |
| `brand-200` | `#c7d2fe` | soft accents, borders on tinted surfaces |
| `brand-300` | `#a5b4fc` | disabled brand button |
| `brand-400` | `#818cf8` | secondary accent, icon on tint |
| `brand-500` | `#6366f1` | focus ring color (`shadow-focus`) |
| `brand-600` | `#4f46e5` | **primary action** (button bg, active link) |
| `brand-700` | `#4338ca` | primary hover / pressed |
| `brand-800` | `#3730a3` | pressed on dark, high-emphasis |
| `brand-900` | `#312e81` | deepest accent, rare |

Primary button: `bg-brand-600` → hover `bg-brand-700` → focus adds
`shadow-focus`.

---

## Secondary palette

We deliberately run **no separate secondary color family** — a second accent
competes with the primary and erodes the "one loud action" rule (Principle 1).
"Secondary" is expressed through **hierarchy**, not a new hue:

| Role | Treatment |
|---|---|
| Secondary button | `bg-ink-100` text `ink-800`, hover `bg-ink-200` |
| Tertiary / ghost button | transparent, text `ink-700`, hover `bg-ink-100` |
| Secondary link | `text-ink-700` underline on hover |
| Brand-tinted secondary | `bg-brand-50` text `brand-700` (soft brand emphasis) |

If a genuine second accent is ever needed (e.g. a chart categorical scale), add it
as a *purpose-named* scale (see [design-tokens](design-tokens.md) "Future token
guidelines") — never a loose second brand color.

---

## Neutral palette

**Ink — warm neutral** (slightly violet-tinted grays). The structural backbone.

| Token | Hex | Role |
|---|---|---|
| `ink-50`  | `#faf9fb` | app background |
| `ink-100` | `#f5f3f7` | subtle surface, hover fill, secondary button |
| `ink-200` | `#eceaf1` | raised card surface, divider |
| `ink-300` | `#dcd9e3` | default border |
| `ink-400` | `#b8b4c2` | placeholder, disabled text, disabled icon |
| `ink-500` | `#918d9c` | **muted / secondary text** (default muted) |
| `ink-600` | `#6c6878` | secondary body text |
| `ink-700` | `#514e5c` | strong body / tertiary button text |
| `ink-800` | `#343240` | headings |
| `ink-900` | `#1d1b26` | **primary text** |

---

## Semantic colors

Used **only to convey state/meaning**, never as decoration or brand. Each is one
solid token today; soft-tint backgrounds are **`(planned)`** — compose with alpha
(`bg-danger/10`) until the scale exists.

### Success

| | |
|---|---|
| Token | `success` = `#16a34a` |
| Means | valid input, saved, confirmed, positive delta |
| Use | check icons, valid-field indicator, success toast |
| Tint `(planned)` | `success-50` for success banners; today `bg-success/10` |

### Warning

| | |
|---|---|
| Token | `warn` = `#d97706` |
| Means | caution, approaching a limit, needs attention (non-blocking) |
| Use | at-limit response-cap notice, "unsaved changes" |
| Tint `(planned)` | `warn-50`; today `bg-warn/10` |

### Error

| | |
|---|---|
| Token | `danger` = `#dc2626` |
| Means | invalid input, failed action, destructive |
| Use | inline validation message, error toast, delete button |
| Tint `(planned)` | `danger-50` for error-field fill; today `bg-danger/10` |

### Info

We have **no dedicated info color** — informational emphasis uses **brand**
(`brand-600` / `bg-brand-50`), keeping the palette tight. An info callout is a
brand-tinted surface, not a fourth semantic hue.

> Never rely on color alone to signal state (accessibility). Pair semantic color
> with an icon and/or text.

---

## Background colors

The furthest-back layer, behind surfaces.

| Role | Token | Use |
|---|---|---|
| App background | `ink-50` (`#faf9fb`) | `body`, main canvas behind cards |
| Subtle background | `ink-100` | inset areas, code blocks, wells |
| Brand-tinted background | `brand-50` | selected/active regions |
| Scrim (modal) | `ink-900 / 60%` (`bg-ink-900/60`) | behind modals & drawers |

---

## Surface colors

Raised elements sitting on the background. Elevation comes from color **and**
shadow together.

| Surface | Fill | Shadow |
|---|---|---|
| Card / panel | white (`#ffffff`) | `shadow-card` |
| Raised / hover card | white or `ink-50` | `shadow-card` |
| Popover / dropdown | white | `shadow-pop` |
| Modal | white | `shadow-pop` |
| Inline well / inset | `ink-100` | none |

Surfaces are white by default so content and the warm `ink-50` canvas provide
gentle contrast without heavy borders.

---

## Border colors

Keep borders quiet — prefer surface + elevation over strong outlines.

| Role | Token |
|---|---|
| Default border | `ink-300` |
| Subtle divider | `ink-200` |
| Strong / emphasis border | `ink-400` |
| Focused input | `brand-600` (+ `shadow-focus`) |
| Error input | `danger` |
| Success input | `success` |

---

## Text colors

| Role | Token | Notes |
|---|---|---|
| Primary text | `ink-900` | headings & body default |
| Heading | `ink-800`–`ink-900` | |
| Secondary body | `ink-600` | longer secondary copy |
| Muted / helper | `ink-500` | **default muted** — helper text, captions |
| Placeholder / disabled | `ink-400` | |
| Link | `brand-600` | hover `brand-700` |
| On-brand (text on `brand-600`) | white | |
| Error text | `danger` | inline validation |
| Success text | `success` | |

---

## Dark theme colors

**Status: `(planned)` — not implemented yet.** No dark tokens ship today; the
product is light-only. This section is the *intended* map so future work has a
target and new tokens are designed to swap cleanly.

**Approach:** introduce semantic aliases (`--surface`, `--surface-raised`,
`--bg`, `--text`, `--text-muted`, `--border`) that resolve to light values now and
swap under `prefers-color-scheme: dark` / a `data-theme="dark"` root — *not*
per-component overrides.

Proposed dark mapping (invert the ink ramp; desaturate brand slightly for glare):

| Role | Light | Dark (proposed) |
|---|---|---|
| App background | `ink-50` | `#151320` (near `ink-900`) |
| Surface | `#ffffff` | `#201e2b` |
| Raised surface | `ink-50` | `#2a2836` |
| Border | `ink-300` | `#3a3747` |
| Primary text | `ink-900` | `#f5f3f7` (`ink-100`) |
| Muted text | `ink-500` | `#9d99a8` |
| Brand action | `brand-600` | `brand-500` (`#6366f1`) |
| Focus ring | `brand-500/35` | `brand-400/45` |

When built, dark mode is a **token concern**, resolved centrally — see
[design-tokens](design-tokens.md) "Future token guidelines". The end-user form
theme stays independent of product dark mode.

---

## Contrast rules

Accessibility is polish, not optional (Principle 12 / accessibility philosophy).
Target **WCAG AA**.

- **Body text ≥ 4.5:1** against its background. `ink-900` on `ink-50`/white and
  `ink-600` on white both pass comfortably.
- **Large text (≥18px / ≥14px bold) ≥ 3:1.**
- **Muted text floor:** `ink-500` on white is the lightest text permitted for
  meaningful copy. Never go lighter (`ink-400` is placeholder/disabled only, and
  disabled text is exempt from AA).
- **Non-text (borders, icons, focus rings) ≥ 3:1** where they carry meaning.
- **White on brand:** white text requires `brand-600` or darker. Do **not** put
  white on `brand-500` or lighter.
- **Never signal by color alone** — pair with icon/text/shape.
- **Form theme:** a creator's `primaryColor` may fail contrast. The renderer must
  check the chosen color against white/its surface and **warn the creator** (and
  auto-pick an accessible text color on the accent) rather than ship an
  inaccessible form.

---

## Color usage guidelines

- **One loud thing per screen.** `brand-600` marks *the* primary action. If two
  things are brand-colored, neither reads as primary (Principle 1).
- **Neutral by default, color for meaning.** Most of the UI is ink. Reach for
  brand only for action/identity, semantic only for state.
- **Tint, don't shout.** For emphasis prefer a soft tint (`brand-50`,
  `bg-danger/10`) over a saturated fill.
- **Elevation = color + shadow together**, not borders. Let `shadow-card` /
  `shadow-pop` do the lifting.
- **Compose alpha for one-offs** (`bg-ink-900/60`, `bg-danger/10`) rather than
  adding a near-duplicate token.
- **Respect the layers.** Product tokens for chrome; `--fb-*` for form output.
  They never cross.

---

## Do's & Don'ts

**Do**

- ✅ Use `brand-600` for the single primary action; `brand-700` for its hover.
- ✅ Use `ink-500` for muted/helper text — it's the muted default.
- ✅ Pair semantic color with an icon or label so meaning survives color-blindness.
- ✅ Build surfaces from white + `shadow-card`, backgrounds from `ink-50`.
- ✅ Add a *purpose-named* scale when you truly need a new color.

**Don't**

- ❌ Hardcode hex in a component — always a token.
- ❌ Introduce a second brand/accent hue for "variety."
- ❌ Use `success/warn/danger` decoratively — they mean state.
- ❌ Put white text on `brand-500` or lighter (fails contrast).
- ❌ Use `ink-400` for real text (placeholder/disabled only).
- ❌ Signal errors or status with color alone.
- ❌ Let `brand-*` leak into a rendered form, or `--fb-*` into product chrome.
