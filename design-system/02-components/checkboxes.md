# Checkboxes, Radios & Switches

Binary and small-set choices. All four controls here share one construction rule:
**replace the appearance, keep the native element.** A custom mark drawn over a
visually hidden `<input>` gets us the design we want *and* every keyboard,
form-association, and screen-reader behavior the browser already implements
correctly. Reimplementing that from a `<div>` is how accessibility bugs get
shipped.

Two theme layers as always: `UiOptionGroup` marks are form-themed (`.fb-mark`,
filled with `--fb-primary`), while `UiToggle` and toggle groups are product chrome
(brand/ink tokens).

Source: [`UiOptionGroup.vue`](../../frontend/src/components/ui/UiOptionGroup.vue) ·
[`UiToggle.vue`](../../frontend/src/components/ui/UiToggle.vue) ·
[`.fb-mark`](../../frontend/src/style.css)

Related: [selects](./selects.md) · [inputs](./inputs.md) · [motion](../01-foundations/motion.md) · [design-tokens](../01-foundations/design-tokens.md)

---

## Which control

| Need | Control | Field type |
|---|---|---|
| Pick several from 2–6 visible options | Checkbox (`UiOptionGroup multiple`) | `multi_select` |
| Pick one from 2–6 visible options | Radio (`UiOptionGroup`) | `single_select` |
| Flip a setting on/off, applies immediately | Switch (`UiToggle`) | — *(builder only)* |
| Pick one of 2–4 mutually exclusive views | Toggle group | — *(chrome only)* |

Above ~6 options, move to a [dropdown](./selects.md). Switches and toggle groups
are **product chrome only** — there is no boolean field type, and a form
respondent should see a real checkbox, not a switch (see Switch below for why).

---

## Checkbox

`UiOptionGroup` with `multiple` — backs `multi_select`. Emits `string[]`.

```vue
<UiOptionGroup
  multiple
  :name="field.id"
  :options="field.options ?? []"
  :model-value="value"
  @update:model-value="setAnswer(field, $event)"
/>
```

**Construction**

```vue
<label>                                  ← whole row is the hit target
  <input type="checkbox" class="peer sr-only" />   ← real input, visually hidden
  <span class="fb-mark fb-mark--check" aria-hidden="true">✓</span>  ← the drawn mark
  <span>Label<br><small>description</small></span>
</label>
```

- **The `<label>` wraps everything**, so the label text, description, and mark are
  all one click target — no fiddly 20px box to hit on a phone.
- **`sr-only` not `display:none`.** A hidden-with-`display:none` input is removed
  from the accessibility tree and the tab order; `sr-only` keeps it focusable and
  announced.
- **The mark is `aria-hidden`** — it's a picture of state, and the real input
  already reports that state.
- **Checked state is set explicitly from Vue** (`.fb-mark--on`), not via CSS
  `:has()` or `peer-checked`. The comment in the source says why: it stays robust
  across markup changes and doesn't depend on selector support.
- **Focus ring rides the peer:** `peer-focus-visible:ring-2 ring-brand-300` on the
  mark, so keyboard focus is visible even though the input isn't.
- **`rounded-[6px]`** — a square-ish box. Roundness is what separates checkbox
  from radio at a glance, so never round a checkbox to a circle.
- **`items-start` + `mt-0.5`** on the mark so it aligns to the first line of a
  wrapping label, not to the vertical centre of a three-line block.

**Rules**

- Checked ≠ required. A single "I agree" checkbox is a `multi_select` with one
  option marked required, not a special control.
- **No indeterminate state** in v1. There's no nesting in the schema, so there's
  nothing for a tri-state to mean.
- Order options meaningfully (frequency, then alphabetical). "Other" goes last,
  always.

---

## Radio

Same component without `multiple` — backs `single_select`. Emits a `string`.

Everything from Checkbox applies, with three differences that carry meaning:

- **`rounded-full`** (`.fb-mark--radio`) and a filled dot rather than a check. The
  shape *is* the affordance: circle = one, square = many. Never mix them.
- **`name` is the field id**, so the browser enforces mutual exclusion natively —
  we don't hand-manage "uncheck the others."
