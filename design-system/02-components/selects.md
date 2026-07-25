# Selects

Choosing from a known set of options. **No native `<select>` anywhere** — a raw
browser select can't be styled consistently across platforms, can't show
descriptions or checkmarks, and looks like an unfinished product on Windows. Every
select in this system is a custom trigger + popover listbox built from tokens
(CLAUDE.md §7: "if it looks like an unstyled HTML element, it's a bug").

The same two theme layers apply as everywhere else:

- **`UiSelect` / `UiMultiSelectDropdown`** — form-themed. The trigger is a
  `.fb-input`, so it sits flush with text inputs and picks up the creator's
  `primaryColor` and `borderRadius`. Used by `FormRenderer`.
- **`BuilderSelect` / `UiFilterMenu` / `UiSortMenu` / `UiActionMenu`** — product
  chrome. Ink/brand tokens, compact, no search.

Source: [`UiSelect.vue`](../../frontend/src/components/ui/UiSelect.vue) ·
[`UiMultiSelectDropdown.vue`](../../frontend/src/components/ui/UiMultiSelectDropdown.vue) ·
[`UiOptionGroup.vue`](../../frontend/src/components/ui/UiOptionGroup.vue) ·
[`BuilderSelect.vue`](../../frontend/src/components/builder/BuilderSelect.vue)

Related: [inputs](./inputs.md) · [buttons](./buttons.md) · [motion](../01-foundations/motion.md) · [design-tokens](../01-foundations/design-tokens.md)

---

## Choosing the right control

Before reaching for a dropdown, check whether a dropdown is the answer at all.

| Options | Single choice | Multiple choice |
|---|---|---|
| **2–6, all worth seeing** | `UiOptionGroup` (radios) — `single_select` | `UiOptionGroup` (checkboxes) — `multi_select` |
| **7+, or space-constrained** | `UiSelect` — `dropdown` | `UiMultiSelectDropdown` — `multi_dropdown` |
| **2 states, instant effect** | `UiToggle` | — |

A dropdown hides its options behind a click. That's the right trade when there are
many; it's the wrong trade when there are three. The schema exposes both pairs
(`single_select`/`dropdown`, `multi_select`/`multi_dropdown`) precisely so the
creator picks the presentation — the answer shape stored is identical.

---

## Dropdown

`UiSelect` — single choice, `dropdown` field type.

```vue
<UiSelect
  :id="field.id"
  :options="field.options ?? []"
  :placeholder="field.placeholder"
  :model-value="value"
  :invalid="!!errorFor(field)"
  @update:model-value="setAnswer(field, $event)"
/>
```

**Anatomy**

```
[ Selected label                    ⌄ ]   ← .fb-input trigger, chevron rotates 180° when open
┌──────────────────────────────────────┐
│ 🔍 Search…                           │   ← auto-focused on open
├──────────────────────────────────────┤
│ Option one                        ✓  │   ← active row: bg-brand-50 text-brand-700
│ Option two                           │
│ No matches                           │   ← empty state when the filter kills everything
└──────────────────────────────────────┘   rounded-xl, border-line-200, shadow-pop, z-20
```

- **Trigger is a `<button type="button">`**, never a div — and `type="button"` is
  load-bearing: inside a `<form>`, an untyped button submits it.
- **`aria-haspopup="listbox"` + `aria-expanded`** on the trigger; the popover is
  `role="listbox"` with `role="option"` rows.
- **Placeholder state** renders `text-ink-500` and defaults to "Select…". It is
  not a selectable option — there's no fake "— none —" row.
- **Selection shows a checkmark**, not just a highlight. Highlight means "active
  cursor position"; the check means "this is your answer". They're different
  things and must look different.
- **Values default to labels.** `FieldOption.value ?? label` — the same rule the
  validator uses, so a creator who never touches `value` still gets stable
  answers.
- **Selecting closes the popover.** Single choice is done in one action.
- **`truncate` on long labels** — the trigger never wraps or grows, so the field
  height stays stable in a form.

**Don't** put more than a screenful of options in without expecting the search box
to do the work — it's there for exactly that.

