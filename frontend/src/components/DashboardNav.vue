<script setup lang="ts">
// Sidebar navigation, shared by the desktop sidebar and the mobile slideover so
// the two never drift. The parent owns the active view; this just emits intent.
type View = "dashboard" | "templates";
defineProps<{ active: View }>();
const emit = defineEmits<{ select: [view: View] }>();

const itemClass = (view: View, active: View) =>
  [
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
    view === active
      ? "bg-brand-50 text-brand-700"
      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
  ];
</script>

<template>
  <nav class="flex flex-col gap-1">
    <button
      type="button"
      :class="itemClass('dashboard', active)"
      :aria-current="active === 'dashboard' ? 'page' : undefined"
      @click="emit('select', 'dashboard')"
    >
      <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4">
        <path
          d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
      Dashboard
    </button>
    <button
      type="button"
      :class="itemClass('templates', active)"
      :aria-current="active === 'templates' ? 'page' : undefined"
      @click="emit('select', 'templates')"
    >
      <svg viewBox="0 0 20 20" fill="none" class="h-4 w-4">
        <path
          d="M4 4h5v12H4V4zm7 0h5v5h-5V4zm0 7h5v5h-5v-5z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
      Templates
    </button>
  </nav>
</template>
