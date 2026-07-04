<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit';
    disabled?: boolean;
  }>(),
  { type: 'button' },
);
</script>

<template>
  <button :type="type" :disabled="disabled" class="fb-btn">
    <slot />
  </button>
</template>