---

## Multi Select

`UiMultiSelectDropdown` — `multi_dropdown` field type. Emits `string[]`.

Differences from the single dropdown, all deliberate:

- **The trigger shows chips**, one per selection (`bg-brand-50 text-brand-700`),
  each with an `×` to remove it without opening the popover. `min-h-[46px]` keeps
  the empty trigger the same height as a text input; it grows as chips wrap.
- **Rows carry a custom checkbox mark**, not a checkmark-on-select. Checkbox =
  "toggleable, several allowed"; that's the affordance doing the explaining.
- **The popover stays open** on select — the whole point is picking several.
- **Rows show `option.description`** on a second line when present, so an option
  can be explained without bloating its label.
- **Active row is `bg-ink-50`**, not brand-tinted — because brand is already
  carrying "checked" in this control. Two brand-colored meanings in one list is
  ambiguous.

`min`/`max` in `Field.validation` constrain the **number of selections** here
("Select at least 2 options."), not a numeric range. Same validator, same
messages, both sides.

For 2–6 options, use `multi_select` (`UiOptionGroup` checkboxes) instead — all
choices visible, no popover, one fewer click.

---

## Searchable Select

Not a separate component — **search is built into both dropdowns and always on.**
That's the lazy-correct call: a search box that's useless with 4 options costs one
row of chrome, while a missing one with 40 options costs the user real time.

- **The search input auto-focuses on open** (`nextTick` → `focus()`), so a
  keyboard or mouse user can start typing immediately with no second click.
- **Filtering is case-insensitive substring match on `label`** — not fuzzy, not
  on `value` or `description`. Predictable beats clever; a user who types "ma"
  expects everything containing "ma".
- **The query resets on every open.** A stale filter from a previous visit hiding
  options is a bug that reads as data loss.
- **`active` resets to 0** on open and stays within the *filtered* list, so Enter
  always picks what's visibly highlighted.
- **"No matches" is a real row**, not an empty box. An empty popover looks broken.

Product-chrome dropdowns (`BuilderSelect`) have **no search** on purpose — they
hold short, fixed option lists (field types, sort orders) where a search box is
pure noise.

---

## Async Select

Not built. `(planned)` — documented here so it lands in the right shape when a
wedge needs it (options from an API, a CRM, a previous answer).

The seam already exists: both dropdowns take `options: FieldOption[]` and own
nothing about where the array came from. An async variant is a wrapper that
**fetches into that same prop** — not a fork of the component.

When it's built:

- **Debounce ~250ms** on the query, and drop out-of-order responses (last request
  wins) — the classic async-select bug is a slow early response overwriting a fast
  late one.
- **Loading, empty, and error are three distinct states**, all rendered inside the
  popover where the options would be: a skeleton row or inline spinner, "No
  matches", and a retryable "Couldn't load options" — never a silently empty list.
- **The selected value must render without the list.** Store the chosen
  `{ value, label }` so a re-opened form shows "Acme Corp", not a raw id, before
  any fetch completes.
- **Cache per query** for the session; don't re-fetch on every popover open.
- **Server-side validation is the problem.** `validateAnswers` checks submissions
  against `field.options`, which async options aren't in. Either the version
  snapshots the allowed set at publish, or the field opts into a looser check —
  decide that at the schema level, not in the component.

Closest existing precedent for the fetch/debounce/empty-state shape:
[`SearchModal.vue`](../../frontend/src/components/SearchModal.vue).

---

## States

| State | Trigger | Rows |
|---|---|---|
| Default | `.fb-input` — `border-line-300`, white | — |
| Hover | `border-line-400` | `hover:bg-ink-50` |
| Focus | `--fb-primary` border + 3px glow | — |
| Open | Chevron rotated 180°, popover mounted at `z-20` | — |
| Active (cursor) | — | `bg-brand-50 text-brand-700` (single) / `bg-ink-50` (multi) |
| Selected | Label replaces placeholder / chips render | `✓` icon (single), filled checkbox (multi) |
| Invalid | `.fb-input--invalid` — red border, red focus glow | — |
| Empty result | — | "No matches", `text-ink-500` |
| Disabled | `opacity`, `cursor-not-allowed`, won't open | — |

