<script setup lang="ts">
// Profile avatar + dropdown. Shows the signed-in user's initials; clicking opens
// a small menu with their email, plan, and a log-out action. Self-contained:
// reads the auth store and handles logout + redirect so any chrome can drop it in.
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

// Up to two initials from the email local part (split on . _ + -), else first two.
const initials = computed(() => {
  const local = (auth.user?.email ?? '').split('@')[0] ?? '';
  const parts = local.split(/[._+-]+/).filter(Boolean);
  const s = parts.length >= 2 ? (parts[0]![0] ?? '') + (parts[1]![0] ?? '') : local.slice(0, 2);
  return (s || '?').toUpperCase();
});

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
async function logout(): Promise<void> {
  close();
  await auth.logout();
  router.replace({ name: 'login' });
}

onBeforeUnmount(() => document.removeEventListener('mousedown', onDocPointer));
</script>

<template>
  <div ref="root" class="relative" @keydown.escape="close">
    <button
      type="button"
      class="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-label="Account menu"
      @click="toggle"
    >
      {{ initials }}
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
        class="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-pop"
      >
        <div class="px-3 py-2">
          <p class="truncate text-sm font-medium text-ink-900">{{ auth.user?.email }}</p>
          <p class="mt-0.5 text-xs capitalize text-ink-400">{{ auth.user?.plan ?? 'free' }} plan</p>
        </div>
        <div class="my-1 h-px bg-ink-100"></div>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
          @click="logout"
        >
          <svg class="h-4 w-4 text-ink-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 4h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3M9 14l-4-4 4-4M5 10h9" />
          </svg>
          Log out
        </button>
      </div>
    </transition>
  </div>
</template>
