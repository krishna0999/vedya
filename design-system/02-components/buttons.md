# Buttons

The primary "do something" control. Buttons carry the product's two theme layers:
`UiButton` is **product chrome** (builder, dashboard, modals) and is styled from
brand tokens; the public form's submit button is **form-themed** (`.fb-btn`) and
takes its color and radius from `FormVersion.theme`. They look related on purpose,
but they are two components and must never share styling.

Source: [`UiButton.vue`](../../frontend/src/components/ui/UiButton.vue) ·
[`.fb-btn`](../../frontend/src/style.css)

Related: [design-tokens](../01-foundations/design-tokens.md) · [motion](../01-foundations/motion.md) · [icons](../01-foundations/icons.md) · [colors](../01-foundations/colors.md)

---

## Purpose

A button triggers an action *now*: save, publish, add a field, delete, submit.

- **Button vs link.** A button performs an action; a link navigates. If it changes
  the URL, it's an `<a>` — not a button styled like one. Screen readers and
  cmd-click both depend on this.
- **One primary per surface.** Each screen, panel, or modal has exactly one
  obvious primary action. Everything else is secondary or ghost. Two primaries
  means neither is.
- **The label is the action.** Verb-first and specific: "Publish form", "Delete
  field", "Add option". Never "OK", "Submit" (except the form's own submit), or
  "Yes".
- **Destructive is explicit.** Deleting uses `danger` and names the target, and —
  per Principle 2 — prefers *delete instantly + Undo toast* over a confirm dialog
  wherever the loss is recoverable.

```vue
<UiButton @click="publish">Publish form</UiButton>
<UiButton variant="secondary" @click="preview">Preview</UiButton>
<UiButton variant="danger" size="sm" @click="remove">Delete field</UiButton>
```

---

## Variants

Four, and four is enough.

| Variant | Look | Use for |
|---|---|---|
| `primary` *(default)* | `bg-brand-600` fill, white text, `shadow-sm`, hover `brand-700` | The one main action on a surface — Save, Publish, Create form |
| `secondary` | White surface, `border-line-200`, `text-ink-800`, hover `bg-ink-50` | Companion actions next to a primary — Cancel, Preview, Duplicate |
| `ghost` | No fill or border, `text-ink-600`, hover `bg-ink-100` | Low-emphasis and dense UI — toolbar actions, row actions, icon buttons |
| `danger` | `bg-danger` fill, white text, hover `red-700` | Irreversible or destructive actions only — Delete form, Remove account |

Rules:

- **Never two primaries side by side.** Primary + secondary is the pair; primary +
  primary is a decision the user has to make twice.
- **`danger` is earned.** Use it for genuine data loss, not for "Remove" on
  something trivially re-addable — that's a `ghost` with a trash icon.
- **`ghost` inside dense surfaces.** In tables, cards, and toolbars, ghost keeps
  the weight on content, not chrome.
- No `link`-looking variant. Text that navigates is an `<a>`, styled by typography,
  not a button variant.

---

## Sizes

| Size | Padding / type | Use |
|---|---|---|
| `sm` | `px-3 py-1.5 text-sm` (~30px tall) | Dense contexts — table rows, card headers, inline toolbars |
| `md` *(default)* | `px-4 py-2.5 text-sm` (~38px tall) | Everything else — forms, modals, page headers |

Both sizes keep `text-sm`; the difference is padding and presence, not type scale.
This is deliberate — a size scale that also changes font size makes toolbars look
mismatched.

- **Touch targets.** On mobile, any tappable button needs ≥44px of hit area. `md`
  gets there with its surrounding spacing; `sm` on touch surfaces must be padded
  or promoted to `md`.
- **Full width on mobile.** Primary actions in a form or bottom sheet go
  `w-full sm:w-auto` — the public form's submit does exactly this.
- No `lg`. If a button needs to be bigger, the surface needs better hierarchy.

---

## States

| State | Treatment |
|---|---|
| Default | Variant base styles |
| Hover | Background/border shift — `brand-600 → brand-700`, `ink-50`, `ink-100` |
| Focus (`focus-visible`) | `ring-2 ring-brand-300 ring-offset-1`, outline removed |
| Active / press | `active:translate-y-px` — a 1px push |
| Disabled | `opacity-55`, `cursor-not-allowed`, no hover response |
| Loading | Spinner replaces the leading icon, label switches to present tense — see below |

- **Focus is `focus-visible` only.** Keyboard users get the ring; mouse users
  don't get a ring stuck on after a click.
- **Disabled must be explainable.** A dead button with no reason is a dead end —
  pair it with a tooltip or inline hint ("Add a field to publish"). Prefer
  *enabled + validation feedback* over disabled where you can.
- **Never remove the focus ring** to make a design look cleaner. It's not
  decoration.
- Hover is pointer-only. No action may exist *only* on hover — touch has no hover.

---

## Icons

Icons come from [`UiIcon`](../../frontend/src/components/ui/UiIcon.vue); the button's
`gap-2` handles spacing.

- **Sizing.** `h-4 w-4` inside `sm`, `h-5 w-5` (the `UiIcon` default) inside `md`.
- **Color.** Use `text-inherit` so the icon follows the variant's text color
  through hover and disabled — never hardcode an icon color inside a button.
- **Position.** Leading icon by default (it labels the action). Trailing icon only
  when it describes a *result* — a chevron for a menu, an external-link arrow.
- **One icon.** Leading *and* trailing at once is noise.
- **Icon-only buttons must still have a name.** `aria-label` plus a `UiTooltip`,
  always — an unlabelled icon button is invisible to a screen reader.

```vue
<UiButton variant="ghost" size="sm">
  <UiIcon name="plus" class="h-4 w-4 text-inherit" />
  Add option
</UiButton>

<UiButton variant="ghost" size="sm" aria-label="Delete field">
  <UiIcon name="trash" class="h-4 w-4 text-inherit" />
</UiButton>
```

