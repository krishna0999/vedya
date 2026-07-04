<script setup lang="ts">
// Labeled wrapper for a single form control: label, required marker,
// description, the control (slot), and an error message. Consumed by both the
// renderer and (later) the builder's live preview.
defineProps<{
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  inputId?: string;
}>();
</script>

<template>
  <div class="mb-5">
    <label v-if="label" :for="inputId" class="mb-1 block text-sm font-medium text-gray-800">
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>
    <p v-if="description" class="mb-1.5 text-sm text-gray-500">{{ description }}</p>
    <slot />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
