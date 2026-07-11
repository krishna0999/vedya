<script setup lang="ts">
// Owner-app shell: persistent left sidebar on md+, bottom tab bar (app-style)
// below md. Every authed page wraps its content in this so primary navigation
// never disappears. Active state derives from the route; items are plain links.
import { computed } from 'vue';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import UiLogo from '@/components/ui/UiLogo.vue';
import UiIcon from '@/components/ui/UiIcon.vue';
import type { IconName } from '@/lib/icons';

interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  to: RouteLocationRaw;
}

// Sidebar shows both groups (workspace on top, personal pinned to the bottom);
// the mobile tab bar flattens them into one row.
const WORKSPACE: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'squares-2x2', to: { name: 'dashboard' } },
  { key: 'templates', label: 'Templates', icon: 'rectangle-group', to: { name: 'dashboard', query: { view: 'templates' } } },
  { key: 'usage', label: 'Usage', icon: 'chart-bar', to: { name: 'usage' } },
];
const PERSONAL: NavItem[] = [
  { key: 'settings', label: 'Settings', icon: 'cog-6-tooth', to: { name: 'settings' } },
  { key: 'account', label: 'Account', icon: 'user-circle', to: { name: 'account' } },
];
const ALL = [...WORKSPACE, ...PERSONAL];

const route = useRoute();
const active = computed<string | null>(() => {
  if (route.name === 'dashboard') {
    return route.query.view === 'templates' ? 'templates' : 'dashboard';
  }
  return ALL.some((i) => i.key === route.name) ? (route.name as string) : null;
});

const sideClass = (key: string) => [
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
  key === active.value
    ? 'bg-brand-50 text-brand-700'
    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
];
const tabClass = (key: string) => [
  'flex flex-1 flex-col items-center gap-0.5 py-2 text-sm font-medium transition',
  key === active.value ? 'text-brand-700' : 'text-ink-500',
];
</script>

<template>
  <div class="flex h-dvh bg-ink-50 text-ink-900">
    <!-- Desktop sidebar -->
    <aside class="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white md:flex">
      <div class="px-5 py-4">
        <UiLogo />
      </div>
      <nav class="flex flex-1 flex-col px-3 py-2" aria-label="Primary">
        <div class="flex flex-col gap-1">
          <router-link
            v-for="item in WORKSPACE"
            :key="item.key"
            :to="item.to"
            :class="sideClass(item.key)"
            :aria-current="active === item.key ? 'page' : undefined"
          >
            <UiIcon :name="item.icon" class="text-inherit h-5 w-5" />
            {{ item.label }}
          </router-link>
        </div>
        <div class="mt-auto flex flex-col gap-1 border-t border-ink-100 pt-2 pb-2">
          <router-link
            v-for="item in PERSONAL"
            :key="item.key"
            :to="item.to"
            :class="sideClass(item.key)"
            :aria-current="active === item.key ? 'page' : undefined"
          >
            <UiIcon :name="item.icon" class="text-inherit h-5 w-5" />
            {{ item.label }}
          </router-link>
        </div>
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
        v-for="item in ALL"
        :key="item.key"
        :to="item.to"
        :class="tabClass(item.key)"
        :aria-current="active === item.key ? 'page' : undefined"
      >
        <UiIcon :name="item.icon" class="text-inherit h-5 w-5" />
        {{ item.label }}
      </router-link>
    </nav>
  </div>
</template>
