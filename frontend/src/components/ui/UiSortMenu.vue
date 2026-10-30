<script setup lang="ts">
// Single-select sort dropdown for list toolbars. Mirrors UiFilterMenu's idiom
// (outside-mousedown + Escape close, soft transition) but picks one option and
// shows its label on the trigger. v-model is the active option id.
import { computed, onBeforeUnmount, ref } from "vue";
import UiIcon from "@/components/ui/UiIcon.vue";

export interface UiSortOption {
  id: string;
  label: string;
}

const props = defineProps<{
  options: UiSortOption[];
  modelValue: string;
  /** Drop the label under sm — for toolbars that share the row with other controls. */
  compact?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const activeLabel = computed(
  () => props.options.find((o) => o.id === props.modelValue)?.label ?? "Sort",
);

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
function pick(id: string): void {
  emit("update:modelValue", id);
  close();
}

onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
</script>

<template>
  <div ref="root" class="relative" @keydown.escape="close">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggleMenu"
    >
      <UiIcon name="bars-3-bottom-left" class="text-inherit h-5 w-5 shrink-0" />
      <!-- The label rides along on mobile too: a bare ☰ doesn't say "sort". -->
      <span :class="compact ? 'hidden sm:inline' : ''">{{ activeLabel }}</span>
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
        class="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-line-200 bg-white p-1 shadow-pop"
      >
        <button
          v-for="o in options"
          :key="o.id"
          type="button"
          role="menuitemradio"
          :aria-checked="o.id === modelValue"
          class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-ink-50"
          :class="
            o.id === modelValue ? 'font-medium text-brand-700' : 'text-ink-700'
          "
          @click="pick(o.id)"
        >
          {{ o.label }}
          <UiIcon
            v-if="o.id === modelValue"
            name="check"
            class="h-4 w-4 shrink-0 text-brand-600"
          />
        </button>
      </div>
    </transition>
  </div>
</template>
