<script setup lang="ts">
// Product-chrome search input — a styled Ui* primitive with a leading search
// icon, used in app chrome (dashboard topbar). Ink tokens only; never the form
// theme (CLAUDE.md §7, two theme layers). For in-form text entry use UiTextInput.
import { ref } from "vue";
import UiIcon from "@/components/ui/UiIcon.vue";

withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    ariaLabel?: string;
    /** Keyboard hint rendered on the right, e.g. "⌘K". */
    hint?: string;
  }>(),
  { placeholder: "Search…", ariaLabel: "Search" },
);
const emit = defineEmits<{
  "update:modelValue": [value: string];
  focus: [];
  blur: [];
}>();

const input = ref<HTMLInputElement | null>(null);
// Exposed so the shell can focus it from a global shortcut.
defineExpose({ focus: () => input.value?.focus() });
</script>

<template>
  <div class="relative">
    <UiIcon
      name="magnifying-glass"
      class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500"
    />
    <input
      ref="input"
      :value="modelValue"
      type="text"
      :aria-label="ariaLabel"
      :placeholder="placeholder"
      class="w-full rounded-lg border border-ink-200 bg-ink-50 py-2 pl-9 text-sm text-ink-900 placeholder:text-ink-500 focus-visible:border-brand-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
      :class="hint ? 'pr-14' : 'pr-3'"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      @focus="emit('focus')"
      @blur="emit('blur')"
    />
    <kbd
      v-if="hint"
      class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-ink-200 bg-white px-1.5 py-0.5 font-sans text-xs font-medium text-ink-500"
      aria-hidden="true"
    >
      {{ hint }}
    </kbd>
  </div>
</template>
