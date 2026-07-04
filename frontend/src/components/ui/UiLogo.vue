<script setup lang="ts">
// The Vedya brand lockup — the single source of truth for logo + wordmark, so a
// rebrand is one edit here, not a hunt across every header. The mark lives at
// /vedya-logo.png (public/). Wordmark colour inherits (currentColor) so parents
// on dark or light surfaces control it.
withDefaults(defineProps<{ size?: "sm" | "md" | "lg"; wordmark?: boolean }>(), {
  size: "md",
  wordmark: true,
});

const MARK = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-9 w-9" } as const;
const TEXT = { sm: "text-sm", md: "text-base", lg: "text-lg" } as const;
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <img
      src="/vedya-logo.png"
      alt="Vedya"
      draggable="false"
      :class="MARK[size]"
      class="object-contain"
    />
    <span
      v-if="wordmark"
      :class="TEXT[size]"
      class="font-semibold tracking-tight"
      >Vedya</span
    >
  </span>
</template>
