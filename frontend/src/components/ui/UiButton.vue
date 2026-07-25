<script setup lang="ts">
// Product-chrome button (builder/dashboard). Brand/ink tokens, not form theme.
// The public form's submit button is separate (form-themed .fb-btn in FormRenderer).
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md';
    disabled?: boolean;
  }>(),
  { type: 'button', variant: 'primary', size: 'md' },
);

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition duration-150 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-55 active:translate-y-px';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
    secondary: 'bg-white text-ink-800 border border-line-200 hover:border-line-300 hover:bg-ink-50',
    ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-800',
    danger: 'bg-danger text-white shadow-sm hover:bg-red-700',
  };
  return [base, sizes[props.size], variants[props.variant]];
});
</script>

<template>
  <button :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
