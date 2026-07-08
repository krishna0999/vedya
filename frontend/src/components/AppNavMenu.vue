<script setup lang="ts">
// App-chrome nav: pages without the dashboard sidebar (builder, responses) put
// this in their header — the logo doubles as a menu holding the same primary
// destinations the sidebar lists (dashboard, templates), so every owner surface
// can reach them.
import { onBeforeUnmount, ref } from 'vue';
import UiLogo from '@/components/ui/UiLogo.vue';

const open = ref(false);
const root = ref<HTMLElement | null>(null);

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
function openMenu(): void {
  open.value = true;
  document.addEventListener('mousedown', onDocPointer);
}
function close(): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener('mousedown', onDocPointer);
}
function toggle(): void {
  open.value ? close() : openMenu();
}

onBeforeUnmount(() => document.removeEventListener('mousedown', onDocPointer));
</script>

<template>
  <div ref="root" class="relative shrink-0" @keydown.escape="close">
    <button
      type="button"
      class="flex items-center gap-1 rounded-lg px-1.5 py-1 transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Navigation menu"
      @click="toggle"
    >
      <UiLogo :wordmark="false" size="sm" />
      <svg class="h-3.5 w-3.5 text-ink-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8l4 4 4-4" /></svg>
    </button>

    <transition
      enter-active-class="transition duration-150 ease-soft"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-soft"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        role="menu"
        class="absolute left-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-pop"
      >
        <router-link
          role="menuitem"
          :to="{ name: 'dashboard' }"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50"
          @click="close"
        >
          <svg class="h-4 w-4 text-ink-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" /></svg>
          Dashboard
        </router-link>
        <router-link
          role="menuitem"
          :to="{ name: 'dashboard', query: { view: 'templates' } }"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50"
          @click="close"
        >
          <svg class="h-4 w-4 text-ink-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 4h5v12H4V4zm7 0h5v5h-5V4zm0 7h5v5h-5v-5z" /></svg>
          Templates
        </router-link>
      </div>
    </transition>
  </div>
</template>
