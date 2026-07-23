# Design Tokens

The single source of visual truth. Every color, size, space, and duration in the
product comes from a token — never a hardcoded literal in a component
(Principle 9). Retuning the brand is an edit here, not a hunt through components.

Related: [design-principles](design-principles.md) · [product-personality](product-personality.md)

---

## Introduction

Tokens live in two places that must stay in sync:

- **`frontend/tailwind.config.js`** — colors, radius, shadow, font, easing exposed
  as Tailwind utilities (`bg-brand-600`, `rounded-lg`, `shadow-card`).
- **`frontend/src/styles/tokens.css`** — CSS custom properties for values that are
  runtime-themed or referenced outside Tailwind (motion, form-theme defaults).

Components reference these — Tailwind classes or `var(--token)`. Spacing,
breakpoints, opacity, and z-index use **Tailwind's default scales** unless a
custom value is listed below; those defaults are our scale, and we don't fight
them.

**Two theme layers (Principle 10 — architectural, keep separate):**

1. **Product theme** — our brand. The `brand`, `ink`, `success/warn/danger`
   scales and all app-chrome tokens. Fixed.
2. **Form theme** — the creator's per-form styling. The `--fb-*` variables are
   *defaults only*; `FormRenderer` overrides them per form from
   `FormVersion.theme`, scoped to the rendered form. Product tokens never leak
   into a form; form tokens never leak into product chrome.

This file documents both what exists today and the intended scale for tokens not
yet in config — the latter marked **`(planned)`**. Add a planned token the first
time a component genuinely needs it, not before (YAGNI).

---

## Naming conventions

- **Tailwind color scales:** `<name>-<step>`, step ∈ `50…900`, higher = darker.
  `brand-600` is the default brand action color; `ink-900` is near-black text.
- **Semantic colors:** single-word roles — `success`, `warn`, `danger`.
- **CSS variables, product/system:** `--<category>-<role>` — e.g. `--ease-soft`,
  `--dur-base`.
- **CSS variables, form theme:** always prefixed **`--fb-*`** (form builder) so
  they are unmistakable and never confused with product tokens — `--fb-primary`,
  `--fb-radius`.
- **Scale steps** go low→high for size/intensity (`--dur-fast` < `--dur-base`).
- No raw hex, px, or ms in components. If you're typing `#` or a bare pixel value
  in a `.vue` file, reach for a token instead.

---

## Color tokens

### Brand — indigo/violet accent

The action color and brand identity. `600` is the default (matches
`--fb-primary`).

| Token | Hex |
|---|---|
| `brand-50`  | `#eef2ff` |
| `brand-100` | `#e0e7ff` |
| `brand-200` | `#c7d2fe` |
| `brand-300` | `#a5b4fc` |
| `brand-400` | `#818cf8` |
| `brand-500` | `#6366f1` |
| `brand-600` | `#4f46e5` ← default action |
| `brand-700` | `#4338ca` |
| `brand-800` | `#3730a3` |
| `brand-900` | `#312e81` |

### Ink — warm neutral scale

Slightly violet-tinted grays — the "approachable" base. Surfaces, borders, text.

| Token | Hex | Typical use |
|---|---|---|
| `ink-50`  | `#faf9fb` | app background (`body`) |
| `ink-100` | `#f5f3f7` | subtle surface / hover fill |
| `ink-200` | `#eceaf1` | card surface, dividers |
| `ink-300` | `#dcd9e3` | default border |
| `ink-400` | `#b8b4c2` | disabled text, placeholder |
| `ink-500` | `#918d9c` | muted / secondary text |
| `ink-600` | `#6c6878` | body-secondary |
| `ink-700` | `#514e5c` | strong body text |
| `ink-800` | `#343240` | headings |
| `ink-900` | `#1d1b26` | primary text (`body` color) |

> **Muted-text default:** secondary/muted text uses `ink-500`. (CLAUDE.md names
> `gray-500` generically; in our warm scale that role is `ink-500`.)

### Semantic

| Token | Hex | Meaning |
|---|---|---|
| `success` | `#16a34a` | success, valid, confirmed |
| `warn`    | `#d97706` | warning, caution, at-limit |
| `danger`  | `#dc2626` | error, destructive, invalid |

**`(planned)`** — tint/subtle backgrounds for each semantic (e.g. a `danger-50`
for error-field fills). Add as a scale when the first component needs the soft
variant; until then compose with opacity.

### Form-theme color (runtime)

