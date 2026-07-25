<script setup lang="ts">
// Star rating — form-themed (filled stars use --fb-primary). Emits 1..max.
import { ref } from 'vue';
import UiIcon from '@/components/ui/UiIcon.vue';

withDefaults(
  defineProps<{
    modelValue: number | undefined;
    max?: number;
  }>(),
  { max: 5 },
);
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const hover = ref(0);
</script>

<template>
  <div class="flex gap-1.5" @mouseleave="hover = 0">
    <button
      v-for="n in max"
      :key="n"
      type="button"
      class="rounded-md p-0.5 transition-transform duration-150 ease-soft hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      :aria-label="`${n} star${n === 1 ? '' : 's'}`"
      @mouseenter="hover = n"
      @click="emit('update:modelValue', n)"
    >
      <UiIcon
        name="star"
        type="solid"
        class="h-7 w-7 transition-colors duration-150"
        :style="{ color: (hover || modelValue || 0) >= n ? 'var(--fb-primary)' : '#d1d5db' }"
      />
    </button>
  </div>
</template>
