# Colors

The full color system. Every color in the product resolves to a token here — no
raw hex in components (Principle 9). This is the human-readable companion to the
values in [design-tokens](design-tokens.md); when they disagree, the config files
(`tailwind.config.js`, `tokens.css`) win.

Related: [design-tokens](design-tokens.md) · [design-principles](design-principles.md)

---

## Brand colors

Our identity is **emerald** on a **cool slate neutral**, with **neutral-gray
edges**. The combination reads as *calm, credible, precise* — confident enough for
someone to trust it with real data. Four families carry it:

- **Brand (emerald)** — action, identity, focus.
- **Secondary (cyan)** — second-series data, informational tints, non-brand emphasis.
- **Ink (slate)** — surfaces and all text.
- **Line (neutral gray)** — borders and rules, and nothing else.

Semantic colors (success/warn/danger) are used sparingly and only for meaning,
never decoration.

> **Product vs form brand:** the brand scale is *our* chrome only. A creator's
> per-form accent comes from `FormVersion.theme.primaryColor` (`--fb-primary`),
> applied scoped to the rendered form. Our emerald never bakes into a published
> form (Principle 10).

---

## Primary palette

**Brand — emerald.** `brand-600` is the default action color.

| Token | Hex | Role |
|---|---|---|
| `brand-50`  | `#ecfdf5` | tint background (selected row, subtle fill) |
| `brand-100` | `#d1fae5` | hover fill on brand-tinted surfaces |
| `brand-200` | `#a7f3d0` | soft accents, borders on tinted surfaces |
| `brand-300` | `#6ee7b7` | focus ring (`ring-brand-300`), disabled brand button |
| `brand-400` | `#34d399` | accent, icon on tint |
| `brand-500` | `#10b981` | focus glow color (`shadow-focus`) |
| `brand-600` | `#047857` | **primary action** (button bg, active link) — 5.5:1 on white |
| `brand-700` | `#065f46` | primary hover / pressed |
| `brand-800` | `#064e3b` | pressed on dark, high-emphasis |
| `brand-900` | `#022c22` | deepest accent, rare |

Primary button: `bg-brand-600` → hover `bg-brand-700` → focus adds
`shadow-focus`.

> **Why 600+ is darker than Tailwind emerald.** True `emerald-600` (`#059669`)
> is only **3.8:1** against white — it fails AA for the white label on a primary
> button. The ramp is pulled one step darker from 600 up so `bg-brand-600` clears
> 4.5:1. Steps 50–500 are stock emerald. Don't "correct" this back.

---

## Secondary palette

**Secondary — cyan.** A real second accent, deliberately narrow in scope. It
never competes for "the action" — that's brand's job (Principle 1) — and it is
**not** what the `secondary` *button* variant uses (that stays a white/bordered
button; see [buttons](../02-components/buttons.md)).

| Token | Hex | Role |
|---|---|---|
| `secondary-50`  | `#ecfeff` | informational tint background |
| `secondary-100` | `#cffafe` | hover on informational tint |
| `secondary-500` | `#06b6d4` | chart accents |
| `secondary-600` | `#0e7490` | second data series, unread/new indicator — 5.4:1 on white |
| `secondary-700` | `#155e75` | hover on secondary fills |

Use it for: the second series in a chart, "new / unread" indicators, and
informational (not success, not warning) emphasis. Same 600+ darkening as brand,
for the same contrast reason.

Button hierarchy is still expressed through **weight, not hue**:

| Role | Treatment |
|---|---|
| Secondary button | white, `border-line-200`, text `ink-800`, hover `bg-ink-50` |
| Tertiary / ghost button | transparent, text `ink-600`, hover `bg-ink-100` |
| Brand-tinted secondary | `bg-brand-50` text `brand-700` |

---

## Neutral palette

**Ink — slate.** Surfaces and all text. Not borders (see below).

| Token | Hex | Role |
|---|---|---|
| `ink-50`  | `#f8fafc` | app background |
| `ink-100` | `#f1f5f9` | subtle surface, hover fill, recessed track |
| `ink-200` | `#e2e8f0` | inset well, chart gridline |
| `ink-300` | `#cbd5e1` | scrollbar thumb, low-emphasis fill |
| `ink-400` | `#94a3b8` | placeholder, disabled text, disabled icon |
| `ink-500` | `#64748b` | **muted / secondary text** (default muted) — 4.8:1 |
| `ink-600` | `#475569` | secondary body text |
| `ink-700` | `#334155` | strong body / tertiary button text |
| `ink-800` | `#1e293b` | headings |
| `ink-900` | `#0f172a` | **primary text**, scrim base |

---

## Line palette

**Line — neutral gray.** Borders and rules only. Kept off the slate ramp so edges
read a touch quieter and warmer than the cool surfaces they separate.

| Token | Hex | Role |
|---|---|---|
| `line-100` | `#f3f4f6` | hairline divider inside a card |
| `line-200` | `#e5e7eb` | **default border** (cards, panels, inputs) |
| `line-300` | `#d1d5db` | form-control border, hover border |
| `line-400` | `#9ca3af` | strong / emphasis border, input hover |

**Never use `line-*` for text, icons, or fills** — it exists so that changing
border weight across the app is one token edit, and mixing it into type would
break that.

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

Informational emphasis uses **secondary (cyan)** — `secondary-600` /
`bg-secondary-50`. It is an *accent*, not a fourth semantic token: "info" here
means neutral news (new responses arrived), never a state that passed or failed.
If it's good news use `success`, if it needs attention use `warn`.

> Never rely on color alone to signal state (accessibility). Pair semantic color
> with an icon and/or text.

---

## Background colors

The furthest-back layer, behind surfaces.

| Role | Token | Use |
|---|---|---|
| App background | `ink-50` (`#f8fafc`) | `body`, main canvas behind cards |
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

Surfaces are white by default so content and the cool slate `ink-50` canvas provide
gentle contrast without heavy borders.

---

## Border colors

Keep borders quiet — prefer surface + elevation over strong outlines.

| Role | Token |
|---|---|
| Default border | `line-200` |
| Form-control border | `line-300` |
| Subtle divider | `line-100` |
| Strong / emphasis border | `line-400` |
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
| App background | `ink-50` | `#0f172a` (`ink-900`) |
| Surface | `#ffffff` | `#1e293b` (`ink-800`) |
| Raised surface | `ink-50` | `#334155` (`ink-700`) |
| Border | `line-200` | `#334155` |
| Primary text | `ink-900` | `#f1f5f9` (`ink-100`) |
| Muted text | `ink-500` | `#94a3b8` (`ink-400`) |
| Brand action | `brand-600` | `brand-500` (`#10b981`) — lighter, since 600 is too dark on a dark surface |
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
