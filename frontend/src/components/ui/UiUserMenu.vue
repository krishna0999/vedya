<script setup lang="ts">
// Profile avatar + dropdown. Shows the signed-in user's initials; clicking opens
// a small menu with their email, plan, and a log-out action. Self-contained:
// reads the auth store and handles logout + redirect so any chrome can drop it in.
import { computed, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import UiIcon from "@/components/ui/UiIcon.vue";

const auth = useAuthStore();
const router = useRouter();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

// Up to two initials — from the name if set, else the email local part.
const initials = computed(() => {
  const source =
    auth.user?.name?.trim() || (auth.user?.email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._+-]+/).filter(Boolean);
  const s =
    parts.length >= 2
      ? (parts[0]![0] ?? "") + (parts[1]![0] ?? "")
      : source.slice(0, 2);
  return (s || "?").toUpperCase();
});

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
function openMenu(): void {
  open.value = true;
  document.addEventListener("mousedown", onDocPointer);
}
function close(): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("mousedown", onDocPointer);
}
function toggle(): void {
  open.value ? close() : openMenu();
}
async function logout(): Promise<void> {
  close();
  await auth.logout();
  router.replace({ name: "login" });
}

onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
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
          <p
            v-if="auth.user?.name"
            class="truncate text-sm font-medium text-ink-900"
          >
            {{ auth.user.name }}
          </p>
          <p
            class="truncate text-sm"
            :class="
              auth.user?.name ? 'text-ink-500' : 'font-medium text-ink-900'
            "
          >
            {{ auth.user?.email }}
          </p>
          <p class="mt-0.5 text-sm capitalize text-ink-500">
            {{ auth.user?.plan ?? "free" }} plan
          </p>
        </div>
        <div class="my-1 h-px bg-ink-100"></div>
        <router-link
          :to="{ name: 'account' }"
          role="menuitem"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
          @click="close"
        >
          <UiIcon name="user-circle" class="h-5 w-5 text-ink-500" />
          Account
        </router-link>
        <router-link
          :to="{ name: 'settings' }"
          role="menuitem"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
          @click="close"
        >
          <UiIcon name="cog-6-tooth" class="h-5 w-5 text-ink-500" />
          Settings
        </router-link>
        <div class="my-1 h-px bg-ink-100"></div>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
          @click="logout"
        >
          <UiIcon
            name="arrow-left-start-on-rectangle"
            class="h-5 w-5 text-ink-500"
          />
          Log out
        </button>
      </div>
    </transition>
  </div>
</template>
