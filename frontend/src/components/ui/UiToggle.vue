<script setup lang="ts">
// Product-chrome switch for booleans (e.g. "Required").
defineProps<{ modelValue: boolean; label?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<template>
  <label class="flex cursor-pointer items-center justify-between gap-3">
    <span v-if="label" class="text-sm text-ink-700">{{ label }}</span>
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      class="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1"
      :class="modelValue ? 'bg-brand-600' : 'bg-ink-200'"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span
        class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-150"
        :class="modelValue ? 'translate-x-[18px]' : 'translate-x-0.5'"
      ></span>
    </button>
  </label>
</template>
