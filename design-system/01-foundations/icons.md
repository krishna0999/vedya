# Icons

How we use icons. Icons are functional — they speed recognition and label
actions, never decoration. One library, one primitive, one registry. Grounded in
the real implementation: [`lib/icons.ts`](../../frontend/src/lib/icons.ts) +
[`UiIcon.vue`](../../frontend/src/components/ui/UiIcon.vue).

Related: [design-tokens](design-tokens.md) · [colors.md](colors.md) · [design-principles](design-principles.md)

---

## Icon library

**Heroicons v2** (https://heroicons.com) — MIT-licensed, matches Inter's warm-but-
precise feel. We don't pull the npm package; instead each icon's inner SVG markup
lives in a **central registry**, `frontend/src/lib/icons.ts`, and is rendered
through the `UiIcon` primitive.

**Adding an icon:** copy the inner `<path…>` from the Heroicons site into
`icons.ts` under a name, then use `<UiIcon name="…" />`. Outline icons use the
default `0 0 24 24` viewBox; anything else passes an explicit `viewBox`.

Currently registered (grow as needed, don't pre-add):

```
chevron-{down,up,left,right}, check, x-mark, plus, minus, bell,
magnifying-glass, calendar, clock, trash, document-duplicate, pencil-square,
arrow-top-right-on-square, arrow-trending-{up,down}, arrow-{up,down}-tray,
arrow-path, arrow-left-start-on-rectangle, paper-airplane, envelope,
chart-{bar,line}, user-circle, key, rectangle-group, list-bullet, funnel, eye,
phone, star, star-outline, sparkles, ellipsis-horizontal, drag-dots, text-t,
hashtag, circle-dot, checkbox, select-box
```

**One library only.** Don't mix in Feather/Lucide/Material — mixed icon sets read
as inconsistent instantly (Principle 6). If Heroicons lacks something, draw a
`custom` entry in the same 24×24, 1.5-stroke style.

---

## Icon style

- **24×24 grid, 1.5px stroke, rounded caps/joins** — the Heroicons v2 outline
  style. Everything matches this so the set looks like one family.
- **Geometric, minimal, legible at 20px.** No detailed or illustrative icons.
- **Consistent optical weight** — a new custom icon must sit at the same visual
  density as the Heroicons around it.
- Warm & approachable, professional — friendly rounded joins, never toy-like.

## Stroke width

- **1.5px** — set by `UiIcon` for outline icons (`stroke-width="1.5"`). This is
  the whole outline set's weight; don't override per-icon.
- Solid icons have no stroke (they fill).
- Custom icons must be drawn at 1.5 stroke on the 24 grid to match — a 2px custom
  icon next to 1.5px Heroicons looks broken.

## Filled vs outline

`UiIcon`'s `type` prop switches between them:

| `type` | Rendering | Use |
|---|---|---|
| `outline` (default) | `stroke=currentColor`, no fill, 1.5px | **default** — the vast majority of UI |
| `solid` | `fill=currentColor`, no stroke | selected/active state, emphasis, small sizes |

- **Outline by default.** It's lighter and matches the airy, spacious feel.
- **Solid for state or small size:** an active tab, a selected/favorited star
  (`star` vs `star-outline`), or icons rendered ≤16px where outline detail muddies.
- Don't mix outline and solid for the *same* icon in the *same* context except to
  express state (e.g. outline = not favorited, solid = favorited).

---

## Icon sizes

Default is **`h-5 w-5` (20px)** — `UiIcon` applies it only if the caller hasn't
set a size, so a caller's class always wins.

| Class | px | Use |
|---|---|---|
| `h-4 w-4` | 16 | inline with `text-sm`, dense tables, chips |
| `h-5 w-5` | 20 | **default** — buttons, inputs, most UI |
| `h-6 w-6` | 24 | primary/header actions, nav |
| `h-8 w-8` | 32 | empty-state / feature illustration icons |

Match icon size to adjacent text: 16px icon beside 14px text, 20px beside 16px.
Don't render outline icons below 16px — detail collapses; use `solid` if you must
go smaller.

## Color rules

Icons inherit **`currentColor`** — color them via *text* color, never `fill`/
`stroke` overrides.

| Context | Color |
|---|---|
| Default / muted icon | `text-ink-500` |
| Icon in body text | inherits (`ink-900`/`ink-600`) |
| Interactive / brand | `text-brand-600` |
| On brand button | `text-white` (inherits button text) |
| Disabled | `text-ink-400` |
| Success / warn / error | `text-success` / `text-warn` / `text-danger` |

> **Known nit:** `UiIcon`'s hardcoded default color is `text-gray-500` (Tailwind
> gray), while our muted token is `text-ink-500` (warm). Callers should pass
> `text-ink-500` explicitly for muted icons until the default is switched. Flagged,
> not silently accepted.

Never rely on icon color *alone* to signal state — pair with text/shape
(accessibility).

---

## Button icons

| Pattern | Rule |
|---|---|
| Icon + label | icon `h-5 w-5` left of text, `gap-2`, inherits button text color |
| Icon-only button | **must** have `aria-label`; ≥40px hit target; tooltip on hover |
| Leading vs trailing | leading for the action's nature (＋ Add); trailing for direction (Next →) |
| Loading | icon swaps to inline spinner, button width held (no shift) |

Icon-only buttons are the most common accessibility miss — an `aria-label` is
non-negotiable, and the icon alone must be unambiguous.

## Form icons

The renderer — keep icons quiet so they don't compete with content.

| Use | Icon |
|---|---|
| Field-type marker (builder) | per type: `text-t`, `hashtag`, `envelope`, `phone`, `calendar`, `circle-dot`, `checkbox`, `select-box`, `star`, `list-bullet` |
| Select/dropdown chevron | `chevron-down`, `text-ink-400` |
| Valid field | `check`, `text-success` |
| Invalid field | pair `text-danger` message with icon, not icon alone |
| Date field | `calendar` |
| Clear/remove input | `x-mark`, `text-ink-400` hover `text-ink-600` |

Custom `Ui*` controls replace native chrome, so the chevron/check/radio marks are
*our* icons, not browser defaults (Principle 11).

## Dashboard icons

| Use | Icon |
|---|---|
| Nav: forms | `rectangle-group` |
| Nav: responses | `list-bullet` / `chart-bar` |
| Nav: analytics | `chart-line`, `arrow-trending-up/down` |
| Account | `user-circle` |
| Notifications | `bell` |
| Search | `magnifying-glass` |
| Filter | `funnel` |
| Export | `arrow-down-tray` |
| Row overflow menu | `ellipsis-horizontal` |
| Duplicate / edit / delete | `document-duplicate` / `pencil-square` / `trash` |
| Open public form | `arrow-top-right-on-square` |

## Builder icons

| Use | Icon |
|---|---|
| Add field | `plus` |
| Drag handle | `drag-dots` |
| Delete field | `trash` |
| Duplicate field | `document-duplicate` |
| Preview (eye) | `eye` |
| AI generate | `sparkles` |
| Publish/send | `paper-airplane` |
| Undo/refresh | `arrow-path` |
| Field-type palette | the per-type markers listed under Form icons |

Drag handles use `drag-dots` and must be clearly grabbable (≥40px target, cursor
`grab`).

## Status icons

Always paired with text/color, never color-only.

| Status | Icon + color |
|---|---|
| Success / saved | `check`, `text-success` |
| Error / failed | `x-mark`, `text-danger` |
| Warning / at-limit | (add `exclamation-triangle`), `text-warn` |
| Info | `sparkles`/contextual, `text-brand-600` |
| Loading | spinner (`arrow-path` spun, or dedicated spinner) |
| Trending up/down | `arrow-trending-up` / `-down`, semantic color |

---

## Accessibility

- **Decorative icons** (label sits right beside them) → `aria-hidden="true"`.
  `UiIcon` sets this **by default** — the icon is invisible to screen readers, and
  the adjacent text carries the meaning.
- **Meaningful icon-only controls** → the *button/link* gets an `aria-label`
  describing the action ("Delete field"), not the icon. Keep the icon
  `aria-hidden`.
- **Never icon-only for meaning without a text alternative** somewhere (label,
  aria-label, or tooltip).
- **Hit target ≥ 40px** for any tappable icon, even a 20px glyph — pad the button,
  not the icon.
- **Not color-alone:** status icons pair shape + color + (ideally) text.
- **Contrast:** icons that carry meaning meet ≥3:1 against their background
  (`ink-400` is the light floor, for decorative only).

---

## Usage guidelines

- **Icon supports, text leads.** For anything ambiguous, label it. An icon-only
  control is fine only when the icon is universally understood (search, close,
  add) *and* has an `aria-label`.
- **One icon per meaning.** `trash` always = delete, everywhere. Don't use two
  different icons for the same action across screens (Principle 6).
- **Size to the text** next to it; color via text color.
- **Add on first real use**, from Heroicons, into the registry — don't pre-stock
  icons "for later" (YAGNI).
- **Consistent placement:** leading icons for action nature, trailing for
  direction/disclosure.

## Do's & don'ts

**Do**

- ✅ Use `<UiIcon name="…" />` — never raw inline `<svg>` in a component.
- ✅ Pull new icons from Heroicons v2 into `icons.ts`.
- ✅ Give every icon-only button an `aria-label`.
- ✅ Color via `text-*`; size via `h-_ w-_`; let the icon inherit `currentColor`.
- ✅ Pass `text-ink-500` for muted icons (warm), not `gray-500`.
- ✅ Pair status icons with text/color, never color alone.

**Don't**

- ❌ Mix icon libraries — Heroicons only.
- ❌ Override per-icon stroke width (1.5 is the set's weight).
- ❌ Render outline icons below 16px (use `solid` if smaller).
- ❌ Ship an icon-only control with no accessible name.
- ❌ Use two icons for the same action in different places.
- ❌ Use a raw `<svg>` or a random emoji where a registry icon belongs.
