# Design Principles

The foundation every future design decision follows. When two options are both
"fine," the one that better serves these principles wins. When a principle and a
personal preference conflict, the principle wins.

These are not aspirations — they are the tie-breakers we actually use in review.

---

## Product vision

We build a form builder people trust with real data. A creator designs a form in
a visual editor, publishes it, shares one link, and collects responses — Tally /
Typeform / Google Forms category.

The general builder is the **cost of entry, not the product.** It has to be
*credible* — clean, fast, safe to type into — not gold-plated. The moat comes
later, from what we layer on the same engine: logic/quiz/calculator forms, forms
that take payments, forms that trigger workflows. So design serves two people at
once:

- **The creator** must feel the builder is a serious tool — precise, quiet, fast.
- **The respondent** — a stranger on a phone — must feel safe enough to type real
  data into a form we rendered. Trust is earned in the first three seconds.

Every screen we design is measured against those two feelings. Polish here is not
vanity; it is the thing that makes a stranger hit submit.

## UX goals

What "good" means for us, concretely enough to test against:

1. **Trustworthy on first sight.** A respondent believes the form is real and
   their data is safe before reading a single field.
2. **Obvious without instruction.** Creator and respondent both know what to do
   next with no tutorial, no tooltip crutch.
3. **Fast enough to feel free.** Input responds instantly; nothing blocks the
   user mid-thought.
4. **Forgiving.** Mistakes are cheap to undo; destructive actions are the only
   ones that ask twice.
5. **Consistent everywhere.** A control learned in one place behaves identically
   in the next — zero re-learning cost.
6. **Usable by everyone.** Keyboard, screen reader, mobile, reduced-motion — all
   first-class, not afterthoughts.

If a design advances one of these without costing another, ship it. If it trades
one for another, that's a review conversation, not a solo call.

---

## The principles

### 1. Everything should feel obvious

A user should never have to guess what a control does or where they are. Labels
say what they mean. The primary action on any screen is the visually loudest
thing. If a feature needs a tooltip to be understood, the design isn't finished.

**Apply it:** one clear primary action per view; plain-language labels over
clever ones; no hidden gestures for core tasks.

### 2. Reduce clicks

Every extra click, modal, or confirmation is friction the user pays for. Default
to sensible values so most people never touch a setting. Remove steps before you
optimize them.

**Apply it:** smart defaults over required choices; inline editing over
navigate-away; confirm only destructive or irreversible actions.

### 3. Whitespace is intentional

Space is a design element, not leftover room. Generous, consistent spacing makes
a product feel calm and trustworthy — the feeling a stranger needs before typing
real data into a form. Crowding reads as "cheap."

**Apply it:** spacing comes from the scale in [design-tokens](design-tokens.md),
never arbitrary pixels; group related things tightly, separate unrelated things
clearly; let content breathe.

### 4. Motion communicates state

Animation exists to explain what changed — an item appeared, a panel opened,
something is loading. It is feedback, not decoration. Motion is quick
(~150–200ms), eased, and never blocks the user from acting.

**Apply it:** animate state transitions, not idle elements; respect
`prefers-reduced-motion`; if an animation only exists to look nice, cut it.

### 5. Keyboard accessibility first

Every interaction works from the keyboard before we call it done. Because our
`Ui*` controls replace native ones, we owe them the behavior the native control
gave for free: focusable, operable, with a visible `focus-visible` ring and
correct ARIA. A custom checkbox a keyboard can't toggle is a bug.

**Apply it:** tab order follows reading order; visible focus everywhere; real
`<label>`s and ARIA on custom controls; nothing mouse-only.

### 6. Consistency over creativity

A component looks and behaves the same everywhere. Novelty per screen is a cost
users pay in re-learning. Reach for an existing primitive and token before
inventing a new pattern — creativity goes into the product's hard problems, not
into restyling a button.

**Apply it:** reuse `Ui*` primitives and tokens; if you need a new variant, add
it to the component, don't fork it per screen; retune the brand by editing
tokens, not components.

### 7. AI assists, never interrupts

AI features are on tap, never in the way. They suggest, draft, and speed things
up when invoked — they don't hijack focus, auto-apply changes, or block the
manual path. The user stays in control and can always ignore the assist.

**Apply it:** AI is opt-in per action; suggestions are previewable and
dismissible; there is always a manual way to do the same thing.

### 8. Performance is a feature

Speed is part of the design. A fast, responsive interface feels trustworthy;
jank and spinners feel broken. Perceived performance counts — optimistic UI,
instant feedback, and skeletons over blank waits.

**Apply it:** respond to input immediately; validate on the client for instant
feedback (the server stays authoritative); avoid layout shift; don't ship what
you can defer.

### 9. Tokens are the only source of visual truth

No hardcoded hex, pixel, or duration in a component — ever. Color, spacing,
radius, shadow, type, and motion all come from tokens. Retuning the brand is one
file edit, not a hunt through components.

**Apply it:** reference tokens, never literals; a new value goes into the token
scale first; if you're typing `#`, stop.

### 10. Two theme layers stay separate

Our **product theme** (app chrome — builder, dashboard) and the creator's
**form theme** (`FormVersion.theme`, scoped to the rendered form) never bleed
into each other. Our brand never bakes into a published form; a creator's pink
never leaks into our panels.

**Apply it:** `FormRenderer` themes purely from `FormVersion.theme` via scoped
CSS variables; product chrome uses only product tokens.

### 11. Custom controls, never raw browser chrome

