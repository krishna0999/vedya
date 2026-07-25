# Modals, Drawers & Panels

Surfaces that appear over the app. All of them interrupt, so all of them have to
earn it: an overlay takes the user's place in the flow away and gives it back only
on their terms.

Four surfaces, one decision each:

| Surface | Blocks the app? | Use when |
|---|---|---|
| **Modal** | Yes | A short, focused task that must finish or be abandoned — search, generate with AI |
| **Drawer** | Yes | Reviewing something longer alongside the list it came from — template preview |
| **Side panel** | No | Persistent context that lives beside the work — builder field config |
| **Confirm dialog** | Yes | One irreversible decision, two buttons |

Source: [`UiConfirmDialog.vue`](../../frontend/src/components/ui/UiConfirmDialog.vue) ·
[`AiGenerateModal.vue`](../../frontend/src/components/AiGenerateModal.vue) ·
[`SearchModal.vue`](../../frontend/src/components/SearchModal.vue) ·
[`TemplateGallery.vue`](../../frontend/src/components/TemplateGallery.vue) ·
[`BuilderApp.vue`](../../frontend/src/components/builder/BuilderApp.vue)

Related: [buttons](./buttons.md) · [cards](./cards.md) · [motion](../01-foundations/motion.md)

---

## The shared shell

Every blocking surface is built the same way, and deviating is a bug:

```vue
<Teleport to="body">
  <div v-if="open"
       class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 pt-[10vh]"
       @click.self="close" @keydown.esc="close">
    <div role="dialog" aria-modal="true" aria-label="…"
         class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-pop sm:p-8">
      …
    </div>
  </div>
</Teleport>
```

- **`<Teleport to="body">`** — always. A dialog rendered inside a card inherits
  that card's `overflow`, `transform`, and stacking context, and will clip or sit
  behind things at random.
- **Scrim is `bg-ink-900/40`.** One value everywhere. Not black, not 50% — ink at
  40% keeps the page visible behind it, which is what tells the user they haven't
  navigated away.
- **`@click.self` on the backdrop**, so a click that lands on the scrim closes but
  a click inside the dialog doesn't bubble out and close it.
- **`z-50` for the surface, `z-40` for a separately-rendered scrim.** Keep these
  two numbers; a third z-value is how overlays start appearing under each other.
- **Top-anchored, not centered:** `items-start` + `pt-[10vh]`/`pt-[12vh]`/
  `pt-[20vh]`. A vertically centered dialog jumps as its content grows; a
  top-anchored one grows downward from a fixed point. `overflow-y-auto` on the
  backdrop means a tall dialog scrolls the whole overlay rather than trapping
  scroll inside itself.
- **`rounded-2xl`** — one step rounder than a card (`rounded-xl`), which is what
  makes it read as floating rather than inline.
- **A close `×` in the top-right of every one**, with `aria-label="Close"`. Scrim
  click and `Esc` are shortcuts, not the only exit.

---

## Modal

Centered-ish sheet for a self-contained task. Two exist:

**`AiGenerateModal`** — `max-w-2xl`, `pt-[10vh]`. Icon chip + title + one line of
supporting copy, then the form. It has no footer buttons: the embedded
`AiGenerateForm` owns its own submit, so the modal is a frame, not a wizard.

**`SearchModal`** — the interesting one, because it changes shape:

```
sm:h-20  sm:max-w-md     →     sm:h-[560px]  sm:max-w-3xl
   (just the search row)          (results visible)
```

- **It grows the moment there's a query**, animating `max-width` and `height` over
  `duration-500`. Slow *by the standards of this system* (motion.md caps most
  things at ~300ms) and deliberately so — this is a surface resizing, not a state
  flipping, and a fast resize reads as a glitch.
- **Full-screen on mobile, sheet on `sm+`** (`sm:rounded-2xl`, `sm:p-4`). On a
  phone a search overlay with margins around it wastes the only space there is.
- **The input is auto-focused on open** and exposed to a global `⌘K` shortcut.

**Rules for modals generally:**

- **One task per modal.** If it needs steps, it needs a page.
- **Never open a modal from a modal.** Nested overlays have no coherent back
  behavior and stack z-indexes forever.
- **`max-w-*` scales with content:** `max-w-md` for a prompt, `max-w-xl` for a
  confirm, `max-w-2xl`/`3xl` for a working surface. Wider than `3xl` and it should
  be a page.
- **Losing work must not be silent.** A modal holding unsaved input should confirm
  before a scrim click discards it. `(gap: not implemented — a scrim click on the
  AI modal drops the typed prompt)`

---

## Drawer

Slides in from an edge, covering part of the screen. Used when the content is
longer than a modal should be but still secondary to the list behind it.

