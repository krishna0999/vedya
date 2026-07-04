<script setup lang="ts">
// Product-chrome custom select for builder panels (ink/brand tokens, no native
// <select>). Small, no search — for short option lists.
import { computed, onBeforeUnmount, ref } from 'vue';

interface Opt {
  label: string;
  value: string;
}

const props = defineProps<{ modelValue: string; options: Opt[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const selectedLabel = computed(() => props.options.find((o) => o.value === props.modelValue)?.label ?? '');

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
function openMenu(): void {
  if (open.value) return;
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
function choose(o: Opt): void {
  emit('update:modelValue', o.value);
  close();
}

onBeforeUnmount(() => document.removeEventListener('mousedown', onDocPointer));
</script>

<template>
  <div ref="root" class="relative">
    <button type="button" class="ui-input flex items-center justify-between text-left" :aria-expanded="open" @click="toggle">
      <span class="truncate">{{ selectedLabel }}</span>
      <svg class="ml-2 h-4 w-4 shrink-0 text-ink-400 transition-transform duration-150" :class="open && 'rotate-180'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8l4 4 4-4" />
      </svg>
    </button>

    <transition
      enter-active-class="transition duration-150 ease-soft"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-soft"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <ul v-if="open" role="listbox" class="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-lg border border-ink-200 bg-white p-1 shadow-pop">
        <li
          v-for="o in options"
          :key="o.value"
          role="option"
          :aria-selected="o.value === modelValue"
          class="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-ink-800"
          :class="o.value === modelValue ? 'bg-brand-50 text-brand-700' : 'hover:bg-ink-50'"
          @click="choose(o)"
        >
          <span class="truncate">{{ o.label }}</span>
          <svg v-if="o.value === modelValue" class="ml-2 h-4 w-4 shrink-0 text-brand-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 5" /></svg>
        </li>
      </ul>
    </transition>
  </div>
</template>
