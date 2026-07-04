<script setup lang="ts">
// Single-line input for text/email/phone/number/date. Always emits the raw
// string value; the renderer coerces per field type (e.g. number).
withDefaults(
  defineProps<{
    id?: string;
    modelValue: string | number | undefined;
    type?: string;
    placeholder?: string;
    invalid?: boolean;
  }>(),
  { type: 'text' },
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <input
    :id="id"
    :type="type"
    :value="modelValue ?? ''"
    :placeholder="placeholder"
    :class="['fb-input', invalid && 'fb-input--invalid']"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
