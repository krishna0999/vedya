<script setup lang="ts">
// Searchable multi-select dropdown for the `multi_dropdown` field type.
// Trigger shows selected values as removable chips; popover has a search box and
// a checkbox list. Emits string[] of selected option values.
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import type { FieldOption } from '@schema';
import UiIcon from '@/components/ui/UiIcon.vue';

const props = defineProps<{
  id?: string;
  modelValue: string[] | undefined;
  options: FieldOption[];
  placeholder?: string;
  invalid?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

const open = ref(false);
const active = ref(0);
const query = ref('');
const root = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);

function optValue(o: FieldOption): string {
  return o.value ?? o.label;
}

const selected = computed<string[]>(() => (Array.isArray(props.modelValue) ? props.modelValue : []));

const selectedOptions = computed(() =>
  props.options.filter((o) => selected.value.includes(optValue(o))),
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

function isChecked(o: FieldOption): boolean {
  return selected.value.includes(optValue(o));
}

function toggleOption(o: FieldOption): void {
  const v = optValue(o);
  const next = [...selected.value];
  const at = next.indexOf(v);
  if (at >= 0) next.splice(at, 1);
  else next.push(v);
  emit('update:modelValue', next);
}

function remove(o: FieldOption): void {
  emit('update:modelValue', selected.value.filter((v) => v !== optValue(o)));
}

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}

function openMenu(): void {
  if (open.value) return;
  open.value = true;
  query.value = '';
  active.value = 0;
  document.addEventListener('mousedown', onDocPointer);
  void nextTick(() => searchEl.value?.focus());
}

function close(): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener('mousedown', onDocPointer);
}

function toggle(): void {
  open.value ? close() : openMenu();
}

function move(delta: number): void {
  const n = filtered.value.length;
  if (n === 0) return;
  active.value = (active.value + delta + n) % n;
}

function onKeydown(e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      open.value ? move(1) : openMenu();
      break;
    case 'ArrowUp':
      e.preventDefault();
      move(-1);
      break;
    case 'Enter':
      e.preventDefault();
      if (open.value && filtered.value[active.value]) toggleOption(filtered.value[active.value]!);
      break;
    case 'Escape':
      close();
      break;
    default:
      break;
  }
}

onBeforeUnmount(() => document.removeEventListener('mousedown', onDocPointer));
</script>

<template>
  <div ref="root" class="relative">
    <button
      :id="id"
      type="button"
      :class="['fb-input flex min-h-[46px] items-center justify-between gap-2 text-left', invalid && 'fb-input--invalid']"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span v-if="selectedOptions.length === 0" class="truncate text-ink-400">
        {{ placeholder ?? 'Select…' }}
      </span>
      <span v-else class="flex flex-wrap gap-1.5">
        <span
          v-for="o in selectedOptions"
          :key="o.id"
          class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-sm text-brand-700"
        >
          {{ o.label }}
          <span
            role="button"
            tabindex="-1"
            aria-label="Remove"
            class="grid h-4 w-4 place-items-center rounded hover:bg-brand-100"
            @click.stop="remove(o)"
          >
            <UiIcon name="x-mark" class="text-inherit h-3 w-3" />
          </span>
        </span>
      </span>
      <UiIcon name="chevron-down" class="ml-auto h-5 w-5 shrink-0 text-ink-400 transition-transform duration-150" :class="open && 'rotate-180'" />
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
          <UiIcon name="magnifying-glass" class="h-5 w-5 shrink-0 text-ink-400" />
          <input
            ref="searchEl"
            v-model="query"
            type="text"
            placeholder="Search…"
            class="w-full bg-transparent py-2.5 text-ink-900 outline-none placeholder:text-ink-400"
            @keydown="onKeydown"
          />
        </div>
        <ul role="listbox" aria-multiselectable="true" class="max-h-56 overflow-auto p-1">
          <li
            v-for="(o, i) in filtered"
            :key="o.id"
            role="option"
            :aria-selected="isChecked(o)"
            class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-ink-800"
            :class="i === active ? 'bg-ink-50' : 'hover:bg-ink-50'"
            @mouseenter="active = i"
            @click="toggleOption(o)"
          >
            <span
              class="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border transition-colors duration-150"
              :class="isChecked(o) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white'"
            >
              <UiIcon v-if="isChecked(o)" name="check" class="text-inherit h-3.5 w-3.5" />
            </span>
            <span class="min-w-0">
              <span class="block truncate leading-snug">{{ o.label }}</span>
              <span v-if="o.description" class="block truncate text-sm text-ink-500">{{ o.description }}</span>
            </span>
          </li>
          <li v-if="filtered.length === 0" class="px-3 py-3 text-sm text-ink-400">No matches</li>
        </ul>
      </div>
    </transition>
  </div>
</template>
