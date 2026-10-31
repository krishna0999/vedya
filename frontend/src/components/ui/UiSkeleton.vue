<script setup lang="ts">
// Placeholder block for loading states: a soft pulse plus a shimmer sweep.
// Size/shape it with utility classes at the call site (h-*, w-*, rounded-*).
// Purely decorative — the containing loader carries the "Loading…" announcement.
</script>

<template>
  <div class="skeleton rounded-md bg-ink-200/70" aria-hidden="true"></div>
</template>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
}
/* The sweep is a highlight travelling across the block, on top of the pulse. */
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.65),
    transparent
  );
  animation: skeleton-sweep 1.6s ease-in-out infinite;
}
@keyframes skeleton-sweep {
  100% {
    transform: translateX(100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}
</style>
