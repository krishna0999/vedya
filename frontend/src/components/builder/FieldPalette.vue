<script setup lang="ts">
// Left pane: click a type to append a field to the draft.
import type { FieldType } from '@schema';
import { FIELD_TYPES, type FieldTypeMeta } from '@/data/fieldTypes';
import { useBuilderStore } from '@/stores/builder';

const builder = useBuilderStore();

// Parents listen so mobile presentations (bottom sheet) can close after an add.
const emit = defineEmits<{ add: [type: FieldType] }>();

const GROUPS: { key: FieldTypeMeta['group']; label: string }[] = [
  { key: 'text', label: 'Text' },
  { key: 'choice', label: 'Choice' },
  { key: 'date', label: 'Date' },
  { key: 'other', label: 'Other' },
];

function typesIn(group: FieldTypeMeta['group']): FieldTypeMeta[] {
  return FIELD_TYPES.filter((f) => f.group === group);
}

function add(type: FieldType): void {
  builder.addField(type);
  emit('add', type);
}
</script>

<template>
  <!-- Layout-agnostic: the parent sets width/borders (sidebar on lg+, bottom
       sheet below). Below lg the types flow in two columns to cut scrolling. -->
  <aside class="overflow-y-auto bg-white p-3">
    <h2 class="mb-2 hidden px-1 text-sm font-semibold uppercase tracking-wide text-ink-500 lg:block">Add field</h2>
    <div v-for="g in GROUPS" :key="g.key" class="mb-3">
      <p class="mb-1 px-1 text-sm font-medium uppercase tracking-wide text-ink-400">{{ g.label }}</p>
      <div class="grid grid-cols-2 gap-1 lg:grid-cols-1">
        <button
          v-for="t in typesIn(g.key)"
          :key="t.type"
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink-700 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700"
          @click="add(t.type)"
        >
          <span class="grid h-5 w-5 place-items-center rounded bg-ink-100 text-ink-500">+</span>
          {{ t.label }}
        </button>
      </div>
    </div>
  </aside>
</template>