Every interactive element in our surface is a styled `Ui*` primitive. Native
`<select>`, checkbox, radio, and file inputs are visually replaced — custom
chevron, check, radio, rating. If it looks like an unstyled HTML element, it's a
bug.

**Apply it:** no default browser controls in the app or renderer; build the
primitive once, consume it everywhere.

### 12. Trust is the feature

Above all: a stranger has to feel safe. Clarity, restraint, and polish exist so
that real people give us real data. When a decision would make the product
flashier but less trustworthy, trust wins.

**Apply it:** quiet over loud; honest states over hype; never dark-pattern a
respondent into anything.

---

## Interaction philosophy

- **Direct over modal.** Edit in place where possible. A modal is a small
  interruption — reserve it for focused, one-thing-at-a-time tasks (confirm a
  delete, name a thing), not for work the user does repeatedly.
- **Immediate feedback.** Every action acknowledges itself within one frame —
  a state change, a subtle motion, a toast. The user never wonders "did that
  work?"
- **Optimistic, then reconciled.** Assume success, update the UI now, reconcile
  with the server after. On failure, roll back visibly and explain.
- **Forgiving by default.** Undo over confirm. Ask twice only for the
  irreversible.
- **Progressive disclosure.** Show the common path; tuck advanced options behind
  a clear "more." Depth is available, never in the way.
- **One primary action per surface.** Everything else is secondary or tertiary,
  visually. Ambiguity about "the button to press" is a design failure.

## AI philosophy

AI is a power tool the user picks up, not a co-pilot that grabs the wheel.

- **Invoked, not ambient.** AI acts when asked (generate this form, rewrite this
  field), never on its own while the user is doing something else.
- **Preview before apply.** AI output is shown as a proposal the user accepts,
  edits, or discards. Nothing lands unreviewed.
- **Always a manual path.** Anything AI can do, the user can do by hand. AI is a
  shortcut, never the only door.
- **Honest about itself.** AI-generated content is labeled as such while it's a
  draft. No pretending a machine suggestion is a human certainty.
- **Interruptible and dismissible.** The user can cancel, ignore, or close any
  assist with zero cost and no nagging.

## Performance philosophy

Perceived speed is the product; measured speed is how we get there.

- **Instant input.** Keystrokes, clicks, and drags respond immediately. Client
  validation gives instant feedback; the server stays authoritative
  (never trust the client — it re-validates every submission).
- **No layout shift.** Reserve space for content that's loading. Things don't
  jump.
- **Skeletons over spinners, spinners over blanks.** Show structure while data
  arrives; a blank wait reads as broken.
- **Defer what isn't needed now.** Lazy-load the heavy, the below-the-fold, the
  rarely-used. Ship the smallest thing that renders the first meaningful view.
- **The public renderer is sacred.** It loads for strangers on slow phones.
  Keep it lean — every kilobyte is a bit of trust.

## Accessibility philosophy

Accessibility is part of polish, not a compliance checkbox. Because we replace
native controls, we inherit the full responsibility for the behavior they gave
for free.

- **Keyboard-complete.** Every task is doable with a keyboard alone, in a tab
  order that follows reading order.
- **Visible focus, always.** `focus-visible` rings on everything interactive.
  Never `outline: none` without a replacement.
- **Real semantics.** Real `<label>`s, correct roles, and ARIA on every custom
  control. A custom checkbox announces itself and toggles like a checkbox.
- **Respect the user's settings.** Honor `prefers-reduced-motion` and
  `prefers-color-scheme`. Motion and color are enhancements, never requirements.
- **Contrast that passes.** Text and interactive elements meet WCAG AA against
  their background — in both the product theme and whatever a creator picks for
  their form theme (warn creators when their choice fails).
- **Not mouse-, sight-, or precision-dependent.** Hit targets are comfortable on
  touch; nothing relies on hover alone; nothing relies on color alone to convey
  meaning.

---

## Examples of good vs bad decisions

Concrete calls, so the principles have teeth.

| Situation | ✅ Good | ❌ Bad |
|---|---|---|
| Saving a draft | Autosave silently, show a quiet "Saved" state | A "Save" button the user must remember to press |
| Deleting a field | Delete instantly with an Undo toast | A modal asking "Are you sure?" every single time |
| Styling a select dropdown | Custom `UiSelect` with a themed chevron, keyboard-operable | Native `<select>` with default OS chrome |
| A required field fails validation | Inline message under the field, on blur, in plain language | A red banner at the top listing errors by field number |
| AI generates a form | Show it as an editable draft the user accepts or discards | Auto-replace the current form the moment AI finishes |
| Spacing a new panel | Use the token spacing scale | Eyeball `padding: 13px` to make it "look right" |
| Brand accent in a published form | Renderer themes from `FormVersion.theme` only | Our indigo bleeds into the creator's form output |
| Loading the responses table | Skeleton rows in the real layout | A centered spinner on a blank page |
| A new button variant is needed | Add the variant to `UiButton` | Copy the button markup and restyle it on this screen |
| Focus states | Visible `focus-visible` ring on every control | `outline: none` for a "cleaner" look |
| Motion on a list reorder | ~180ms eased transition, skipped under reduced-motion | A 600ms bounce that plays every render |
| Advanced field options | Behind a "More options" disclosure | All 15 options shown flat on every field |

---

**Direction these serve:** warm & approachable, professional. Soft surfaces,
comfortably rounded corners, an indigo/violet brand accent, generous spacing,
subtle motion. Friendly, never toy-like — Notion/Typeform warmth with the
precision of a real product.

Related: [design-tokens](design-tokens.md) · [product-personality](product-personality.md)
