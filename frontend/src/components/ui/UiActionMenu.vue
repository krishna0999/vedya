<script setup lang="ts">
// Kebab-trigger action menu: an icon button that opens a dropdown of actions,
// each rendered as <icon> <text>. Icons are optional per item (named from the
// built-in set below); an item without one renders text-only. Same dropdown
// idiom as UiUserMenu (outside-mousedown + Escape close, soft transition).
import { onBeforeUnmount, ref } from 'vue';

export interface UiActionItem {
  id: string;
  label: string;
  icon?: UiActionIcon;
  danger?: boolean;
  disabled?: boolean;
  title?: string; // tooltip, e.g. why the item is disabled
}

export type UiActionIcon = 'pencil' | 'responses' | 'copy' | 'external' | 'trash';

// One multi-subpath `d` per icon (20×20 viewBox, stroked) keeps the set compact.
const ICONS: Record<UiActionIcon, string> = {
  pencil: 'M13.5 4.5l2 2L7 15l-2.7.7.7-2.7 8.5-8.5zM12 6l2 2',
  responses: 'M3 12h4l1.5 2.5h3L13 12h4M5.2 4h9.6L17 12v4H3v-4l2.2-8z',
  copy: 'M7 7h9v9H7V7zM5 13H4V4h9v1',
  external: 'M8.5 5H6a2 2 0 00-2 2v7a2 2 0 002 2h7a2 2 0 002-2v-2.5M12 4h4v4M15.5 4.5L9 11',
  trash: 'M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10M8.5 9v4M11.5 9v4',
};

withDefaults(defineProps<{ items: UiActionItem[]; label?: string }>(), {
  label: 'Actions',
});
const emit = defineEmits<{ select: [id: string] }>();

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
function pick(item: UiActionItem): void {
  if (item.disabled) return;
  close();
  emit('select', item.id);
}

onBeforeUnmount(() => document.removeEventListener('mousedown', onDocPointer));
</script>

<template>
  <div ref="root" class="relative" @keydown.escape="close">
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-label="label"
      @click="toggle"
    >
      <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><circle cx="5" cy="10" r="1.4" /><circle cx="10" cy="10" r="1.4" /><circle cx="15" cy="10" r="1.4" /></svg>
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
        class="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-pop"
      >
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          :class="item.danger ? 'text-danger hover:bg-red-50' : 'text-ink-700 hover:bg-ink-50'"
          :disabled="item.disabled"
          :title="item.title"
          @click="pick(item)"
        >
          <svg
            v-if="item.icon"
            class="h-4 w-4 shrink-0"
            :class="item.danger ? 'text-danger' : 'text-ink-400'"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="ICONS[item.icon]" />
          </svg>
          {{ item.label }}
        </button>
      </div>
    </transition>
  </div>
</template>