**Side drawer** — the template preview slideover:

```vue
<!-- scrim: its own transition, opacity only -->
<div v-if="previewTemplate" class="fixed inset-0 z-40 bg-ink-900/40" @click="closePreview" />

<!-- panel: transform only -->
<aside v-if="previewTemplate" role="dialog" aria-modal="true" :aria-label="`Preview: ${t.title}`"
       class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-xl">
```

- **Scrim and panel are two separate transitions** — the scrim fades
  (`opacity`), the panel slides (`translate-x-full → 0`). Animating them together
  as one element would mean animating a transform on the scrim too, which is
  wasted work and looks wrong.
- **`transform`, never `right`/`left`.** Position animation causes layout on every
  frame; `translate-x` is composited.
- **`inset-y-0 right-0` + `max-w-lg`, full width below that.** A 512px drawer on a
  phone is a modal with a bad haircut.
- **`flex flex-col`** with a fixed header and a scrolling body, so the title and
  close button stay put while the content scrolls.

**Bottom sheet** — the builder's mobile palette and config, below `lg`:

```vue
<div class="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-white shadow-pop lg:hidden">
  <div class="mx-auto mt-2 h-1 w-9 rounded-full bg-ink-200" aria-hidden="true" /> <!-- grab handle -->
```

- **`translate-y-full → 0`**, same durations as the side drawer.
- **`rounded-t-2xl` + a grab handle.** The handle is decorative (`aria-hidden`) but
  it's the convention that tells a thumb this thing came from the bottom.
- **`max-h-[75vh]`** — a sheet that covers the whole screen is a page, and it
  breaks the user's sense of what's behind it.
- **Same content, different container.** The mobile sheets render the *same*
  `FieldPalette` and `FieldConfigPanel` as the desktop columns. One component, two
  presentations — never a mobile fork.

---

## Side Panel

The one non-blocking surface: the builder's desktop columns.

```vue
<div class="flex min-h-0 flex-1">
  <FieldPalette class="hidden w-64 shrink-0 border-r border-line-200 lg:block" />
  <main class="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6"><BuilderCanvas /></main>
  <aside class="hidden w-80 shrink-0 overflow-y-auto border-l border-line-200 bg-white p-4 lg:block">
    <FieldConfigPanel v-if="builder.selectedField" :key="builder.selectedField.id" :field="…" />
    <FormSettingsPanel v-else />
  </aside>
</div>
```

- **No scrim, no dismissal, no `role="dialog"`.** It isn't an overlay — it's part
  of the layout. Giving a persistent panel dialog semantics would trap screen
  readers inside it.
- **Fixed widths, `shrink-0`, canvas takes the slack.** `w-64` palette, `w-80`
  config. The canvas is `flex-1 min-w-0` — `min-w-0` is what stops a wide field
  from pushing the panels off-screen.
- **Each panel scrolls independently** (`overflow-y-auto` per column), so a long
  field list never scrolls the canvas away.
- **`:key` on the selected field id** forces a fresh panel per selection instead
  of Vue patching one field's values onto another's inputs. This is the kind of
  bug that shows up as "my label from the last field is still in the box".
- **Empty state is a different panel, not an empty one:** no field selected →
  `FormSettingsPanel`. A blank 320px column is wasted space.
- **`hidden lg:block` — the panel doesn't shrink, it converts.** Below `lg` these
  become the bottom sheets above. Squeezing three columns onto a phone helps
  nobody.

---

## Confirm Dialog

`UiConfirmDialog` — the only one of these that's a real reusable component,
because it's the only one whose content is genuinely uniform.

```vue
<UiConfirmDialog
  :open="confirming"
  title="Delete this form?"
  message="Its responses will be deleted too. This can't be undone."
  confirm-label="Delete form"
  @confirm="destroy" @cancel="confirming = false"
/>
```

| Prop | Notes |
|---|---|
| `title` | A question. "Delete this form?" |
| `message` | The consequence, in plain words |
| `confirmLabel` | The verb — "Delete form", never "OK" |
| `confirmVariant` | `danger` (default) or `primary` |
| `confirmDisabled` | For type-to-confirm gates |
| *default slot* | Extra body content — e.g. the type-to-confirm input |

- **`role="alertdialog"`, not `role="dialog"`.** It's the correct role for an
  interruption requiring a response, and screen readers treat it with more
  urgency.
- **Focus lands on Cancel, not Confirm** — deliberate, and the one detail people
  get wrong. A destructive dialog where Enter immediately deletes is a trap;
  the safe action gets the default.
- **Cancel is `ghost`, Confirm is `danger`.** Weight follows consequence, not
  frequency. Cancel is the easy path *because* it's the quiet one.
