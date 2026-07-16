<script setup lang="ts">
// Kebab-trigger action menu: an icon button that opens a dropdown of actions,
// each rendered as <icon> <text>. Icons are optional per item (named from the
// built-in set below); an item without one renders text-only. Same dropdown
// idiom as UiUserMenu (outside-mousedown + Escape close, soft transition).
import { onBeforeUnmount, ref } from "vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import type { IconName } from "@/lib/icons";

export interface UiActionItem {
  id: string;
  label: string;
  icon?: UiActionIcon;
  danger?: boolean;
  disabled?: boolean;
  title?: string; // tooltip, e.g. why the item is disabled
}

export type UiActionIcon =
  | "pencil"
  | "responses"
  | "copy"
  | "email"
  | "external"
  | "trash";

// Map each menu action to a shared icon-registry name (see @/lib/icons).
const ICONS: Record<UiActionIcon, IconName> = {
  pencil: "pencil-square",
  responses: "list-bullet",
  copy: "document-duplicate",
  email: "envelope",
  external: "arrow-top-right-on-square",
  trash: "trash",
};

withDefaults(defineProps<{ items: UiActionItem[]; label?: string }>(), {
  label: "Actions",
});
const emit = defineEmits<{ select: [id: string] }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

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
function pick(item: UiActionItem): void {
  if (item.disabled) return;
  close();
  emit("select", item.id);
}

onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
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
      <UiIcon
        name="ellipsis-horizontal"
        type="solid"
        class="text-inherit h-5 w-5"
      />
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
          :class="
            item.danger
              ? 'text-danger hover:bg-red-50'
              : 'text-ink-700 hover:bg-ink-50'
          "
          :disabled="item.disabled"
          :title="item.title"
          @click="pick(item)"
        >
          <UiIcon
            v-if="item.icon"
            :name="ICONS[item.icon]"
            class="h-5 w-5 shrink-0"
            :class="item.danger ? 'text-danger' : 'text-ink-500'"
          />
          {{ item.label }}
        </button>
      </div>
    </transition>
  </div>
</template>
