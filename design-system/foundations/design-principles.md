# Design Principles

These eight principles decide every UI argument before it starts. When two designs
are both "fine," the one that better serves a principle wins. When a principle and
a deadline conflict, we cut scope, not the principle.

There are two users to design for, and they are not the same person:

- **The builder** — creates forms in our app. Sees the dashboard, builder, settings,
  submissions. Tolerates density and power-user features.
- **The respondent** — fills out a published form, often on a phone, often once,
  with zero patience. Sees only the rendered form. Tolerates nothing.

Each principle notes which side it bites hardest.

---

## 1. Everything should feel obvious

Nobody reads documentation for a form builder. If a feature needs explaining, the
design has failed — redesign it before writing a tooltip.

- Controls are labeled by outcome, not mechanism: "Close form after 100 responses,"
  not "Submission limit threshold."
- The builder canvas always shows what the respondent will see. No abstract
  representation that requires a "preview" to decode.
- One primary action per screen. On the builder it's **Publish**. Everything else
  is visually subordinate.
- _Test:_ a first-time user creates and publishes a working form without leaving
  the happy path or opening help.

## 2. Reduce clicks

Every click is a small tax. Charge it only when the user gets something for it.

- Inline editing everywhere: click a question's label to edit it in place. No
  "edit mode," no side-trip to a panel for text changes.
- New forms start ready-to-type, not with an empty-canvas ceremony.
- Defaults do the work: a new field arrives with a sensible label, type, and
  validation so "add, type, done" is the normal loop.
- Never ask for confirmation on reversible actions. Delete a field → toast with
  **Undo**. Confirmation dialogs are reserved for the genuinely destructive
  (deleting a form with submissions).
- Applies double to respondents: never add a step to the fill-out flow that
  benefits us instead of them.

## 3. Whitespace is intentional

Premium feel is mostly spacing discipline. Cramped UI reads as cheap; consistent
breathing room reads as confident.

- All spacing comes from the token scale. If a margin isn't a token value, it's
  a bug.
- Density is chosen per surface, not per component: the builder canvas is airy
  (it mirrors the respondent's view), data tables are compact, settings pages
  sit in a single readable column with generous section gaps.
- Whitespace is the default grouping mechanism. Reach for borders and boxes only
  when spacing alone can't express the hierarchy.

## 4. Motion communicates state

Animation is information: something appeared, moved, saved, or failed. If a
motion doesn't carry information, it's decoration — cut it.

- Reordering fields animates so the builder sees where the field landed.
- Saves are quiet (subtle "Saved" that fades), errors are not.
- Durations and easings are tokens. No component invents its own timing.
- Everything respects `prefers-reduced-motion`.

## 5. Keyboard accessibility first

Power users live on the keyboard; accessibility requires it; and keyboard-first
design forces clear focus states, which make the whole UI sharper.

- The entire builder is operable without a mouse: add field, edit, reorder
  (not just drag-and-drop), publish.
- Focus is always visible and never trapped. Modals return focus on close.
- Respondent forms are flawless with Tab/Enter — many respondents fill forms
  keyboard-only, and screen readers depend on it.

## 6. Consistency over creativity

Creativity is spent once, in the system. Screens then apply the system. A
"clever" one-off interaction on one screen is a cost every other screen pays.

- Same action, same name, same position, everywhere. "Publish" is never
  "Go live" somewhere else.
- One component per job. A second dropdown variant needs a documented reason
  or it doesn't ship.
- The respondent-facing form is where restraint matters most: it renders
  thousands of different builders' forms, so it must feel neutral, calm, and
  trustworthy — the builder's brand is the star, not ours.

## 7. AI assists, never interrupts

If we ship AI features (generate a form from a prompt, suggest questions),
they are passengers, not drivers.

- AI output is always a draft the user reviews — never auto-applied,
  never auto-published.
- Suggestions appear in dedicated, dismissible surfaces. No popovers that
  steal focus mid-typing, ever.
- AI features degrade gracefully: the product is fully usable with every AI
  affordance ignored or disabled.

## 8. Performance is a feature

Speed is the most premium feeling there is. A 200ms interface with plain
styling feels better than a beautiful one that stutters.

- Respondent forms are the hard budget: fast first paint on mid-range mobile,
  minimal JS, no layout shift. This page is our reputation — it's the only
  part of the product most humans ever see.
- Builder interactions (typing, dragging, toggling) respond instantly;
  network work happens optimistically in the background.
- Perceived speed counts: skeletons over spinners, optimistic UI over
  "loading…", but never fake progress.

---

## Using these principles

- **In review:** name the principle a change serves or violates. "This adds a
  confirmation dialog on a reversible action — principle 2" ends the debate.
- **In conflict:** obviousness (1) beats click-count (2); accessibility (5)
  beats motion (4); respondent performance (8) beats everything on the
  public form.
- **In doubt:** do the boring, consistent thing (6).
