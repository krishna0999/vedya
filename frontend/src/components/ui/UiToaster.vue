<script setup lang="ts">
// The one toast stack, mounted once by AppShell. Bottom-right on desktop,
// bottom-centre on mobile where it clears the tab bar.
import { dismissToast, toasts } from "@/lib/toast";
import UiIcon from "@/components/ui/UiIcon.vue";

const TONES = {
  info: { ring: "border-ink-200", icon: "bell", tint: "text-ink-500" },
  success: { ring: "border-green-200", icon: "check", tint: "text-green-600" },
  error: { ring: "border-red-200", icon: "x-mark", tint: "text-danger" },
} as const;
</script>

<template>
  <!-- aria-live so a toast is announced without stealing focus. -->
  <div
    class="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
    role="status"
    aria-live="polite"
  >
    <transition-group
      enter-active-class="transition duration-200 ease-soft"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-soft"
      leave-to-class="opacity-0 translate-y-1"
      move-class="transition duration-150 ease-soft"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 shadow-pop"
        :class="TONES[t.tone].ring"
      >
        <UiIcon
          :name="TONES[t.tone].icon"
          class="h-5 w-5 shrink-0"
          :class="TONES[t.tone].tint"
        />
        <p class="min-w-0 flex-1 text-sm text-ink-800">{{ t.text }}</p>
        <button
          type="button"
          class="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          aria-label="Dismiss notification"
          @click="dismissToast(t.id)"
        >
          <UiIcon name="x-mark" class="text-inherit h-4 w-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
