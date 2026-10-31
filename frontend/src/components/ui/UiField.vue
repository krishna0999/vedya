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
  <div class="mb-7">
    <label v-if="label" :for="inputId" class="mb-1.5 block text-[0.95rem] font-medium leading-snug text-ink-900">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>
    <p v-if="description" class="mb-2 text-sm text-ink-500">{{ description }}</p>
    <slot />
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