---

## Loading state

For any action that hits the network — save, publish, submit, export.

The pattern in use today:

1. Set `disabled` while in flight (prevents the double-submit).
2. Swap the leading icon for `<UiIcon name="arrow-path" class="animate-spin text-inherit" />`.
3. Switch the label to present tense — "Save" → "Saving…", "Publish" →
   "Publishing…", "Submit" → "Submitting…".

```vue
<button type="submit" class="fb-btn w-full sm:w-auto" :disabled="submitting">
  <UiIcon v-if="submitting" name="arrow-path" class="h-5 w-5 animate-spin text-inherit" />
  {{ submitting ? 'Submitting…' : 'Submit' }}
</button>
```

Rules:

- **Hold the width.** The loading label should not resize the button — pick label
  pairs of similar length, or set a `min-w`. A button that jumps mid-click feels
  broken.
- **Announce it.** `aria-busy="true"` while loading so assistive tech knows the
  action is in progress.
- **Spinner in the button, not over the page.** A full-screen overlay for a save is
  overkill; a skeleton is for *loading data*, a button spinner is for *submitting
  an action*.
- **Success is a toast, not a permanent button state.** The button returns to its
  default label; the toast confirms.
- **Fast actions don't flicker.** Under ~200ms, skip the spinner entirely.

`UiButton` has no `loading` prop yet — callers manage `disabled` + label
themselves (`BuilderApp`, `SettingsView`, `FormRenderer`). Fold it into the
component when a third caller repeats the pattern, not before.

---

## Accessibility

- **Real `<button>` elements.** Never a clickable `<div>` or `<span>` — you'd have
  to reimplement focus, Enter/Space, and the `button` role, and you'd get it wrong.
- **Explicit `type`.** `type="button"` is the default in `UiButton` on purpose —
  an untyped button inside a `<form>` submits it. Only the actual submit gets
  `type="submit"`.
- **Accessible name for every button.** Visible text, or `aria-label` on icon-only
  buttons.
- **Contrast ≥ 4.5:1** for label against fill, in every variant, including hover.
  `brand-600`/white and `danger`/white both clear it.
- **`aria-busy`** while loading; **`aria-disabled`** if you need the button to stay
  focusable while unavailable (so a screen-reader user can find it and read the
  reason).
- **Don't rely on color alone.** `danger` also carries a destructive verb in the
  label — "Delete form", not a red "Continue".
- **Motion is optional.** All button motion sits under `prefers-reduced-motion`;
  press/hover feedback degrades to instant state change, never to nothing.

---

## Keyboard behavior

Native `<button>` gives most of this for free — which is the reason to use it.

| Key | Behavior |
|---|---|
| `Tab` / `Shift+Tab` | Move focus in DOM order; focus ring appears |
| `Enter` | Activates the focused button |
| `Space` | Activates the focused button (fires on key-up) |
| `Esc` | Not a button behavior — closes the surrounding modal/menu |

- **DOM order = visual order.** No `tabindex` above 0, ever. If focus order feels
  wrong, the markup order is wrong.
- **Disabled buttons are skipped** by Tab. That's correct — but it means a disabled
  primary can leave a keyboard user with no explanation. Use `aria-disabled` +
  inline hint when the reason matters.
- **Modals:** focus moves into the dialog on open, is trapped while open, and
  returns to the trigger on close. The confirm button gets initial focus, except
  for destructive dialogs where Cancel does.
- **Icon buttons in rows** are reachable in sequence — never hidden behind hover.
  Hover may *reveal* them visually, but focus must make them visible too
  (`group-focus-within:opacity-100`).

---

## Motion

Full detail in [motion](../01-foundations/motion.md); the button-specific summary:

| State | Motion |
|---|---|
| Hover | Background/border shift, `duration-150`, `ease-soft` |
| Press | `active:translate-y-px` — instant, `--dur-fast` |
| Focus | Ring appears at `--dur-fast` |
| Loading | Spinner spins `linear`, continuous; width held |
| Disabled | No motion at all |

- Press feedback is the single most important button animation — it confirms the
  tap landed. Keep it to a 1px push (or a `0.98` scale); anything bigger reads as
  toy-like.
- Transition colors and transform only. Never animate width, or the button will
  reflow its neighbors.
- `--ease-soft` (`cubic-bezier(0.22, 1, 0.36, 1)`) everywhere. Don't invent curves.
- Under `prefers-reduced-motion`, hover/press become instant state changes; the
  loading spinner stays (it's feedback, not decoration).

---

## Do's & Don'ts

**Do**

- ✅ One primary action per surface; everything else secondary or ghost.
- ✅ Verb-first, specific labels — "Publish form", not "OK".
- ✅ Use `UiButton` for product chrome and `.fb-btn` for the public form.
- ✅ Disable + spinner + present-tense label while an action is in flight.
- ✅ Give icon-only buttons an `aria-label` and a tooltip.
- ✅ Keep `text-inherit` on icons so they follow the variant.
- ✅ Keep hit areas ≥44px on touch.

**Don't**

- ❌ Use a button for navigation — that's an `<a>`.
- ❌ Ship two primary buttons side by side.
- ❌ Style a `<div>` as a button.
- ❌ Remove the `focus-visible` ring.
- ❌ Use `danger` for anything recoverable — prefer delete + Undo toast.
- ❌ Let a loading label resize the button.
- ❌ Leave a button disabled with no explanation.
- ❌ Hardcode hex colors in a button — use brand/ink tokens, or `--fb-*` in the
  renderer.
- ❌ Bake product brand color into the form's submit button — it themes from
  `FormVersion.theme` only.