- **`max-w-xl` + `pt-[20vh]`** — sits lower and narrower than a working modal, so
  it reads as a question, not a workspace.

**When not to use it.** Principle 2 says prefer *delete instantly + Undo toast*
wherever the loss is recoverable. A confirm dialog is for genuinely unrecoverable
things — deleting a form with its responses, deleting an account. Confirming a
recoverable action just trains people to click through dialogs, which is what
makes the real one fail.

---

## Accessibility

**In place today:**

- `role="dialog"` / `role="alertdialog"` with `aria-modal="true"` and an
  `aria-label` on every overlay.
- Teleported to `body`, so nothing inherits a broken stacking context.
- `Esc` closes; scrim click closes; a labelled `×` button closes.
- `UiConfirmDialog` moves focus into the dialog on open (`nextTick` → focus
  Cancel); `SearchModal` focuses its input; `AiGenerateModal` autofocuses its
  textarea.
- Every focusable control inside carries `focus-visible:ring-2 ring-brand-300`.

**Gaps — these are real and they're the meaningful ones:**

- **No focus trap.** Tab from the last control inside a dialog moves focus into
  the page behind it, which stays fully interactive. This is the single biggest
  accessibility gap in the codebase: a keyboard user can walk out of a modal and
  operate the app underneath without knowing the dialog is still open. Fix with a
  trap that cycles Tab/Shift+Tab within the dialog, or by marking the background
  `inert` while open.
- **No focus restore on close.** Focus should return to the element that opened
  the dialog. Today it lands wherever the DOM leaves it — usually `body`, meaning
  the next Tab starts from the top of the page.
- **No body scroll lock.** The page scrolls behind an open overlay. Add
  `overflow: hidden` on `<body>` while any overlay is open.
- **`Esc` depends on focus being inside.** `@keydown.esc` sits on the backdrop
  div, so it only fires when focus is within the overlay. It works today *because*
  each dialog moves focus in — but a future dialog that doesn't will silently lose
  Esc. A document-level listener would be more robust.
- **Background isn't hidden from assistive tech.** With `aria-modal="true"` most
  screen readers handle this, but `inert` on the app root is the belt-and-braces
  fix and would solve the focus trap at the same time.

The bottom sheets and the template drawer share all of the above — they're
`aria-modal` surfaces with the same missing trap.

---

## Motion

From [motion](../01-foundations/motion.md): **exits are faster than enters**,
`ease-soft` everywhere, `transform`/`opacity` only.

| Surface | Enter | Exit |
|---|---|---|
| Scrim | fade in, `200ms` (search: `150ms`) | fade out, `150ms` |
| Drawer (side) | `translate-x-full → 0`, `200ms` | slide back, `150ms` |
| Bottom sheet | `translate-y-full → 0`, `200ms` | slide down, `150ms` |
| Search modal resize | `max-width` + `height`, `500ms` | — |
| Modal / confirm dialog | *none today* | *none today* |

- **`AiGenerateModal` and `UiConfirmDialog` have no transition at all** — plain
  `v-if`, so they pop in and out instantly. motion.md specifies a scrim fade plus
  a dialog fade + `scale 0.97 → 1` + 8px rise. `(gap)` Worth closing: an instant
  appearance is the one thing that makes a dialog feel like an error message.
- **Scrim and panel animate separately.** Opacity on one, transform on the other —
  never a single transition covering both.
- **The search modal's `500ms` resize is a deliberate exception** to the ~300ms
  ceiling. It's a container changing size, not a state changing; treat it as the
  exception, not a new default.
- **Never animate a dialog's position** to follow content. Anchor it and let it
  grow downward.
- **Reduced motion:** everything above becomes instant. Overlays still appear and
  disappear — they just don't travel.

---

## Do's & Don'ts

**Do**

- ✅ Teleport every overlay to `body`.
- ✅ Use `bg-ink-900/40` for every scrim, `z-40` scrim / `z-50` surface.
- ✅ Give every overlay a labelled close button, plus Esc and scrim click.
- ✅ Move focus into the dialog on open.
- ✅ Focus Cancel — never Confirm — in a destructive dialog.
- ✅ Anchor dialogs from the top and let them grow down.
- ✅ Convert side panels into sheets on small screens, using the same components.
- ✅ Animate scrim and panel separately: opacity vs transform.

**Don't**

- ❌ Open a modal from a modal.
- ❌ Center a dialog vertically if its height changes.
- ❌ Give a persistent side panel `role="dialog"`.
- ❌ Confirm an action that Undo could cover.
- ❌ Animate `left`/`right`/`top` on a drawer — use `translate`.
- ❌ Let a scrim click silently discard typed input.
- ❌ Ship a new overlay without focus handling — the trap gap is already the
  weakest point here; don't widen it.
