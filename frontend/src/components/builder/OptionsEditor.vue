<script setup lang="ts">
// Edit the option list for select-family fields (label + optional description).
import type { Field, FieldOption } from '@schema';
import { makeOption } from '@/data/fieldTypes';
import { useBuilderStore } from '@/stores/builder';

const props = defineProps<{ field: Field }>();
const builder = useBuilderStore();

function options(): FieldOption[] {
  return props.field.options ?? [];
}
function commit(next: FieldOption[]): void {
  builder.updateField(props.field.id, { options: next });
}
function setLabel(id: string, label: string): void {
  commit(options().map((o) => (o.id === id ? { ...o, label } : o)));
}
function setDescription(id: string, description: string): void {
  commit(options().map((o) => (o.id === id ? { ...o, description: description || undefined } : o)));
}
function remove(id: string): void {
  commit(options().filter((o) => o.id !== id));
}
function add(): void {
  commit([...options(), makeOption(`Option ${options().length + 1}`)]);
}
</script>

<template>
  <div>
    <p class="ui-label">Options</p>
    <div class="space-y-2">
      <div v-for="o in options()" :key="o.id" class="rounded-lg border border-ink-200 p-2">
        <div class="flex items-center gap-2">
          <input
            class="ui-input"
            :value="o.label"
            placeholder="Option label"
            @input="setLabel(o.id, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-400 hover:bg-red-50 hover:text-danger disabled:opacity-40"
            title="Remove option"
            :disabled="options().length <= 1"
            @click="remove(o.id)"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
        </div>
        <input
          class="ui-input mt-1.5 text-xs"
          :value="o.description ?? ''"
          placeholder="Description (optional)"
          @input="setDescription(o.id, ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>
    <button
      type="button"
      class="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
      @click="add"
    >
      <span class="text-base leading-none">+</span> Add option
    </button>
  </div>
</template>