- **Hover and active are the same visual channel** — mouseenter sets `active`, so
  the pointer and the keyboard cursor never disagree about which row is live.
- **Closing:** click outside (document `mousedown`), `Escape`, or selecting (single
  only). The listener is added on open and removed on close *and* on unmount —
  a popover that leaks a document listener is a memory leak with a jump-scare
  attached.
- **The popover is `absolute`, not portalled.** Fine inside a scrolling form;
  watch for clipping if a select ever lands inside an `overflow-hidden` container.
  Portal it then, not preemptively.
- **`max-h-56` + `overflow-auto`** on the list — long option sets scroll inside
  the popover rather than running off the viewport.

Motion is the shared popover transition: fade + 4px rise in at `150ms`, out at
`100ms`, `ease-soft` — exits faster than enters, like every overlay in the system.
The chevron rotation is `duration-150`. Nothing else moves.

---

## Keyboard support

The trigger is a real button, so it's tabbable and Enter/Space-activatable for
free. The rest is explicit:

| Key | Behavior |
|---|---|
| `Tab` | Focus the trigger; move past it when closed |
| `Enter` / `Space` | Open the popover (native button activation) |
| `↓` | Open when closed; move to the next row when open (wraps) |
| `↑` | Move to the previous row (wraps) |
| `Enter` | Select the active row — closes (single) / toggles and stays open (multi) |
| `Esc` | Close, without changing the selection |
| *typing* | Filters the list via the auto-focused search box |

- **Wrapping is intentional** (`(active + delta + n) % n`) — from the last row, `↓`
  returns to the first. Faster than hunting back up a long list.
- **`preventDefault` on the arrows** so the page doesn't scroll behind an open
  popover.
- **`Esc` never commits.** Escape means "I changed my mind", always.
- **All keys are handled on both the trigger and the search input**, so focus
  moving into the search box on open doesn't strand the arrow keys.

**Known gaps** — real, and worth closing before launch, since this is the control
a stranger uses on someone's public form:

- **No `aria-activedescendant`.** Focus sits in the search box while the visual
  cursor moves through rows, so a screen reader isn't told which option is active.
  Fix: give each row an `id` and point `aria-activedescendant` at the active one.
- **No `scrollIntoView` on the active row.** Past ~8 options, arrow-keying walks
  the cursor out of the visible area. One line in `move()`.
- **Chip `×` isn't keyboard-reachable** — `role="button" tabindex="-1"` in the
  multi-select. Either make it a real focusable button or support `Backspace` on
  the trigger to remove the last chip.
- **`Home` / `End` / type-ahead-on-trigger** unhandled. Lower priority; the search
  box covers most of what type-ahead would.

`UiOptionGroup` (radios/checkboxes) has none of these problems — it keeps real
native `<input>`s, visually hidden with `sr-only`, and draws the custom mark from
the peer state. That's the trick worth copying wherever it fits: **replace the
appearance, keep the native element and its keyboard behavior.**

---

## Do's & Don'ts

**Do**

- ✅ Use `UiOptionGroup` for 2–6 options; a dropdown only when the list is long.
- ✅ Keep the trigger a `<button type="button">` with `aria-expanded`.
- ✅ Show selection with a checkmark or checkbox, not only a highlight.
- ✅ Reset the search query and active index on every open.
- ✅ Render a real "No matches" row.
- ✅ Truncate long labels so the field height never jumps.
- ✅ Remove the document listener on close *and* unmount.

**Don't**

- ❌ Ship a native `<select>` — it's an unstyled-element bug.
- ❌ Add a placeholder as a selectable option.
- ❌ Close a multi-select on every pick.
- ❌ Use brand tint for both "active row" and "selected" in the same list.
- ❌ Let `Esc` commit a selection.
- ❌ Fetch options per keystroke when the async variant lands — debounce and
  drop stale responses.
- ❌ Style a form-facing select with brand tokens — it themes from
  `FormVersion.theme` only.
