<script setup lang="ts">
// Star rating. Emits a number 1..max.
withDefaults(
  defineProps<{
    modelValue: number | undefined;
    max?: number;
  }>(),
  { max: 5 },
);
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
</script>

<template>
  <div class="flex gap-1">
    <button
      v-for="n in max"
      :key="n"
      type="button"
      class="text-2xl leading-none transition"
      :class="(modelValue ?? 0) >= n ? 'fb-star--on' : 'text-gray-300 hover:text-gray-400'"
      :aria-label="`${n} star${n === 1 ? '' : 's'}`"
      @click="emit('update:modelValue', n)"
    >
      ★
    </button>
  </div>
</template>
