# Inputs

Text entry — the controls a stranger types real data into. This is where trust is
won or lost, so inputs are held to the highest polish bar in the system.

Like buttons, inputs exist in **two theme layers** and the split is architectural:

- **`.fb-input`** — form-themed. Used by `FormRenderer` for every public form
  control. Reads `--fb-primary` / `--fb-radius` from `FormVersion.theme`. Our
  brand must never appear here.
- **`.ui-input`** — product chrome. Builder panels, auth, settings. Brand/ink
  tokens only, fixed radius.

Source: [`UiTextInput.vue`](../../frontend/src/components/ui/UiTextInput.vue) ·
[`UiTextarea.vue`](../../frontend/src/components/ui/UiTextarea.vue) ·
[`UiSearchInput.vue`](../../frontend/src/components/ui/UiSearchInput.vue) ·
[`UiField.vue`](../../frontend/src/components/ui/UiField.vue) ·
[`style.css`](../../frontend/src/style.css)

Related: [buttons](./buttons.md) · [design-tokens](../01-foundations/design-tokens.md) · [motion](../01-foundations/motion.md) · [colors](../01-foundations/colors.md)

---

## Text Input

`UiTextInput` is the single-line workhorse. It backs `short_text`, `email`, and
`number` field types — the `type` attribute is the only difference between them
(`phone` and `date` have dedicated components).

It is deliberately dumb: it always emits a **raw string**, and the renderer
coerces per field type. That keeps the control free of type-specific branching and
puts coercion next to the schema that defines the type.

```vue
<UiField :label="field.label" :required="field.required" :input-id="field.id" :error="errorFor(field)">
  <UiTextInput
    :id="field.id"
    type="text"
    :placeholder="field.placeholder"
    :model-value="value"
    :invalid="!!errorFor(field)"
    @update:model-value="setAnswer(field, $event)"
  />
</UiField>
```

| Prop | Purpose |
|---|---|
| `id` | Wired to the label's `for` — always the immutable `Field.id` |
| `modelValue` | `string \| number \| undefined` |
| `type` | Native input type — `text`, `email`, `number`, … |
| `placeholder` | Example input, **never** a substitute for the label |
| `invalid` | Applies `.fb-input--invalid` (red border + red focus ring) |

Anatomy — `UiField` owns the wrapper so every control gets the same structure:

```
Label *            ← 14px medium, red asterisk when required
Description        ← 14px gray-500, optional helper text
[ control ]        ← the slot
Error message      ← 14px red-600, only after submit or touch
```

- **Always wrap a control in `UiField`.** A bare input with no label is a bug —
  and `UiField` is what guarantees the `for`/`id` pairing.
- **Placeholder ≠ label.** Placeholders vanish on typing. Anything the user needs
  while typing goes in the label or description.
- **One field per row.** Side-by-side inputs are harder to scan and worse on
  mobile. Exception: genuinely paired values (start/end).
- **Width communicates.** A full-width input for a 3-digit number is a lie about
  expected input, but in the renderer we accept `w-full` uniformly — consistency
  beats per-field width tuning for v1.

---

## Textarea

`UiTextarea` backs `long_text`. Same `.fb-input` styling, so it sits visually
identically to single-line inputs — only taller.

```vue
<UiTextarea :id="field.id" :rows="4" :placeholder="field.placeholder"
            :model-value="value" :invalid="!!errorFor(field)"
            @update:model-value="setAnswer(field, $event)" />
```

- **Default `rows="4"`.** Enough to signal "write a few sentences" without eating
  the viewport. Override for genuinely long answers.
- **Height is the affordance.** If users should write a paragraph, don't hand them
  a one-line box — the control's size sets the expectation for the answer.
- **Resizable vertically only** (browser default is fine). Never lock resize off —
  people writing long answers want the room.
- **Character counters** belong with `maxLength` validation: show the count only
  when a limit exists, and only once the user is near it (~80%). A counter on an
  unbounded field is just anxiety.
- No rich text. `long_text` is plain text — the schema stores a string, and
  formatting has nowhere to live.

---

## Search

`UiSearchInput` is **product chrome only** — dashboard topbar, modal search. It is
never used inside a rendered form.

```vue
<UiSearchInput v-model="query" placeholder="Search forms…" hint="⌘K" />
```

Distinct from a plain text input by design:

- **Leading magnifying-glass icon** (`text-ink-500`, `pointer-events-none`) so the
  purpose reads before the placeholder does.
- **Recessed resting state** (`bg-ink-50`), lifting to `bg-white` +
  `ring-brand-200` on focus — search invites, it doesn't demand.
- **Optional `hint` kbd** on the right (`⌘K`) for the global shortcut. It's
  `aria-hidden` — the shortcut is a convenience, not the accessible name.
- **`ariaLabel` defaults to "Search"**, because search inputs typically ship
  without a visible label.
- **`focus()` is exposed** via `defineExpose` so the app shell can focus it from a
  global keybinding.

