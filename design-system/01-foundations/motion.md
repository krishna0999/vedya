# Motion

How things move. Motion communicates state — it is feedback, not decoration
(Principle 4). Every animation earns its place by explaining a change; if it only
looks nice, it's cut. Built from the motion tokens in
[design-tokens](../01-foundations/design-tokens.md).

Related: [design-tokens](../01-foundations/design-tokens.md) · [design-principles](../01-foundations/design-principles.md)

---

## Motion philosophy

- **Motion explains, never entertains.** Every animation answers "what just
  changed?" — something appeared, opened, loaded, moved. No idle or ambient
  motion.
- **Quick and calm.** ~130–200ms, soft ease-out. Long enough to perceive, short
  enough to never make the user wait. Speed is trust (Principle 8).
- **Never blocks.** Motion runs *while* the user acts, never gates interaction
  behind an animation. You can click through a fade.
- **Consistent.** One easing curve, a tiny timing scale — the same transition
  everywhere for the same kind of change (Principle 6).
- **Respectful.** Honors `prefers-reduced-motion` — always.
- **Cheap.** Animate `transform` and `opacity` (GPU, no layout) — not
  `width`/`height`/`top`, which cause layout thrash and jank.

---

## Timing scale

From the tokens — small on purpose.

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | `130ms` | hover, press, focus, small toggles |
| `--dur-base` | `180ms` | panels, reorders, most state transitions |
| `--dur-slow` `(planned)` | ~260ms | large surface entrances (modal, drawer) |

Nothing exceeds ~300ms. If it feels slow, it is — shorten it. Enter can be a
touch slower than exit; exits should feel snappy (~100–130ms) so dismissing never
lags.

---

## Easing curves

One curve for virtually everything.

