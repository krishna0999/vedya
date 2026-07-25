# Cards

The container that carries almost everything in product chrome. Cards are how the
dashboard, forms grid, and template gallery turn a wall of data into scannable
objects.

There is **no `UiCard` component**, and that's deliberate. A card here is a
recurring *recipe* — border, radius, surface, shadow — not a wrapper with slots.
Every card so far needs different internals, and a component whose only job is
`<div class="rounded-xl border …"><slot /></div>` earns nothing. What must stay
consistent is the recipe, which is what this file records.

**The base recipe:**

```
rounded-xl border border-line-200 bg-white shadow-card
```

Padding is `p-4` for tiles, `p-5` for panels and paper cards. `shadow-card`
(`0 1px 2px + 0 4px 16px`, both near-black at 4–6%) is a *resting* shadow —
barely there. `shadow-pop` (`0 10px 34px @14%`) is the hover/overlay shadow.

**Two families, two hover physics** — this is the important distinction:

| Family | Examples | Hover |
|---|---|---|
| **Panel** | Dashboard stat tiles, analytics sections, quick actions | Rise 2px (`-translate-y-0.5`) + `shadow-pop` |
| **Paper** | `FormCard`, `TemplateCard` | Scale `1.06` + `z-30` + accent-tinted shadow |

Panels are furniture — they sit in a grid and lift politely. Paper cards *are*
the content (a small sheet of paper showing a real form), so they pop forward over
their neighbors. Don't mix the two.

Source: [`FormCard.vue`](../../frontend/src/components/FormCard.vue) ·
[`TemplateCard.vue`](../../frontend/src/components/TemplateCard.vue) ·
[`FormCardPreview.vue`](../../frontend/src/components/FormCardPreview.vue) ·
[`DashboardView.vue`](../../frontend/src/pages/DashboardView.vue) ·
[`UiSkeleton.vue`](../../frontend/src/components/ui/UiSkeleton.vue)

Related: [buttons](./buttons.md) · [motion](../01-foundations/motion.md) · [design-tokens](../01-foundations/design-tokens.md) · [colors](../01-foundations/colors.md)

---

## Dashboard Card

The stat tile — the four-across metric row at the top of the dashboard. Inline in
`DashboardView`, rendered inside a `<dl>` so each tile is a real `<dt>`/`<dd>`
term-and-value pair, not a div pretending.

```
┌────────────────────────────────┐
│ [icon] Label ⓘ        ↑ +12%  │  ← tinted icon chip, label, trend pill
│                                │
│ 1,284                     ◜◝   │  ← 3xl tabular value, optional completion ring
│ across 6 published forms   ◟◞  │  ← hint
└────────────────────────────────┘
   rounded-xl border-line-200 p-4 shadow-card
```

- **Icon chip:** `h-9 w-9 rounded-lg` with a tint pair from `TINTS` (e.g.
  `bg-brand-50 text-brand-600`). `aria-hidden` — decoration, the label is the
  name.
- **Value is `text-3xl font-semibold` + `tabular-nums`.** Tabular figures are
  non-negotiable on a metric that animates: proportional digits make the number
  jitter as it counts.
- **The value counts up** (`counted()`) on load. Once, briefly, then still.
- **Trend pill** is `bg-green-50/text-green-700` up, `bg-red-50/text-red-700`
  down, with a matching arrow icon — never color alone.
- **Completion ring** renders only when `s.ring !== undefined`. A 0% ring on a
  brand-new account looks like failure; no data means no ring.
- **`explain` tooltip** on ambiguous labels ("Completion rate"), via a small `?`
  affordance that is itself focusable (`tabindex="0"`) so keyboard users can reach
  the explanation.
