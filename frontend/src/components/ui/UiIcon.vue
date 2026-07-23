<script setup lang="ts">
// Single icon primitive: looks up inner SVG markup from the shared registry and
// wraps it in a themed <svg>. `type` picks stroke (outline) vs fill (solid).
// Size and color fall back to h-5 w-5 / text-ink-500 unless the caller's class
// already sets one (e.g. class="h-4 w-4 text-brand-600"). The caller's class,
// style, and listeners fall through onto the <svg> automatically.
import { computed, useAttrs } from "vue";
import { icons, type IconName } from "@/lib/icons";

withDefaults(
  defineProps<{
    name: IconName;
    type?: "outline" | "solid";
    viewBox?: string;
  }>(),
  { type: "outline", viewBox: "0 0 24 24" },
);

const attrs = useAttrs();

// Only supply a default the caller didn't already provide, so their class wins.
const defaults = computed(() => {
  const cls = String(attrs.class ?? "");
  const size = /(?:^|\s)(?:size|[hw])-/.test(cls) ? "" : "h-5 w-5";
  const color = /(?:^|\s)text-/.test(cls) ? "" : "text-ink-500";
  return `${size} ${color}`.trim();
});
</script>

<template>
  <svg
    :class="defaults"
    :viewBox="viewBox"
    :fill="type === 'solid' ? 'currentColor' : 'none'"
    :stroke="type === 'solid' ? undefined : 'currentColor'"
    :stroke-width="type === 'solid' ? undefined : 1.5"
    aria-hidden="true"
    v-html="icons[name]"
  />
</template>