- **Radios don't uncheck.** Once one is picked, the user can switch but not clear.
  If "no answer" is a legitimate choice, the field must be optional *and* offer an
  explicit "None" option — don't expect people to find a way to deselect.

Use radios for 2–6 options. Below 2, it's not a choice; above 6, it's a dropdown.

---

## Switch

`UiToggle` — product chrome, booleans in builder panels ("Required", "Show quick
presets").

```vue
<UiToggle v-model="required" label="Required" />
```

- **`role="switch"` + `aria-checked`** on a real `<button type="button">`. That
  gets Enter and Space for free and announces "on/off" rather than
  "checked/unchecked".
- **The knob translates**, the track changes color: `bg-ink-200 → bg-brand-600`,
  `translate-x-0.5 → translate-x-[18px]`, both `duration-150`. Transform and color
  only — nothing resizes.
- **Label sits left, switch right**, inside a wrapping `<label>` so the text is
  part of the hit target.
- **Give it an `aria-label` when there's no visible `label` prop.** A bare switch
  with no accessible name is unusable by screen reader.

**Switch vs checkbox — the rule:** a switch takes effect *immediately*; a checkbox
is a value that gets saved when the surrounding form is submitted. That's why
switches live in builder panels (autosaved settings) and never in the rendered
form (answers submitted together). Using a switch for a form answer implies the
answer took effect on toggle, which is a lie.

---

## Toggle Group

A segmented control: 2–4 mutually exclusive options shown side by side, all
visible, switching a view rather than collecting an answer. Chrome only.

Current implementations — dashboard metric switcher, dashboard date range
([`DashboardView.vue`](../../frontend/src/pages/DashboardView.vue)), and the
builder's Single date / Date range switch
([`FieldConfigPanel.vue`](../../frontend/src/components/builder/FieldConfigPanel.vue)).

**The pattern**

```vue
<div class="flex rounded-lg bg-ink-100 p-0.5" role="group" aria-label="Metric">
  <button
    v-for="m in METRICS" :key="m.id" type="button"
    class="rounded-md px-2.5 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
    :class="metric === m.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'"
    :aria-pressed="metric === m.id"
    @click="metric = m.id"
  >{{ m.label }}</button>
</div>
```

- **Recessed track, raised thumb.** `bg-ink-100` container with `p-0.5`; the
  selected item is `bg-white` + `shadow-sm` so it reads as lifted out of the
  groove. This inversion (light on light) is what makes it not look like a row of
  buttons.
- **`role="group"` + `aria-label`** on the container; **`aria-pressed`** on each
  button.
- **Equal width** (`flex-1`) when there are exactly two and the labels are
  comparable; natural width for 3–4 short labels.
- **2–4 items, short labels.** Five segments with long labels is a dropdown.
- **Switches views, never destroys.** A segmented control is a lens on the same
  data — if picking a segment discards work, it's a form control, not a toggle
  group.

**This is repeated inline in three places with no component.** Rule of three is
met — extract `UiToggleGroup(options, v-model, ariaLabel)` next time a fourth
appears, and take the roving-tabindex fix (below) with it.

---

## Validation

All of it comes from the shared `validateAnswers` — same function, client and
server, same messages ([inputs § Validation](./inputs.md#validation)).

| Case | Rule | Message |
|---|---|---|
| Required, nothing selected | Empty array counts as empty | "This field is required." |
| `multi_select` + `validation.min` | Minimum **number of selections** | "Select at least 2 options." |
| `multi_select` + `validation.max` | Maximum number of selections | "Select at most 3 options." |
| Value not in `options` | Checked against `value ?? label` | "Select a valid option." |
| `single_select` non-string | Type guard | "Select an option." |

- **`min`/`max` mean *count* here**, not a numeric range — the same keys mean
  magnitude on a `number` field. That overload is deliberate (one
  `FieldValidation` shape) but it's the thing to remember when writing builder
  copy.
- **Empty array = unanswered.** Multi-value fields are seeded as `[]` in the
  renderer so the shape is stable, and `isEmpty` treats `[]` as empty — so
  `required` behaves correctly without a special case.
- **Option values are validated server-side against the published version.** A
  crafted submission with an option that was never in the form is rejected — this
  is the reason the check exists at all, since the UI can't produce one.
- **The error renders in the `UiField` slot below the group**, like every other
  field. No per-option error styling — the group failed, not one checkbox.
- Errors appear only after touch or submit. A required checkbox group is not red
  before the user has looked at it.

---

## Accessibility

What's already right, and worth not breaking:

- **Real `<input>`s underneath**, `sr-only`, so Tab, Space, and arrow-key
  navigation within a radio group all work natively.
- **Grouping by `name`** gives radios browser-enforced exclusivity and makes them
  a single Tab stop with arrow keys moving between options — exactly the expected
  radio behavior, for free.
- **Marks are `aria-hidden`**; the input carries the state.
- **`peer-focus-visible` ring** keeps focus visible on the drawn mark.
- **`role="switch"` + `aria-checked`** on `UiToggle`, activated by Enter and Space
  because it's a real button.
- **Hit targets are whole rows** (`py-1.5` + full-width label), which clears the
  44px touch minimum without extra padding hacks.

**Known gaps** — all real, all cheap:

- **The `UiField` label points at nothing for option groups.** `UiField` renders
  `<label for="{field.id}">`, but `UiOptionGroup` passes `field.id` as the inputs'
  `name`, not as any element's `id` — so the association dangles and the group's
  question isn't announced with the options. Fix: wrap the options in a
  `role="radiogroup"` / `role="group"` with `aria-labelledby` pointing at the
  label element. **This is the most important one on the list** — it affects every
  public form with a choice field.
- **No `aria-required` / `aria-invalid`** on the group when the field is required
  or errored, and no `aria-describedby` to the error text.
- **Toggle groups have no roving tabindex** — every segment is its own Tab stop,
  where a real segmented control should be one stop with arrow keys inside. Fold
  this into the `UiToggleGroup` extraction.
- **`UiToggle` relies on label wrapping for its accessible name.** Fine when
  `label` is passed; add `aria-label` at every call site that doesn't.

Universal rules:

- **Never remove the focus ring** to tidy up a dense options list.
- **Never use color alone** for checked state — the check glyph and the radio dot
  are the primary signal; the brand fill reinforces.
- **Contrast:** an unchecked mark border is `line-400` on white, and a checked mark
  is white-on-`--fb-primary`. A creator can set any `primaryColor`, so the *glyph*
  must carry the meaning even if their color is low-contrast.

---

## Motion

Deliberately minimal — these controls are clicked in rapid succession, so anything
slow feels sticky.

| Change | Motion |
|---|---|
| Check / uncheck | `.fb-mark` — `all --dur-fast` (130ms) `ease-soft`: border + background |
| Switch toggle | Track color + knob `translate-x`, `duration-150` |
| Toggle group select | `bg`/`text` colors, `transition` — the thumb does not slide |
| Focus | Ring at `--dur-fast` |

- **Nothing scales or bounces.** A checkbox that pops is a checkbox someone will
  see a thousand times.
- **The check glyph appears instantly** (`v-if`), with only the box transitioning.
  Animating an SVG stroke on every click costs more than it communicates.
- **Reduced motion:** all of these become instant. The states stay fully
  distinguishable without transition — that's the test for every one of them.

---

## Do's & Don'ts

**Do**

- ✅ Keep a real, `sr-only` native input under every custom mark.
- ✅ Make the whole row — mark, label, description — one click target.
- ✅ Circle for radio, rounded square for checkbox. Always.
- ✅ Use a switch only for settings that apply immediately.
- ✅ Use `min`/`max` on `multi_select` when a count limit matters, and say the
  limit in the field description too.
- ✅ Give every group a programmatic label (`role="group"` + `aria-labelledby`).

**Don't**

- ❌ Build these from `<div>`s — you'll reimplement keyboard support and get it
  wrong.
- ❌ `display:none` the input (kills focus and announcement) — use `sr-only`.
- ❌ Use a switch inside a rendered form; respondents get checkboxes.
- ❌ Use radios when the user might need to clear the answer, without a "None"
  option.
- ❌ Use a checkbox for one of a pair of opposites — that's a radio pair or a
  toggle group.
- ❌ Style a checked mark with brand tokens inside a form — it fills with
  `--fb-primary`.
- ❌ Animate the mark with scale or bounce.
