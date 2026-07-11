<script setup lang="ts">
// Product-chrome search input — a styled Ui* primitive with a leading search
// icon, used in app chrome (dashboard topbar). Ink tokens only; never the form
// theme (CLAUDE.md §7, two theme layers). For in-form text entry use UiTextInput.
import UiIcon from '@/components/ui/UiIcon.vue';

withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    ariaLabel?: string;
  }>(),
  { placeholder: "Search…", ariaLabel: "Search" },
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <div class="relative">
    <UiIcon name="magnifying-glass" class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
    <input
      :value="modelValue"
      type="text"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      class="w-full rounded-lg border border-ink-200 bg-ink-50 py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:border-brand-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
