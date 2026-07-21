<script setup lang="ts">
// Dark bubble tooltip — wrap any trigger: <UiTooltip text="Edit"><button…/></UiTooltip>.
// Pure CSS: it reveals on hover/keyboard-focus of the wrapper, so there's no
// positioning JS, no listeners, and nothing to tear down.
//
// The group is NAMED (group/tip) on purpose — cards in this app are themselves
// `group` containers, and an unnamed group-hover would pop every tooltip on the
// card at once.
//
// `align` matters near an edge: the app's scroll column is overflow-y-auto, which
// makes overflow-x a clipping context, so a centred bubble on a control at the
// left or right of the page gets sliced off. Align it toward the inside
// (start on a left-edge control, end on a right-edge one) and it stays put.
// ponytail: alignment is a prop, not auto-flipping — that needs measurement,
// a resize/scroll listener, and a portal. Revisit if callers start guessing wrong.
//
// Decorative by design: triggers already carry their own aria-label, so the
// bubble is aria-hidden and a screen reader announces the control once.
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    placement?: "top" | "bottom" | "left" | "right";
    /** Horizontal anchor for top/bottom bubbles; ignored for left/right. */
    align?: "start" | "center" | "end";
    /** Suppress the bubble — e.g. while the trigger's own popover is open. */
    disabled?: boolean;
  }>(),
  { placement: "top", align: "center", disabled: false },
);

const VERTICAL = { top: "bottom-full mb-2", bottom: "top-full mt-2" };
const SIDE = {
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};
const ALIGN = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};
// The arrow tracks the trigger, not the bubble: with an aligned bubble it sits a
// fixed inset from that edge, which lands inside any trigger wider than ~32px.
const ARROW_ALIGN = {
  start: "left-4",
  center: "left-1/2 -translate-x-1/2",
  end: "right-4",
};
const ARROW_VERTICAL = {
  top: "top-full -mt-1.5",
  bottom: "bottom-full -mb-1.5",
};
const ARROW_SIDE = {
  left: "left-full top-1/2 -translate-y-1/2 -ml-1.5",
  right: "right-full top-1/2 -translate-y-1/2 -mr-1.5",
};

const isSide = computed(
  () => props.placement === "left" || props.placement === "right",
);
const bubbleClass = computed(() =>
  isSide.value
    ? SIDE[props.placement as "left" | "right"]
    : `${VERTICAL[props.placement as "top" | "bottom"]} ${ALIGN[props.align]}`,
);
const arrowClass = computed(() =>
  isSide.value
    ? ARROW_SIDE[props.placement as "left" | "right"]
    : `${ARROW_VERTICAL[props.placement as "top" | "bottom"]} ${ARROW_ALIGN[props.align]}`,
);
</script>

<template>
  <span class="group/tip relative inline-flex">
    <slot />
    <span
      v-if="!disabled"
      role="tooltip"
      aria-hidden="true"
      class="pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-pop transition-opacity delay-100 duration-150 ease-soft group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      :class="bubbleClass"
    >
      {{ text }}
      <span
        class="absolute h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink-900"
        :class="arrowClass"
      />
    </span>
  </span>
</template>