- **A tile with nothing to report says so** (`s.empty`): a short title and a line
  of body copy, instead of "0" or an em-dash. See [Empty state](#empty-state).

Grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`, `gap-3`.

---

## Analytics Card

The larger `<section>` panels below the stats — chart, activity feed, top forms,
plan usage. Same base recipe, `p-5`, laid out on a 12-column grid
(`lg:col-span-8` + `lg:col-span-4`, then `7/5`).

**Structure every panel follows:**

```
┌──────────────────────────────────────────────┐
│ Analytics                    [seg] [seg] [⤓] │  ← h2 + subtitle left, controls right
│ Responses, last 30 days                      │
├──────────────────────────────────────────────┤
│                                              │
│   chart / list / skeleton / empty state      │  ← fixed h-56 so all three agree
│                                              │
└──────────────────────────────────────────────┘
```

- **`aria-label` on the `<section>`** ("Analytics", "Activity") so the landmark is
  navigable.
- **Header controls are toggle groups** — recessed `bg-ink-100` track, raised
  white thumb (see [checkboxes § Toggle Group](./checkboxes.md#toggle-group)).
- **The content area is a fixed height** (`h-56`) shared by the chart, its
  skeleton, and its empty state. That's what stops the page from jumping as data
  arrives — the single most valuable thing in this whole file.
- **Charts are hand-rolled SVG** with `role="img"` and a descriptive
  `aria-label` ("Responses per day over the last 30 days"), so the panel isn't a
  black box to a screen reader.
- **No panel hover.** These are containers, not targets — only the interactive
  rows *inside* them respond.

Panels never nest. A card inside a card is a sign the outer one should have been
a heading and a divider.

---

## Template Card

`TemplateCard` — the gallery tile. Fixed `h-80`, and its content is the
template's **actual first questions** rendered in grayscale by `FormCardPreview`.
That's the core idea: the card looks like a small sheet of paper, so the user
judges the template by seeing it, not by reading a description of it.

Layout, top to bottom:

1. **Title** — `line-clamp-2 min-h-[2.5rem]`, turns `brand-700` on card hover.
2. **Reorder / pin actions + badge**, top right, fading in on hover.
3. **Description** — `line-clamp-2 min-h-[2.5rem]`, `text-ink-500`.
4. **The paper** — `FormCardPreview`, `flex-1 min-h-0 overflow-hidden`.
5. **Meta row** — category badge, question count, `~N min` estimate, optional
   `stat`.
6. **Actions** — `Preview` (secondary) + `Use template` (primary), both `sm`.

The details that matter:

- **`min-h` on title *and* description reserves two lines each**, so every card's
  preview starts at the same y whether the text wraps or not. Without it, a grid
  of cards looks like a ransom note.
- **`flex-1 min-h-0`** on the preview lets it absorb the slack and clip, so the
  footer is never pushed out of a fixed-height tile.
- **The accent is reserved for the primary action**, not sprayed over the card.
  The card body stays grayscale; color marks what to click.
- **Pinned star stays visible** at rest; unpinned fades in on hover. A state
  indicator that only appears on hover isn't an indicator.
- **`~N min` is an estimate, not analytics** — ~15s per question, marked
  `ponytail:` in the source. Don't let it grow a data pipeline before it needs
  one.
- **The card is presentation-only.** `preview` / `use` / `pin` / `move` are
  emitted up to the gallery, which owns fetching and navigation.

---

## Form Card

`FormCard` — one form in the "My forms" grid. Same paper metaphor, more state:
it's a real object the user owns, so it carries actions and status.

Rendered as an `<li>` inside a `<ul>` — the grid is a list, and that's how it's
announced.

**What's different from the template card:**

- **Per-form accent.** `--card-accent: form.primaryColor` drives the title's hover
  color and the tint in the hover shadow — so each card carries *its own* form's
  brand, not ours. Same principle as the renderer's theme layer.
- **Quick actions on hover** — Edit, Open, Email — plus a kebab
  (`UiActionMenu`) for Responses, Move left/right, Copy link, Delete.
- **Unpublished actions are disabled with a reason.** "Publish the form to get a
  link" appears as the tooltip on Open/Email/Copy rather than the buttons simply
  going dead — a disabled control with no explanation is a dead end
  ([buttons § States](./buttons.md#states)).
- **Metrics row** — responses / views / questions, `tabular-nums`, `border-t`
  separated, pinned to the bottom so every tile's numbers line up across the grid.
- **Status badges** — green `Published` / amber `Draft`, plus the category badge.
  The dot variant carries meaning beyond color.
- **`overflow-visible` on purpose.** On hover the preview grows past the card's
  height (`max-h-[28rem]`) into a floating panel that peeks at more questions.
  Clipping the card would kill the whole effect.
- **Draggable to reorder**, with Move left / Move right in the menu as the
  keyboard and touch path to the same thing. Drag alone is not an accessible
  reorder.

---

## Hover states

**Panel cards:**

```
transition duration-200 ease-soft
hover:-translate-y-0.5 hover:border-line-300 hover:shadow-pop
```

A 2px rise and a stronger shadow. Quick actions add `hover:border-brand-300
hover:text-brand-700` and reset with `active:translate-y-0` so the press cancels
the lift — the click feels like the card is being pushed back down.

**Paper cards:**

```
transition duration-200 ease-soft
hover:z-30 hover:scale-[1.06] hover:border-line-300
hover:shadow-[… color-mix(in srgb, var(--card-accent) 45%, transparent)]
```

- **Scale, not size.** `transform` doesn't reflow, so the card grows *over* its
  neighbors on all sides instead of shoving the grid around. This is the reason
  it's a scale and not a width/height change.
- **`z-30` is required** — without it the card grows *under* the cards to its
  right and the effect reads as a rendering bug.
- **The shadow is accent-tinted**, so a form's own color glows under it.
- **Hover reveals, focus must too.** Every fade-in action group carries
  `focus-within:opacity-100` / `sm:focus-visible:opacity-100`, and the fades are
  `sm:`-prefixed so touch devices — which have no hover — get the actions
  permanently visible. A hover-only control is invisible on a phone.
- **Content hover is separate from card hover:** the title recolors, the preview
  expands, the actions fade in — all keyed off `group-hover`, all
  `duration-150/200`.

Everything above collapses to an instant state change under
`prefers-reduced-motion`. The states stay distinguishable without motion — that's
the test.

---

## Loading

**Skeletons, never spinners** (Principle 8). `UiSkeleton` is a pulse plus a
shimmer sweep, `aria-hidden`, sized entirely by utility classes at the call site.

The rule that makes it work: **the skeleton mirrors the real layout** — same grid,
same card count, same fixed height, same internal rhythm. When data lands, nothing
moves.

```vue
<div v-if="loading" role="status" class="grid … sm:grid-cols-2 xl:grid-cols-4">
  <span class="sr-only">Loading your forms…</span>
  <div v-for="n in 6" :key="n" class="flex h-80 flex-col rounded-xl border border-line-200 bg-white p-5">
    <UiSkeleton class="h-4 w-32 max-w-[70%]" />
    <UiSkeleton class="mt-5 h-3 w-20" />
    …
    <UiSkeleton class="mt-auto h-3.5 w-40" />
  </div>
</div>
```

- **`role="status"` + an `sr-only` message.** The skeleton blocks are decorative;
  the *container* carries the announcement, so a screen-reader user hears
  "Loading your forms…" rather than nothing.
- **Skeleton cards keep the real card's shell** (`rounded-xl border-line-200 p-5
  h-80`) but drop `shadow-card` — a resting shadow on a placeholder implies
  something is there.
- **Mirror the surrounding chrome too.** The template gallery skeletons the filter
  pills row as well as the cards, so the whole region settles at once.
- **Vary the bar widths** (`w-2/3`, `w-4/5`, `w-3/5`). Identical-length bars read
  as a broken pattern, not as text.
- **Six placeholders** is the convention — enough to fill the fold, not so many
  that a small account gets a wall of ghosts.
- **The shimmer stops under reduced motion** (built into `UiSkeleton`); the pulse
  and layout remain.
- **In-card loading** (creating from a template) uses the button's own state —
  `Use template` → `Creating…`, with `busy` disabling every card's button and
  `pending` marking the one that was clicked. See
  [buttons § Loading](./buttons.md#loading-state).

---

## Empty state

Three different situations, three different treatments. Conflating them is the
common mistake.

**1. Nothing exists yet** — the real empty state. A dashed-border panel, centered,
with a way out:

```vue
<div class="rounded-2xl border border-dashed border-line-300 bg-white p-12 text-center">
  <h2 class="text-lg font-semibold text-ink-900">No forms yet</h2>
  <p class="mx-auto mt-1 max-w-sm text-sm text-ink-500">
    Create your first form, add a few fields, and publish to share a link.
  </p>
  <div class="mt-5 flex items-center justify-center gap-2">
    <UiButton @click="createForm">Create a form</UiButton>
    <UiButton variant="secondary" @click="setView('templates')">Browse templates</UiButton>
  </div>
</div>
```

- **Dashed border + `rounded-2xl`** — visually distinct from a real card, so it
  reads as a placeholder rather than an item.
- **Always a next action**, usually two: the direct path and the easier path
  (create vs. browse templates).
- **The copy explains the payoff**, not the mechanic — "publish to share a link",
  not "click the button above".

**2. Filtered to nothing** — not an empty state, a *no-match* state. Quiet text,
no illustration, no dashed panel, and it echoes the query back:

```vue
<div class="py-16 text-center text-sm text-ink-500">
  No forms match {{ query.trim() ? `“${query}”` : "the selected filters" }}.
</div>
```

The user has data; they've just filtered past it. Offering "Create a form" here
would be answering a question nobody asked.

**3. A panel with no data yet** — inline, inside the panel, at the same fixed
height as the content it replaces:

```vue
<div class="mt-4 flex h-56 flex-col items-center justify-center rounded-lg
            border border-dashed border-line-200 bg-ink-50/60 px-6 text-center">
  <span class="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink-400 shadow-card">
    <UiIcon name="chart-bar" class="text-inherit h-5 w-5" />
  </span>
  <p class="mt-3 font-medium text-ink-800">No analytics yet</p>
  <p class="mt-1 max-w-xs text-sm text-ink-500">
    Publish a form and its views and responses will show up here.
  </p>
  <UiButton variant="secondary" size="sm" class="mt-4">Publish a form</UiButton>
</div>
```

- **Recessed fill** (`bg-ink-50/60`) + dashed border + a white icon chip. Softer
  than the page-level empty state — it's one panel, not the whole app.
- **`h-56` matches the chart and the skeleton**, so the panel never resizes as it
  moves between the three.
- **Names the precondition:** "Publish a form and…" tells the user what unlocks
  it.

**4. A stat with nothing to report** — the smallest case: replace the number with
a short title and a line of body copy. A "0" that's really "not yet measured"
reads as failure.

**Errors are not empty states.** They get their own treatment — red-tinted panel,
the actual message, and (ideally) a retry:

```vue
<p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{{ error }}</p>
```

---

## Do's & Don'ts

**Do**

- ✅ Use the base recipe: `rounded-xl border-line-200 bg-white shadow-card`.
- ✅ Reserve line-height with `min-h` so every card in a grid aligns.
- ✅ Give the loading, empty, and loaded states the same fixed height.
- ✅ Mirror the real layout in skeletons, and announce with `role="status"`.
- ✅ Use `tabular-nums` on any number that animates or sits in a column.
- ✅ Keep cards presentation-only — emit actions up to the page.
- ✅ Make hover-revealed actions appear on focus, and stay visible on touch.
- ✅ Distinguish "nothing yet" from "nothing matches".

**Don't**

- ❌ Build a `UiCard` wrapper for a `<slot>` and four utility classes.
- ❌ Nest a card inside a card.
- ❌ Mix the two hover physics — panels rise, paper scales.
- ❌ Animate width/height on hover (reflows the grid); scale instead.
- ❌ Scale a card without `z-30` — it'll grow under its neighbors.
- ❌ Put `shadow-card` on a skeleton.
- ❌ Show a "0" or an em-dash where "no data yet" is the truth.
- ❌ Offer "Create one" when the user has items and just filtered them out.
- ❌ Bake our brand into a form card's accent — it comes from
  `form.primaryColor`.
