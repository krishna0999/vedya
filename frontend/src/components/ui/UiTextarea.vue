<script setup lang="ts">
// Multi-line input for long_text.
defineProps<{
  id?: string;
  modelValue: string | undefined;
  placeholder?: string;
  invalid?: boolean;
  rows?: number;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <textarea
    :id="id"
    :rows="rows ?? 4"
    :value="modelValue ?? ''"
    :placeholder="placeholder"
    :class="['fb-input', invalid && 'fb-input--invalid']"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
