<script setup lang="ts">
// Native dropdown for the `dropdown` field type. Emits the option's value
// (which defaults to its label — mirrors FieldOption in the schema).
import type { FieldOption } from '@schema';

defineProps<{
  id?: string;
  modelValue: string | undefined;
  options: FieldOption[];
  placeholder?: string;
  invalid?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function optValue(o: FieldOption): string {
  return o.value ?? o.label;
}
</script>

<template>
  <select
    :id="id"
    :value="modelValue ?? ''"
    :class="['fb-input', invalid && 'fb-input--invalid']"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option value="" disabled>{{ placeholder ?? 'Select…' }}</option>
    <option v-for="o in options" :key="o.id" :value="optValue(o)">{{ o.label }}</option>
  </select>
</template>
