<script setup lang="ts">
// Pulsing placeholder block for loading states. Size/shape it with utility
// classes at the call site (h-*, w-*, rounded-*). Purely decorative — the
// containing loader carries the accessible "Loading…" announcement.
</script>

<template>
  <div class="animate-pulse rounded bg-ink-200/70" aria-hidden="true"></div>
</template>