| Variable | Default | Overridden by |
|---|---|---|
| `--fb-primary` | `#4f46e5` | `FormVersion.theme.primaryColor` |

---

## Typography tokens

**Family** (`tailwind: font-sans`, and `html`):

```
Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif
```

Inter is the brand face; the system stack is the fallback. `html` sets
`-webkit-font-smoothing: antialiased` and `text-rendering: optimizeLegibility`.

**Size / weight / line-height:** use **Tailwind's default type scale**
(`text-sm`, `text-base`, `text-lg`, `font-medium`, `leading-relaxed`, …). We have
not overridden it — that default *is* our scale.

Rough role mapping (convention, not separate tokens):

| Role | Classes |
|---|---|
| Page title | `text-2xl font-semibold` |
| Section heading | `text-lg font-semibold` |
| Body | `text-base` (`ink-900`) |
| Secondary / helper | `text-sm text-ink-500` |
| Label | `text-sm font-medium` |
| Caption / meta | `text-xs text-ink-500` |

**Form-theme font `(planned)`** — `FormVersion.theme.fontFamily` will drive a
`--fb-font` variable in `FormRenderer`. Not yet wired; add when per-form fonts
ship.

---

## Spacing tokens

Uses **Tailwind's default 4px-based scale** (`p-1` = 4px … `p-6` = 24px …).
Spacing always comes from this scale — never an arbitrary pixel value
(Principle 3).

| Step | px | Common use |
|---|---|---|
| `1` | 4  | tight icon/text gap |
| `2` | 8  | inside small controls |
| `3` | 12 | control padding |
| `4` | 16 | default gap between elements |
| `6` | 24 | card padding, section gap |
| `8` | 32 | between major blocks |
| `12` | 48 | page section rhythm |

Group related things with small steps, separate unrelated things with large ones.

---

## Border radius tokens

Customized for "comfortably rounded" (soft surfaces). Defaults matched to
`--fb-radius`.

| Token | Value | Use |
|---|---|---|
| `rounded` (DEFAULT) | `10px` | inputs, buttons, small controls |
| `rounded-lg` | `14px` | cards, panels |
| `rounded-xl` | `18px` | large surfaces, modals |
| `rounded-2xl` | `22px` | hero / feature surfaces |
| `rounded-full` | `9999px` | pills, avatars, toggles (Tailwind default) |

**Form-theme radius (runtime):** `--fb-radius` (default `10px`), overridden per
form by `FormVersion.theme.borderRadius`.

---

## Border tokens

No dedicated width scale — use Tailwind widths (`border` = 1px, `border-2` = 2px).
Color and width conventions:

| Role | Value |
|---|---|
| Default border | `border border-ink-300` |
| Subtle divider | `border-ink-200` |
| Focused input | `border-brand-600` (paired with focus shadow) |
| Error input | `border-danger` |
| Hairline (1px) | `border` |
| Emphasis (2px) | `border-2` |

Keep borders quiet; prefer surface/elevation over heavy outlines.

---

## Shadow tokens

