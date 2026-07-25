# Badges

Small pills that label a thing's state, category, or count. Badges are the
quietest way to add information to a dense surface — which is exactly why they
get overused. A badge earns its place only when the information changes *per
item*; anything true of every row belongs in a column header, not on 40 pills.

Badges are **product chrome only**. There is no badge in the rendered form —
`UiBadge` uses brand/ink tokens and must never appear inside `FormRenderer`.

Source: [`UiBadge.vue`](../../frontend/src/components/ui/UiBadge.vue)

Related: [colors](../01-foundations/colors.md) · [cards](./cards.md) · [buttons](./buttons.md) · [typography](../01-foundations/typography.md)

---

## The component

```vue
<UiBadge variant="green" dot>Published</UiBadge>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `green` \| `gray` \| `brand` \| `amber` | `gray` |
| `dot` | boolean — prepends a solid status dot | `false` |

One size, on purpose: `text-xs font-medium`, `px-2 py-0.5`, `rounded-full`,
`gap-1.5`, `w-fit`. A badge scale would just be four ways to make the same pill,
and badges that vary in size stop reading as a set.

| Variant | Pill | Dot |
|---|---|---|
| `green` | `bg-green-50 text-green-700` | `bg-green-500` |
| `amber` | `bg-amber-50 text-amber-700` | `bg-amber-500` |
| `brand` | `bg-brand-50 text-brand-700` | `bg-brand-500` |
| `gray` | `bg-ink-100 text-ink-600` | `bg-ink-400` |

**`w-fit` matters.** Without it a badge inside a flex column stretches to the
container width and stops looking like a pill. It's in the base class so you never
have to think about it.

---

## Status badges

The primary use: what state is this object in? Published vs. draft is the one that
appears everywhere — form cards, dashboard lists, search results.

```vue
<UiBadge :variant="form.published ? 'green' : 'amber'" dot>
  {{ form.published ? "Published" : "Draft" }}
</UiBadge>
```

- **Green = live, amber = not yet.** Amber is "in progress / needs attention", not
  "error" — a draft isn't a problem, it's a stage.
- **Always `dot` on a status badge.** The dot is what separates *state* from
  *label*: a category badge is a noun, a status badge is a condition, and the dot
  is the visual tell. Keep them distinguishable at a glance in a card footer where
  both appear side by side.
- **The word carries the meaning; the color reinforces it.** "Published" is legible
  in grayscale — that's the accessibility requirement (colors.md: never rely on
  color alone), and it's why these badges are never dot-only.
- **Same state, same variant, everywhere.** A published form is green in the card,
  the dashboard list, and search. Inconsistency here makes users re-learn the
  color on every screen.
- **Category badges use `brand` or `gray`** and never take a dot — they're
  taxonomy, not state. `FormCard` shows category (`brand`) next to status
  (`green`/`amber`) precisely because the two roles read differently.

**Missing: a red/danger variant.** `danger` is a semantic token, but `UiBadge` has
no variant for it — so a failed or over-limit state has no badge today. Add it
when the first real case lands (an over-cap account, a failed export); don't add
it speculatively.

---

## Count badges

A number attached to a control or heading — how many, right now.

**Two shapes exist, and they're for different things:**

**1. Numeric pill on a control** — `UiFilterMenu`'s active-filter count:

```vue
<span class="grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1
             text-sm font-semibold text-white">
  {{ modelValue.length }}
</span>
```

- **Solid brand fill, white text** — high contrast, because this is the thing
  telling you a filter is silently hiding rows.
- **`h-4 min-w-4` + `px-1`** — a circle at one digit that grows into a lozenge at
  two or three. Never a fixed width that clips "12".
- **Rendered only when non-zero.** A "0" badge is noise.

**2. Labelled count in a heading** — `UiBadge` with the unit spelled out:

```vue
<h2>Recent responses <UiBadge v-if="unreadCount" variant="brand">{{ unreadCount }} new</UiBadge></h2>
```

- **Include the noun** ("3 new", not "3") when the badge sits next to a heading —
  a bare number next to "Recent responses" could be a total, a page, or anything.
- **`brand`, not `green`** — this is emphasis, not a state. Green would imply the
  responses are somehow "good".

**Trend pills** are a third relative, inline in the dashboard stat tiles:
`bg-green-50 text-green-700` up / `bg-red-50 text-red-700` down, each with a
matching arrow icon. The arrow is what makes the direction survive
color-blindness — a green pill and a red pill are the same pill to a
deuteranope.

**Rules for all counts:**

- **`tabular-nums` if the number changes in place.** Proportional digits make a
  live count jitter.
- **Cap large numbers** — "99+" beyond three digits, so the pill can't grow wide
  enough to break the control it's attached to.
- **A changing count is not automatically announced.** If a count matters to a
  screen-reader user (unread responses), the region needs `aria-live="polite"`, or
  the number needs to be part of the heading's text. `(gap: not wired today)`

---

## Notification badges

The smallest badge: a dot with no number, meaning "something here is new". Used on
the recent-responses list for items that arrived since the user last looked.

```vue
<span class="relative grid h-8 w-8 place-items-center rounded-lg bg-secondary-50 text-secondary-600" aria-hidden="true">
  <UiIcon name="paper-airplane" class="text-inherit h-4 w-4" />
  <span v-if="isUnread(r)"
        class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-secondary-600" />
