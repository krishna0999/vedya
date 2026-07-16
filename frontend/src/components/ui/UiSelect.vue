<script setup lang="ts">
// Custom searchable dropdown for the `dropdown` field type — no native <select>.
// Button trigger + popover with a search box + listbox. Keyboard-operable.
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import type { FieldOption } from "@schema";
import UiIcon from "@/components/ui/UiIcon.vue";

const props = defineProps<{
  id?: string;
  modelValue: string | undefined;
  options: FieldOption[];
  placeholder?: string;
  invalid?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const open = ref(false);
const active = ref(0);
const query = ref("");
const root = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);

function optValue(o: FieldOption): string {
  return o.value ?? o.label;
}

const selectedLabel = computed(() => {
  const match = props.options.find((o) => optValue(o) === props.modelValue);
  return match?.label ?? "";
});

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}

function openMenu(): void {
  if (open.value) return;
  open.value = true;
  query.value = "";
  active.value = 0;
  document.addEventListener("mousedown", onDocPointer);
  void nextTick(() => searchEl.value?.focus());
}

function close(): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener("mousedown", onDocPointer);
}

function toggle(): void {
  open.value ? close() : openMenu();
}

function choose(o: FieldOption): void {
  emit("update:modelValue", optValue(o));
  close();
}

function move(delta: number): void {
  const n = filtered.value.length;
  if (n === 0) return;
  active.value = (active.value + delta + n) % n;
}

function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      open.value ? move(1) : openMenu();
      break;
    case "ArrowUp":
      e.preventDefault();
      move(-1);
      break;
    case "Enter":
      e.preventDefault();
      if (open.value && filtered.value[active.value])
        choose(filtered.value[active.value]!);
      break;
    case "Escape":
      close();
      break;
    default:
      break;
  }
}

onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
</script>

<template>
  <div ref="root" class="relative">
    <button
      :id="id"
      type="button"
      :class="[
        'fb-input flex items-center justify-between text-left',
        invalid && 'fb-input--invalid',
        !selectedLabel && 'text-ink-500',
      ]"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="truncate">{{
        selectedLabel || (placeholder ?? "Select…")
      }}</span>
      <UiIcon
        name="chevron-down"
        class="ml-2 h-5 w-5 shrink-0 text-ink-500 transition-transform duration-150"
        :class="open && 'rotate-180'"
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
        class="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-pop"
      >
        <div class="flex items-center gap-2 border-b border-ink-100 px-3">
          <UiIcon
            name="magnifying-glass"
            class="h-5 w-5 shrink-0 text-ink-500"
          />
          <input
            ref="searchEl"
            v-model="query"
            type="text"
            placeholder="Search…"
            class="w-full bg-transparent py-2.5 text-ink-900 outline-none placeholder:text-ink-500"
            @keydown="onKeydown"
          />
        </div>
        <ul role="listbox" class="max-h-56 overflow-auto p-1">
          <li
            v-for="(o, i) in filtered"
            :key="o.id"
            role="option"
            :aria-selected="optValue(o) === modelValue"
            class="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-ink-800"
            :class="
              i === active ? 'bg-brand-50 text-brand-700' : 'hover:bg-ink-50'
            "
            @mouseenter="active = i"
            @click="choose(o)"
          >
            <span class="truncate">{{ o.label }}</span>
            <UiIcon
              v-if="optValue(o) === modelValue"
              name="check"
              class="ml-2 h-5 w-5 shrink-0 text-brand-600"
            />
          </li>
          <li
            v-if="filtered.length === 0"
            class="px-3 py-3 text-sm text-ink-500"
          >
            No matches
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>