| Token | Value | Use |
|---|---|---|
| `--ease-soft` / `ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | **default** — a soft ease-out that decelerates into rest |
| `linear` | — | continuous spinners / progress only |
| `ease-in` | (avoid) | exits that should accelerate away — rare |

`--ease-soft` is an ease-*out*: fast start, gentle settle. It makes things feel
like they arrive naturally. Don't invent new curves.

---

## Hover animations

- Duration `--dur-fast` (130ms), `ease-soft`.
- Property-scoped: `transition-colors` for fills, `transition-transform` for lift.
- Typical: background shift (`bg-brand-600` → `brand-700`), subtle text-color
  change, or a 1–2px lift (`-translate-y-0.5`) on cards.
- Never animate a hover on touch devices as a "stuck" state — hover is
  pointer-only; core actions never depend on it.

## Focus animations

- The focus ring appears instantly-ish: `--dur-fast`, `ease-soft`.
- Ring = `shadow-focus` (`0 0 0 3px rgba(99,102,241,0.35)`), driven by
  `focus-visible` (keyboard), not `focus` (avoids ring-on-click noise).
- Never animate focus so slowly that keyboard users outrun the ring. Never remove
  focus transition entirely — the grow reads as "you are here."

---

## Button animations

| State | Motion |
|---|---|
| Hover | `bg` shift, `--dur-fast` |
| Active/press | scale down `active:scale-[0.98]`, `--dur-fast` |
| Focus | `shadow-focus` ring |
| Loading | label swaps to inline spinner; width held to avoid layout shift |
| Disabled | no motion; `opacity-40`, no hover |

Press feedback (the tiny scale) is the single most important button animation —
it confirms the tap landed. Keep it subtle.

## Card animations

- **Enter** (new card in a list): fade + 4–8px rise, `--dur-base`.
- **Hover** (interactive card): `shadow-card` → slightly stronger + 1–2px lift.
- **Reorder:** animate position with `transform`, `--dur-base` (see Drag & Drop).
- Idle cards don't move. No hover lift on non-interactive cards.

---

## Modal animations

| Part | Enter | Exit |
|---|---|---|
| Scrim | fade `0 → 60%` opacity, `--dur-base` | fade out, ~130ms |
| Dialog | fade + scale `0.97 → 1` + 8px rise, `--dur-slow`/`--dur-base`, `ease-soft` | fade + slight scale down, snappy |

- Focus moves into the dialog on open; returns to the trigger on close.
- Scrim click and `Esc` both close (unless a destructive confirm). Exit is faster
  than enter — dismissing should feel instant.

## Drawer animations

- **Slide** from the edge (usually right): `translate-x-full → 0`, `--dur-base`,
  `ease-soft`, with a scrim fade.
- Exit slides back out, ~130–150ms.
- Slide uses `transform` (cheap), never `right`/`left` position.
- Config panel in the builder can be a persistent panel (no slide) rather than a
  drawer on wide screens; drawer only when it overlays on narrow.

## Toast animations

- **Enter:** slide-in from edge + fade, `--dur-base`. Typically bottom or
  top-right.
- **Exit:** fade + slight slide, ~130ms.
- Auto-dismiss after ~4s (longer for actionable toasts with an Undo). Stack with a
  small `space-y` and animate reflow when one leaves.
- Undo toasts (e.g. delete a field) must stay long enough to act (~6s) — the whole
  point of "delete instantly, offer undo" (Principle 2).

---

## Loading animations

- **Skeletons over spinners** (Principle 8): shimmer/pulse placeholders in the
  real layout, so there's no layout shift when data lands. `UiSkeleton` exists for
  this.
- **Spinner** only for short, indeterminate inline waits (button loading). Linear
  easing, continuous.
- **Progress bar** for determinate work (upload, export). Animate width with
  `transition` + `ease-soft`... but `transform`-based scale-x preferred for perf.
- Never show a full-page blank spinner where a skeleton of the real layout would
  do.

## Drag & drop animations

The builder's core interaction — reordering fields.

- **Lift:** on grab, the item rises — slight scale (`1.02`) + stronger shadow
  (`shadow-pop`), `--dur-fast`.
- **Follow:** dragged item tracks the pointer via `transform` (no transition on
  the drag itself — it must feel 1:1 with the cursor).
- **Displace:** other items slide to make room, `--dur-base`, `ease-soft`.
- **Drop:** item settles into the gap with a quick `ease-soft` transform, shadow
  returns to `shadow-card`.
- **Placeholder:** show a clear insertion indicator (a brand-tinted gap/line), not
  a jump.
- Respect reduced-motion: keep the reorder functional, drop the displacement
  animation.

## Builder animations

- **Add field:** new field fades + rises into the canvas, `--dur-base`; briefly
  highlights (brand tint fading out) so the eye finds it.
- **Delete field:** collapses (height + fade) then removed; Undo toast appears.
- **Select field:** config panel content cross-fades to the selected field's
  settings, `--dur-fast`.
- **Palette → canvas:** the drag mirror animation above.
- Canvas motion should mirror the renderer's feel — the canvas *is* the renderer.

## Chart animations

Charts live in the responses/analytics views.

- **On load:** bars grow from baseline / lines draw in, `--dur-base` to
  `--dur-slow`, `ease-soft`. Once.
- **On data change:** tween between values, don't re-animate from zero (jarring).
- **Hover:** tooltip fades in `--dur-fast`; hovered element subtly emphasized.
- No looping or decorative chart motion — a chart animates once to orient, then
  holds still.

---

## Page transitions

- **Keep them minimal.** A subtle content fade (`--dur-fast`–`--dur-base`) between
  routes; no heavy slide/zoom page choreography.
- **No transition that delays content.** The next screen's content should be
  usable immediately; the fade is cosmetic and non-blocking.
- **Preserve layout:** shared chrome (sidebar, header) stays put; only the content
  region transitions.
- **The public form loads fast, plain.** The renderer prioritizes speed over
  entrance flourish — a stranger on a slow phone gets content, not animation.

---

## Reduced motion support

Non-negotiable (accessibility). Honor `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Replace *movement* with instant state change — things still appear/disappear,
  just without travel or scale.
- Keep essential feedback (focus ring, loading indicator) — reduced motion means
  *less movement*, not *no feedback*.
- Drag & drop stays fully functional; only the decorative displacement/lift
  animations drop.
- Test the whole product with the setting on — nothing should break or become
  unusable.

---

## Motion do's & don'ts

**Do**

- ✅ Use `ease-soft` and the two timing tokens for everything.
- ✅ Animate `transform` / `opacity` (cheap, no layout).
- ✅ Give every button a subtle press feedback.
- ✅ Make exits faster than enters.
- ✅ Use skeletons in the real layout to avoid shift.
- ✅ Honor `prefers-reduced-motion` everywhere.

**Don't**

- ❌ Animate for decoration — if it doesn't signal a change, cut it.
- ❌ Exceed ~300ms or invent new easing curves.
- ❌ Block interaction behind an animation.
- ❌ Animate `width`/`height`/`top`/`left` (jank) when a transform works.
- ❌ Loop or idle-animate anything.
- ❌ Depend on hover for a core action (touch has no hover).
- ❌ Ship the public renderer with heavy entrance choreography.
