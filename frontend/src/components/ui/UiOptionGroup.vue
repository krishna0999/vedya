<script setup lang="ts">
// Radios (single_select) or checkboxes (multi_select). single emits a string;
// multiple emits a string[] of selected option values.
import type { FieldOption } from '@schema';

const props = defineProps<{
  name: string;
  options: FieldOption[];
  modelValue: string | string[] | undefined;
  multiple?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>();

function optValue(o: FieldOption): string {
  return o.value ?? o.label;
}

function isChecked(v: string): boolean {
  return props.multiple
    ? Array.isArray(props.modelValue) && props.modelValue.includes(v)
    : props.modelValue === v;
}

function onChange(v: string): void {
  if (!props.multiple) {
    emit('update:modelValue', v);
    return;
  }
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  const at = current.indexOf(v);
  if (at >= 0) current.splice(at, 1);
  else current.push(v);
  emit('update:modelValue', current);
}
</script>

<template>
  <div class="space-y-2">
    <label v-for="o in options" :key="o.id" class="flex cursor-pointer items-center gap-2">
      <input
        :type="multiple ? 'checkbox' : 'radio'"
        :name="name"
        :value="optValue(o)"
        :checked="isChecked(optValue(o))"
        class="fb-choice"
        @change="onChange(optValue(o))"
      />
      <span class="text-gray-800">{{ o.label }}</span>
    </label>
  </div>
</template>
