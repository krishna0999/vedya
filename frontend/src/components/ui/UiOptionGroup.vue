<script setup lang="ts">
// Custom radios (single_select) / checkboxes (multi_select). Clean inline layout,
// no card chrome, no hover fill. The check/radio mark state is driven explicitly
// from Vue (not CSS :has) so it stays robust. Native input kept for a11y/keyboard.
import type { FieldOption } from '@schema';
import UiIcon from '@/components/ui/UiIcon.vue';

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
    <label
      v-for="o in options"
      :key="o.id"
      :class="['fb-option', isChecked(optValue(o)) && 'fb-option--on']"
    >
      <input
        :type="multiple ? 'checkbox' : 'radio'"
        :name="name"
        :value="optValue(o)"
        :checked="isChecked(optValue(o))"
        class="peer sr-only"
        @change="onChange(optValue(o))"
      />
      <span
        :class="[
          'fb-mark',
          multiple ? 'fb-mark--check' : 'fb-mark--radio',
          isChecked(optValue(o)) && 'fb-mark--on',
        ]"
        aria-hidden="true"
      >
        <UiIcon v-if="multiple && isChecked(optValue(o))" name="check" class="text-inherit h-3.5 w-3.5" />
        <span v-else-if="!multiple && isChecked(optValue(o))" class="h-2 w-2 rounded-full bg-white"></span>
      </span>
      <span class="min-w-0">
        <span class="block leading-snug text-ink-800">{{ o.label }}</span>
        <span v-if="o.description" class="mt-0.5 block text-sm leading-snug text-ink-500">{{ o.description }}</span>
      </span>
    </label>
  </div>
</template>
