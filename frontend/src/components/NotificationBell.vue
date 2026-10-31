<script setup lang="ts">
// Topbar notification bell. The feed is derived, not stored — see
// lib/notifications.ts for why, and for what deliberately isn't in it.
//
// Everything here is actionable: each item names a form and links to the place
// you'd go to deal with it. There is no social/activity chatter, because a form
// builder has no audience — only work.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  ensureNotifications,
  groupByDay,
  useNotifications,
} from "@/lib/notifications";
import { relativeTime } from "@/lib/time";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiTooltip from "@/components/ui/UiTooltip.vue";

const { items, unreadCount, markAllRead } = useNotifications();

const open = ref(false);
const onlyUnread = ref(false);
const root = ref<HTMLElement | null>(null);

// Pinned standing alerts (plan limits) sit above the dated feed rather than
// inside a day bucket — they describe a condition, not a moment.
const visible = computed(() =>
  onlyUnread.value ? items.value.filter((n) => n.unread) : items.value,
);
const pinned = computed(() => visible.value.filter((n) => n.pinned));
const groups = computed(() =>
  groupByDay(visible.value.filter((n) => !n.pinned)),
);

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
function close(): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("mousedown", onDocPointer);
}
function toggle(): void {
  if (open.value) {
    close();
    return;
  }
  open.value = true;
  document.addEventListener("mousedown", onDocPointer);
}

onMounted(ensureNotifications);
onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));

const TONE = {
  warn: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-danger",
} as const;
</script>

<template>
  <div ref="root" class="relative" @keydown.escape="close">
    <!-- Suppressed while the panel is open: the cursor is still on the bell, so
         hover would keep the bubble up on top of the panel it just opened. -->
    <UiTooltip text="Notifications" placement="bottom" :disabled="open">
      <button
        type="button"
        class="relative grid h-9 w-9 place-items-center rounded-md text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        :aria-label="
          unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'
        "
        aria-haspopup="dialog"
        :aria-expanded="open"
        @click="toggle"
      >
        <UiIcon
          name="bell"
          class="text-inherit h-6 w-6"
          :class="open ? 'bell-ring' : ''"
        />
        <!-- Count, not a bare dot: "3 waiting" is a different decision from
             "something happened". Capped so it can't widen the button. -->
        <span
          v-if="unreadCount"
          class="absolute -right-2 -top-1 h-6 min-w-7 flex items-center justify-center rounded-full border-2 border-white bg-secondary-600 text-xs font-semibold leading-none text-white"
        >
          {{ unreadCount > 9 ? "9+" : unreadCount }}
        </span>
      </button>
    </UiTooltip>

    <transition
      enter-active-class="transition duration-150 ease-soft"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-soft"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        role="dialog"
        aria-label="Notifications"
        class="absolute right-0 top-full z-30 mt-2 flex max-h-[26rem] w-[21rem] flex-col overflow-hidden rounded-md border border-line-200 bg-white shadow-pop"
      >
        <div class="shrink-0 border-b border-line-100 px-3 pt-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-ink-900">Notifications</p>
            <button
              v-if="unreadCount"
              type="button"
              class="rounded-md px-1.5 py-0.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              @click="markAllRead"
            >
              Mark all as read
            </button>
          </div>
          <div class="mt-2 flex gap-1">
            <button
              v-for="tab in [false, true]"
              :key="String(tab)"
              type="button"
              class="rounded-t-md border-b-2 px-2 pb-1.5 text-sm font-medium transition"
              :class="
                onlyUnread === tab
                  ? 'border-brand-600 text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              "
              :aria-pressed="onlyUnread === tab"
              @click="onlyUnread = tab"
            >
              {{
                tab ? `Unread${unreadCount ? ` (${unreadCount})` : ""}` : "All"
              }}
            </button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto scrollbar-none">
          <!-- Standing alerts first -->
          <router-link
            v-for="n in pinned"
            :key="n.id"
            :to="n.to ?? {}"
            class="flex gap-2.5 border-b border-line-100 px-3 py-2.5 transition-colors hover:bg-ink-50"
            @click="close"
          >
            <span
              class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md"
              :class="TONE[n.tone ?? 'warn']"
              aria-hidden="true"
            >
              <UiIcon name="bell" class="text-inherit h-4 w-4" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-medium text-ink-900">{{
                n.title
              }}</span>
              <span class="mt-0.5 block text-sm text-ink-500">{{
                n.body
              }}</span>
            </span>
          </router-link>

          <template v-for="g in groups" :key="g.label">
            <p
              class="sticky top-0 bg-white/95 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-500 backdrop-blur"
            >
              {{ g.label }}
            </p>
            <router-link
              v-for="n in g.items"
              :key="n.id"
              :to="n.to ?? {}"
              class="flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-ink-50"
              @click="close"
            >
              <span
                class="relative mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary-50 text-secondary-600"
                aria-hidden="true"
              >
                <UiIcon name="paper-airplane" class="text-inherit h-4 w-4" />
                <span
                  v-if="n.unread"
                  class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-secondary-600"
                />
              </span>
              <span class="min-w-0 flex-1">
                <span
                  class="block truncate text-sm text-ink-900"
                  :class="n.unread ? 'font-semibold' : 'font-medium'"
                >
                  {{ n.title }}
                  <span v-if="n.unread" class="sr-only">(unread)</span>
                </span>
                <span class="block truncate text-sm text-ink-500">{{
                  n.body
                }}</span>
                <span class="mt-0.5 block text-xs text-ink-400">{{
                  relativeTime(n.at)
                }}</span>
              </span>
            </router-link>
          </template>

          <!-- Empty state. It names only what this product can actually tell
               you about — promising teammate or integration alerts we don't
               send would be a lie with a friendly face. -->
          <div v-if="!visible.length" class="px-5 py-8 text-center">
            <p class="text-2xl" aria-hidden="true">🎉</p>
            <p class="mt-1.5 text-sm font-medium text-ink-900">
              {{ onlyUnread ? "Nothing unread" : "You're all caught up" }}
            </p>
            <p class="mx-auto mt-1 max-w-[15rem] text-sm text-ink-500">
              We'll let you know when someone submits one of your forms, or when
              you're close to your monthly response limit.
            </p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* A short ring when the bell is opened — motion as acknowledgement, not decoration. */
.bell-ring {
  transform-origin: top center;
  animation: bell-ring 600ms ease-in-out;
}
@keyframes bell-ring {
  0%,
  100% {
    transform: rotate(0);
  }
  20% {
    transform: rotate(12deg);
  }
  45% {
    transform: rotate(-9deg);
  }
  70% {
    transform: rotate(5deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .bell-ring {
    animation: none;
  }
}
</style>
