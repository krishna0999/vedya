<script setup lang="ts">
// Owner-app shell: persistent left sidebar on md+, bottom tab bar (app-style)
// below md. Every authed page wraps its content in this so primary navigation
// never disappears. Active state derives from the route; items are plain links.
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import UiLogo from '@/components/ui/UiLogo.vue';

const route = useRoute();
const active = computed<'dashboard' | 'templates' | null>(() => {
  if (route.name !== 'dashboard') return null;
  return route.query.view === 'templates' ? 'templates' : 'dashboard';
});

const sideClass = (view: 'dashboard' | 'templates') => [
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
  view === active.value
    ? 'bg-brand-50 text-brand-700'
    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
];
const tabClass = (view: 'dashboard' | 'templates') => [
  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
  view === active.value ? 'text-brand-700' : 'text-ink-500',
];
</script>

<template>
  <div class="flex h-dvh bg-ink-50 text-ink-900">
    <!-- Desktop sidebar -->
    <aside class="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white md:flex">
      <div class="px-5 py-4">
        <UiLogo />
      </div>
      <nav class="flex flex-col gap-1 px-3 py-2" aria-label="Primary">
        <router-link
          :to="{ name: 'dashboard' }"
          :class="sideClass('dashboard')"
          :aria-current="active === 'dashboard' ? 'page' : undefined"
        >
          <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" /></svg>
          Dashboard
        </router-link>
        <router-link
          :to="{ name: 'dashboard', query: { view: 'templates' } }"
          :class="sideClass('templates')"
          :aria-current="active === 'templates' ? 'page' : undefined"
        >
          <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 4h5v12H4V4zm7 0h5v5h-5V4zm0 7h5v5h-5v-5z" /></svg>
          Templates
        </router-link>
      </nav>
    </aside>

    <!-- Page content scrolls inside this column; mobile bottom padding keeps it
         clear of the tab bar. h-full children (builder) fill exactly the space
         above the bar. -->
    <div class="flex min-w-0 flex-1 flex-col overflow-y-auto pb-14 md:pb-0">
      <slot />
    </div>

    <!-- Mobile bottom tab bar -->
    <nav
      class="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      <router-link
        :to="{ name: 'dashboard' }"
        :class="tabClass('dashboard')"
        :aria-current="active === 'dashboard' ? 'page' : undefined"
      >
        <svg viewBox="0 0 20 20" fill="none" class="h-5 w-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" /></svg>
        Dashboard
      </router-link>
      <router-link
        :to="{ name: 'dashboard', query: { view: 'templates' } }"
        :class="tabClass('templates')"
        :aria-current="active === 'templates' ? 'page' : undefined"
      >
        <svg viewBox="0 0 20 20" fill="none" class="h-5 w-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M4 4h5v12H4V4zm7 0h5v5h-5V4zm0 7h5v5h-5v-5z" /></svg>
        Templates
      </router-link>
    </nav>
  </div>
</template>