Behavior:

- **Debounce ~200–300ms** before firing a query; never a request per keystroke.
- **Filter as you type**, don't require Enter. `Esc` clears the query and, in a
  modal, closes it.
- **Empty state must say something useful** — "No forms match 'xyz'" beats an
  empty list.

---

## Email

Not a separate component — `UiTextInput` with `type="email"`. That's the point:
type-specific behavior lives in the schema and the shared validator, not in a
parallel component.

- **`type="email"`** gets the correct mobile keyboard (`@` and `.` on the primary
  layer). This is most of the value on phones.
- **`autocomplete="email"`** in product chrome (auth, settings) so password
  managers fill it. Public form fields don't set autocomplete beyond the browser's
  own guess.
- **`novalidate` on the form.** The renderer disables native browser validation
  deliberately — native bubbles are unstyleable, inconsistent across browsers, and
  would compete with our own messages. We own the error UI end to end.
- **Validation is shape, not deliverability:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
  Whether mail lands is a delivery-time problem, not a form problem — rejecting
  valid-but-unusual addresses is worse than accepting a typo.
- **Never lowercase or trim as the user types.** Normalize on submit if needed;
  rewriting characters under the cursor feels broken.

---

## Number

`UiTextInput` with `type="number"`, backing the `number` field type.

- **Coercion happens in the renderer**, not the control: the input emits a string,
  `setAnswer` converts to `Number` and stores `undefined` for empty. The validator
  then only ever sees a real number or nothing.
- **`min` / `max` come from `Field.validation`** and produce messages like "Must be
  at least 1." — the shared validator owns the wording so client and server agree.
- **Empty is empty, not zero.** A cleared number field stores `undefined`, so an
  optional field stays genuinely unanswered.
- **Scroll-wheel changes are a hazard** — a user scrolling the page over a focused
  number input silently changes their answer. Blur on wheel, or accept the risk
  knowingly. `ponytail:` not handled today; worth fixing when someone reports it.
- **Not for phone numbers, IDs, ZIP codes, or card numbers.** Those are text —
  they have leading zeros, separators, and no arithmetic meaning. Phone has its
  own `UiPhoneInput` with a country selector.
- Spinner arrows are browser chrome we tolerate for now; hiding them is a
  `-webkit-appearance` line if they ever look wrong against the design.

---

## Password

Product chrome only — auth and settings. There is **no password field type**, and
there won't be: a public form collecting passwords is a phishing vector.

Today these are raw `<input type="password" class="ui-input">` in
[`AuthView`](../../frontend/src/pages/AuthView.vue) and
[`SettingsView`](../../frontend/src/pages/SettingsView.vue) — no `UiPasswordInput`
component yet. Fine at two callers; extract when a third appears.

Rules that are not optional:

- **`autocomplete` must be exact:** `current-password` for login,
  `new-password` for signup and for every field in a change-password form.
  Getting this wrong breaks password managers, which pushes users toward weaker
  passwords.
- **Never a `value` bound to server state.** Password fields are write-only.
- **Placeholder is dots** (`••••••••`), never a hint about the format.
- **No live "strength meter" theatre.** Enforce a minimum length, say so up front,
  and let Lucia handle hashing. Never disable paste.
- **Reveal toggle `(planned)`:** an eye icon that flips `type` to `text`, with
  `aria-pressed` and a label that changes between "Show password" / "Hide
  password". Add it with the component extraction.

---

## States

Both `.fb-input` and `.ui-input` share the same state model.

| State | `.fb-input` (form) | `.ui-input` (chrome) |
|---|---|---|
| Default | `border-line-300`, white fill | `border-line-200`, white fill |
| Hover | `border-line-400` | `border-line-300` |
| Focus | `border: --fb-primary` + 3px `--fb-primary` @22% glow | `border-brand-500` + `ring-2 ring-brand-100` |
| Invalid | `border-#dc2626` | (same red border, via caller) |
| Invalid + focus | Red border + red 18% glow | — |
| Disabled | Muted fill, `cursor-not-allowed`, no hover | same |
| Read-only | Same border, muted text, still selectable & focusable | same |

- **The focus ring is a glow, not an outline.** `outline-none` plus a
  `box-shadow` ring keeps the corner radius honest — a native outline squares off
  rounded corners in some browsers.
- **Focus color follows the theme.** In a rendered form the ring is the creator's
  `primaryColor`; in product chrome it's brand. Never hardcode either.
- **Invalid overrides focus color** — a red field stays red while focused. The
  error is the more important signal.
- **Disabled vs read-only:** disabled means "not applicable"; read-only means
  "this value, but you can't change it here". Read-only stays focusable and
  copyable — don't disable a field just to show a value.
- **Placeholder is `text-ink-500`** — muted but still ≥4.5:1. Placeholder text is
  not a place for low-contrast decoration.

---

## Validation

