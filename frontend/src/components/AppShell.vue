<script setup lang="ts">
// Owner-app shell: persistent left sidebar on md+, bottom tab bar (app-style)
// below md, and ONE shared topbar (search / notifications / avatar) so the
// navbar never changes between pages. Screens with their own chrome (builder)
// opt out via :topbar="false". Active state derives from the route.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, type RouteLocationRaw } from "vue-router";
import UiLogo from "@/components/ui/UiLogo.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiToaster from "@/components/ui/UiToaster.vue";
import SearchModal from "@/components/SearchModal.vue";
import NotificationBell from "@/components/NotificationBell.vue";
import UiUserMenu from "@/components/ui/UiUserMenu.vue";
import type { IconName } from "@/lib/icons";

withDefaults(defineProps<{ topbar?: boolean }>(), { topbar: true });

interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  to: RouteLocationRaw;
}

// Sidebar shows both groups (workspace on top, personal pinned to the bottom);
// the mobile tab bar flattens them into one row.
const WORKSPACE: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "squares-2x2",
    to: { name: "dashboard" },
  },
  { key: "forms", label: "Forms", icon: "list-bullet", to: { name: "forms" } },
  {
    key: "templates",
    label: "Templates",
    icon: "rectangle-group",
    to: { name: "forms", query: { view: "templates" } },
  },
];
const PERSONAL: NavItem[] = [
  {
    key: "settings",
    label: "Settings",
    icon: "cog-6-tooth",
    to: { name: "settings" },
  },
  {
    key: "account",
    label: "Account",
    icon: "user-circle",
    to: { name: "account" },
  },
];
const ALL = [...WORKSPACE, ...PERSONAL];

const route = useRoute();
const active = computed<string | null>(() => {
  if (route.name === "forms") {
    return route.query.view === "templates" ? "templates" : "forms";
  }
  return ALL.some((i) => i.key === route.name) ? (route.name as string) : null;
});

const sideClass = (key: string) => [
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
  key === active.value
    ? "bg-ink-200 text-ink-900 hover:bg-ink-50"
    : "text-ink-600 hover:bg-ink-200 hover:text-ink-900",
];
const tabClass = (key: string) => [
  "flex flex-1 flex-col items-center gap-0.5 py-2 text-sm font-medium transition",
  key === active.value ? "text-brand-700" : "text-ink-500",
];

// --- global search --------------------------------------------------------
// The topbar carries an icon, not a field: search opens a command-palette
// modal that spans forms AND templates. ponytail: the old inline box wrote
// ?q= as you typed, which only ever filtered the page you happened to be on.
const searchOpen = ref(false);

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);
const searchHint = computed(() => (isMac ? "⌘K" : "Ctrl K"));
function onGlobalKey(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    searchOpen.value = true;
  }
}
onMounted(() => document.addEventListener("keydown", onGlobalKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onGlobalKey));
</script>

<template>
  <div class="flex h-dvh bg-ink-50 text-ink-900">
    <!-- Desktop sidebar -->
    <aside
      class="hidden w-60 shrink-0 flex-col border-r border-line-200 bg-ink-100 md:flex"
    >
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
        <div
          class="mt-auto flex flex-col gap-1 border-t border-line-100 pt-2 pb-2"
        >
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
      <!-- Shared topbar: identical on every page, avatar pinned to the far right. -->
      <header
        v-if="topbar"
        class="sticky top-0 z-20 flex items-center gap-3 border-b border-line-200 bg-white px-4 py-3 sm:px-6"
      >
        <!-- Search reads as a field (Linear/Vercel style): it fills the bar's
             left side with something useful and advertises the shortcut. -->
        <button
          type="button"
          class="flex h-9 w-full max-w-xs items-center gap-2 rounded-md border border-line-200 bg-ink-50 px-3 text-left text-sm text-ink-500 transition hover:border-line-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          aria-label="Search forms and templates"
          aria-haspopup="dialog"
          @click="searchOpen = true"
        >
          <UiIcon
            name="magnifying-glass"
            class="h-4 w-4 shrink-0 text-inherit"
          />
          <span class="min-w-0 flex-1 truncate"
            >Search forms and templates…</span
          >
          <kbd
            class="hidden shrink-0 rounded border border-line-200 bg-white px-1.5 py-0.5 font-sans text-xs text-ink-500 sm:inline"
            >{{ searchHint }}</kbd
          >
        </button>
        <div class="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell />
          <UiUserMenu />
        </div>
      </header>
      <slot />
    </div>

    <!-- Mobile bottom tab bar -->
    <nav
      class="fixed inset-x-0 bottom-0 z-30 flex border-t border-line-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
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

    <SearchModal v-model:open="searchOpen" />
    <UiToaster />
  </div>
</template>