</span>
…
<p :class="isUnread(r) ? 'font-semibold' : 'font-medium'">
  {{ r.formTitle }}<span v-if="isUnread(r)" class="sr-only">(unread)</span>
</p>
```

The pattern here is worth copying exactly, because it gets the hard part right:

- **The dot is never the only signal.** Unread rows are also `font-semibold`, and
  carry an `sr-only` "(unread)". Three channels — color, weight, text — so the
  state survives color-blindness *and* a screen reader.
- **`border-2 border-white`** punches the dot out of whatever it overlaps. Without
  the ring it smudges into the icon behind it.
- **Anchored with `absolute -right-0.5 -top-0.5`** on a `relative` parent —
  overlapping the corner, not floating beside it.
- **`h-2.5 w-2.5`.** Big enough to notice, small enough not to read as a bullet.
- **It must clear on interaction.** `markResponsesSeen` fires on click; a
  notification badge that never goes away trains users to ignore all of them.

**Don't** stack notification dots on more than one or two places at once. If
everything is new, nothing is.

---

## Color usage

The badge palette is where semantic color discipline gets tested, because a badge
is *only* color and a word.

| Meaning | Variant | Example |
|---|---|---|
| Live / done / positive | `green` | Published, Saved |
| In progress / needs attention | `amber` | Draft, Approaching limit |
| Emphasis / count / category | `brand` | "3 new", plan name, template badge |
| Neutral taxonomy | `gray` | Category, question count |
| Failure / over limit | *(no variant yet)* | — |

**The rules:**

- **Semantic color means state; brand means identity or emphasis.** Never use
  `green` to make something look nice, and never use `brand` to mean "good".
  Mixing the two is what makes a palette stop communicating.
- **Never color alone.** Every badge has a word inside it, and every dot-only
  indicator has a second channel (weight, `sr-only` text). This is the one rule
  here with no exceptions.
- **Tinted background + darker text**, always — `bg-*-50` with `text-*-700`. Solid
  fills are reserved for count badges on controls, where the badge must compete
  with the control's own background.
- **Contrast:** the `*-50/*-700` pairs all clear 4.5:1. Don't invent a `*-100/*-600`
  pair to soften a badge; it lands under the threshold.
- **At most one colored badge per item.** `FormCard` shows brand (category) + a
  status badge, and that's already the ceiling. A row of four colored pills is a
  color test, not information.
- **Never a form theme color.** A badge never takes `--fb-primary`. Card accents
  come from `form.primaryColor`; badges stay in product chrome.

**One known inconsistency**, recorded rather than papered over:

- **Badge variants use Tailwind's default `green`/`amber`/`red` scales, not the
  semantic tokens** (`success` `#16a34a`, `warn` `#d97706`, `danger` `#dc2626`).
  Close, not identical. Align when the semantic tint scales land — colors.md
  already marks `success-50` / `warn-50` / `danger-50` as `(planned)`.

> The unread dot previously used a loose `blue-600` that belonged to no token.
> It now uses `secondary-600` (cyan) — the documented accent for informational
> emphasis. Don't reintroduce a hue that isn't in the palette.

---

## Do's & Don'ts

**Do**

- ✅ Use `dot` for state, no dot for category — keep the two roles distinguishable.
- ✅ Put a word in every badge; color reinforces, never carries.
- ✅ Use the same variant for the same state on every screen.
- ✅ Hide count badges at zero.
- ✅ Let numeric pills grow (`min-w` + `px`) instead of clipping.
- ✅ Back a notification dot with a second signal (weight + `sr-only` text).
- ✅ Clear notification state when the user actually looks.

**Don't**

- ❌ Put a badge on every item — if it's always true, it's a header, not a pill.
- ❌ Show more than one or two colored badges per item.
- ❌ Use green for emphasis or brand for "good".
- ❌ Ship a dot-only indicator with no text equivalent.
- ❌ Add badge sizes — one size is what makes them read as a set.
- ❌ Use a badge as a button. It isn't interactive; if it needs a click, it's a
  filter chip or a `ghost` button.
- ❌ Let `--fb-*` or a form's `primaryColor` into a badge.
