<script setup lang="ts">
// Checkbox filter dropdown for list toolbars: a compact trigger that opens a
// popover of multi-select options. v-model is the array of selected option ids;
// empty means "no filter applied". Same dropdown idiom as UiActionMenu
// (outside-mousedown + Escape close, soft transition).
import { onBeforeUnmount, ref } from "vue";

export interface UiFilterOption {
  id: string;
  label: string;
}

const props = defineProps<{
  options: UiFilterOption[];
  modelValue: string[];
  label?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

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
function toggleMenu(): void {
  open.value ? close() : openMenu();
}

function isChecked(id: string): boolean {
  return props.modelValue.includes(id);
}
function toggleOption(id: string): void {
  const next = isChecked(id)
    ? props.modelValue.filter((v) => v !== id)
    : [...props.modelValue, id];
  emit("update:modelValue", next);
}

onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
</script>

<template>
  <div ref="root" class="relative" @keydown.escape="close">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      :class="
        modelValue.length
          ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
          : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800'
      "
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggleMenu"
    >
      <svg
        class="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 5h14l-5.5 6.5V16l-3-1.5v-3L3 5z" />
      </svg>
      {{ label ?? "Filter" }}
      <span
        v-if="modelValue.length"
        class="grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white"
      >
        {{ modelValue.length }}
      </span>
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
        class="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-pop"
      >
        <button
          v-for="o in options"
          :key="o.id"
          type="button"
          role="menuitemcheckbox"
          :aria-checked="isChecked(o.id)"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
          @click="toggleOption(o.id)"
        >
          <span
            class="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors duration-150"
            :class="
              isChecked(o.id)
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-ink-300 bg-white'
            "
          >
            <svg
              v-if="isChecked(o.id)"
              class="h-3 w-3"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 8.5l3.2 3.2L13 5" />
            </svg>
          </span>
          {{ o.label }}
        </button>
      </div>
    </transition>
  </div>
</template>