Gentle elevation, tinted with `ink-900` (not pure black) so shadows feel warm.

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 1px 2px rgba(29,27,38,0.04), 0 4px 16px rgba(29,27,38,0.06)` | cards, resting panels |
| `shadow-pop` | `0 10px 34px rgba(29,27,38,0.14)` | popovers, dropdowns, modals |
| `shadow-focus` | `0 0 0 3px rgba(99,102,241,0.35)` | focus ring (brand-500 @ 35%) |

`shadow-focus` pairs with `focus-visible` for the visible focus ring
(Principle 5 / accessibility). Never remove focus outline without this
replacement.

---

## Opacity tokens

Uses **Tailwind's default opacity scale** (`opacity-0` … `opacity-100`, plus
per-utility alpha like `bg-ink-900/60`). Conventions:

| Value | Use |
|---|---|
| `opacity-0` | fully hidden (fade start/end) |
| `40` / `disabled:opacity-40` | disabled controls |
| `60` | modal scrim (`bg-ink-900/60`) |
| `100` | default |

Prefer `<color>/<alpha>` (e.g. `bg-ink-900/60`) over separate opacity utilities
when tinting a specific color.

---

## Animation duration tokens

Motion is quick and purposeful (Principle 4 — ~150–200ms).

| Variable | Value | Use |
|---|---|---|
| `--dur-fast` | `130ms` | hovers, small state changes, taps |
| `--dur-base` | `180ms` | panels, transitions, reorders |

**`(planned)`** `--dur-slow` (~260ms) for larger surface entrances (modal open).
Add when a component needs it; don't exceed ~300ms — longer reads as sluggish.
All motion respects `prefers-reduced-motion`.

---

## Easing tokens

| Token | Value | Use |
|---|---|---|
| `--ease-soft` / `ease-soft` (Tailwind) | `cubic-bezier(0.22, 1, 0.36, 1)` | default for all UI motion |

One easing curve for consistency — a soft "ease-out" that decelerates into rest.
Available both as a CSS var (`transition-timing-function: var(--ease-soft)`) and a
Tailwind utility (`ease-soft`). Use linear only for continuous spinners.

---

## Z-index tokens

Uses **Tailwind's default z-scale** (`z-0`, `z-10` … `z-50`). Layer convention so
stacking stays predictable:

| Layer | Class | Use |
|---|---|---|
| Base | `z-0` | normal flow |
| Sticky | `z-10` | sticky headers, sticky toolbars |
| Dropdown | `z-20` | popovers, menus, select panels |
| Overlay | `z-30` | drawer / side panel |
| Modal | `z-40` | modal + its scrim |
| Toast | `z-50` | toasts, above everything |

Don't invent arbitrary z values; pick the layer above.

---

## Breakpoint tokens

Uses **Tailwind's default breakpoints**. The product is mobile-first; the public
form renderer must work great on a phone (definition of done).

| Prefix | min-width | Target |
|---|---|---|
| (none) | 0 | mobile (base styles) |
| `sm` | 640px | large phone / small tablet |
| `md` | 768px | tablet |
| `lg` | 1024px | laptop |
| `xl` | 1280px | desktop |
| `2xl` | 1536px | wide desktop |

Design base-first, layer complexity up with prefixes. Builder is `lg+`
optimized; renderer is base-first.

---

## Grid tokens

No custom grid config — compose with Tailwind flex/grid utilities. Conventions:

| Context | Approach |
|---|---|
| App shell | `flex` (sidebar + main) |
| Card galleries | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` |
| Form field stack | single column, `space-y-*` (never multi-column fields) |
| Content max width | `max-w-2xl` (forms), `max-w-6xl` (dashboards) |

Gutters use the spacing scale (`gap-4`, `gap-6`). Forms stay single-column for
readability and mobile parity.

---

## Icon size tokens

Default icon size is **`h-5 w-5`** (20px) — CLAUDE.md convention. Deviate only
when a specific size is required.

| Class | px | Use |
|---|---|---|
| `h-4 w-4` | 16 | dense/inline (inside `text-sm`) |
| `h-5 w-5` | 20 | **default** |
| `h-6 w-6` | 24 | primary actions, headers |
| `h-8 w-8` | 32 | empty-state / feature icons |

Icons inherit `currentColor`; color them via text color (`text-ink-500`), not
fills.

---

## Transition tokens

Compose duration + easing from the tokens above. Standard patterns:

| Pattern | Recipe |
|---|---|
| Default interactive | `transition ease-soft duration-[130ms]` (hover/press) |
| State change | `var(--dur-base) var(--ease-soft)` |
| Property-scoped | `transition-colors` / `transition-transform` (avoid `transition-all`) |

Prefer transitioning `transform` and `opacity` (cheap, no layout) over `width` /
`height` / `top`. Always gate on `prefers-reduced-motion`.

---

## Future token guidelines

When the product needs a value not covered here:

1. **Reach for an existing token first.** Most needs are already a step on a
   scale. A new token is a last resort, not a first instinct (Principle 6).
2. **Add it to the scale, not to a component.** New value → this file +
   `tailwind.config.js`/`tokens.css`. Never a literal in a `.vue`.
3. **Name by role, not by look.** `--dur-slow`, not `--dur-260`. `danger`, not
   `red`. Tokens should survive a re-tune.
4. **Keep the two layers separate.** Product tokens and `--fb-*` form tokens
   never cross. A new form-themeable value gets an `--fb-*` name and a
   `FormVersion.theme` field.
5. **Only add when a component actually needs it** (`(planned)` entries above are
   the queue). No speculative scales.
6. **Dark mode, when it comes,** is a token concern — semantic aliases
   (`--surface`, `--text`) that swap by theme, not per-component overrides.
   Design new tokens so that swap stays possible.

A change to any value here should ripple through the whole product by editing
this file and the two config files — if it doesn't, something bypassed the tokens
and that's the bug to fix.
