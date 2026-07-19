<script setup lang="ts">
// Small status/label pill for product chrome (dashboard/builder). Brand/ink
// tokens only — never form theme. `dot` prepends a solid status dot.
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "green" | "gray" | "brand" | "amber";
    dot?: boolean;
  }>(),
  { variant: "gray", dot: false },
);

const VARIANTS = {
  green: { pill: "bg-green-50 text-green-700", dot: "bg-green-500" },
  gray: { pill: "bg-ink-100 text-ink-600", dot: "bg-ink-400" },
  brand: { pill: "bg-brand-50 text-brand-700", dot: "bg-brand-500" },
  amber: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
};

const v = computed(() => VARIANTS[props.variant]);
</script>

<template>
  <span
    class="inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
    :class="v.pill"
  >
    <span v-if="dot" class="h-1.5 w-1.5 shrink-0 rounded-full" :class="v.dot" />
    <slot />
  </span>
</template>