One validator, two consumers. `validateAnswers` in
[`backend/src/schema`](../../backend/src/schema) runs on the client for instant
feedback and on the server as the authoritative trust boundary. There is never a
second, drifting copy — and the client result is UX only.

**When errors appear** (the rule that makes validation feel kind rather than
nagging):

```ts
// Only surface an error once the user has submitted or touched that field.
function errorFor(field: Field): string | undefined {
  if (!submitted.value && !touched[field.id]) return undefined;
  return result.value.errors[field.id];
}
```

- **Never on first render.** A form covered in red before a single keystroke is
  hostile.
- **After touch, then live.** Once a field has been interacted with, its error
  updates as the user types — so corrections clear the error immediately, which is
  the whole reward loop.
- **Everything shows on submit.** Submitting reveals every outstanding error at
  once; the first invalid field should receive focus.
- **Errors are specific and actionable.** "Enter a valid email address." /
  "Must be at least 3 characters." Never "Invalid input", never a regex.
- **The author's bad regex is not the respondent's problem** — an unparseable
  `pattern` passes validation rather than blocking a submission nobody can fix.
- **The submit button stays enabled.** Let the user press it and see what's wrong;
  a disabled submit with no explanation is a dead end (see
  [buttons](./buttons.md#states)).
- **Server errors surface in the same place.** A server-side rejection renders in
  the same `UiField` error slot as a client one — same look, same position, so
  there's no "second kind" of error to learn.

---

## Accessibility

- **Every input has a real `<label>`** with `for` pointing at the input's `id`.
  `UiField` does this; the id is the immutable `Field.id`.
- **Required is not only an asterisk.** The `*` is `aria-hidden` decoration —
  the input needs `required` / `aria-required` so it's announced.
  `(gap: not wired on UiTextInput today)`
- **`aria-invalid="true"` on an errored input**, and **`aria-describedby`**
  pointing at the description and error elements so both are announced with the
  field. `(gap: UiField renders the text but doesn't wire the ids yet — do this
  before launch; it's the difference between an accessible form and a decorative
  one.)`
- **Errors are announced.** The error region should be `role="alert"` (or a live
  region) so a change is spoken, not just painted.
- **Focus the first error on submit** — otherwise a keyboard or screen-reader user
  has to hunt for what failed.
- **Contrast:** label `gray-800`, description/placeholder `gray-500`/`ink-500`,
  error `red-600` — all ≥4.5:1 on white. A creator's `primaryColor` can be any
  color, so the ring is a *glow* around a border, never the sole indicator.
- **Never rely on color alone** for the invalid state — the message text is the
  real signal; the red border is reinforcement.
- **Correct `type` and `inputmode`** so mobile users get the right keyboard.
  That's accessibility, not a nicety.
- **Zoom-safe on iOS:** inputs render at ≥16px in the form renderer so Safari
  doesn't auto-zoom on focus.

---

## Motion

Restrained on purpose — an input that animates a lot feels unstable under the
cursor. Details in [motion](../01-foundations/motion.md).

| Change | Motion |
|---|---|
| Hover border | `border-color`, `--dur-base` (180ms), `ease-soft` |
| Focus ring | `box-shadow` + `border-color`, `--dur-base`, `ease-soft` |
| Invalid → valid | Border color transitions on the same curve; message removal is instant |
| Error appears | Fade + small rise, `--dur-fast` — never a shake |
| Search focus | `bg-ink-50 → white` + ring, `--dur-base` |

- **Only `border-color` and `box-shadow` animate.** Never height, width, or
  padding — an input that resizes on focus shifts everything below it.
- **The text never moves.** No floating-label animation, no placeholder that
  slides. The cursor position must be perfectly stable.
- **No shake on error.** It's a punishment animation; the red border and message
  already say it.
- **Reduced motion:** all of this collapses to instant state changes. The states
  remain fully distinguishable without any transition — that's the test.

---

## Do's & Don'ts

**Do**

- ✅ Wrap every control in `UiField` — label, description, error, wired ids.
- ✅ Use `.fb-input` in the renderer and `.ui-input` in product chrome.
- ✅ Keep controls dumb: emit raw values, coerce in the renderer.
- ✅ Set the right `type` so mobile keyboards match the field.
- ✅ Show errors after touch or submit, then update live.
- ✅ Write specific, actionable error messages.
- ✅ Get `autocomplete` right on auth fields.

**Don't**

- ❌ Use a placeholder as the label.
- ❌ Show errors before the user has touched the field.
- ❌ Ship native browser validation bubbles — the form is `novalidate`.
- ❌ Write a second validator on the client.
- ❌ Remove `outline` without replacing it with a visible focus ring.
- ❌ Animate an input's size, or shake it on error.
- ❌ Use `type="number"` for phone numbers, ZIPs, or IDs.
- ❌ Let form-theme variables (`--fb-*`) style product chrome, or brand tokens
  style a rendered form.
- ❌ Add a password field type to the public form schema.
