<script setup lang="ts">
// Right pane (edit mode): configure the selected field.
import { computed } from 'vue';
import type { Field, FieldValidation } from '@schema';
import { metaFor, typeHasOptions } from '@/data/fieldTypes';
import { useBuilderStore } from '@/stores/builder';
import UiToggle from '@/components/ui/UiToggle.vue';
import OptionsEditor from './OptionsEditor.vue';

const props = defineProps<{ field: Field }>();
const builder = useBuilderStore();

const typeLabel = computed(() => metaFor(props.field.type)?.label ?? props.field.type);
const hasOptions = computed(() => typeHasOptions(props.field.type));
const isSection = computed(() => props.field.type === 'section_break');

const usesPlaceholder = computed(() =>
  ['short_text', 'long_text', 'email', 'phone', 'number', 'date', 'date_range', 'dropdown', 'multi_dropdown'].includes(
    props.field.type,
  ),
);
const isText = computed(() => props.field.type === 'short_text' || props.field.type === 'long_text');
const isNumber = computed(() => props.field.type === 'number');
const isRating = computed(() => props.field.type === 'rating');
const isMulti = computed(() => props.field.type === 'multi_select' || props.field.type === 'multi_dropdown');

function update(patch: Partial<Field>): void {
  builder.updateField(props.field.id, patch);
}
function numOrUndef(v: string): number | undefined {
  const t = v.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isNaN(n) ? undefined : n;
}
function setValidation(patch: Partial<FieldValidation>): void {
  update({ validation: { ...(props.field.validation ?? {}), ...patch } });
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <span class="rounded bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">{{ typeLabel }}</span>
      <button type="button" class="text-xs font-medium text-danger hover:underline" @click="builder.removeField(field.id)">Delete</button>
    </div>

    <div>
      <label class="ui-label">{{ isSection ? 'Section title' : 'Label' }}</label>
      <input class="ui-input" :value="field.label" @input="update({ label: ($event.target as HTMLInputElement).value })" />
    </div>

    <div>
      <label class="ui-label">Description</label>
      <input class="ui-input" :value="field.description ?? ''" placeholder="Optional helper text" @input="update({ description: ($event.target as HTMLInputElement).value || undefined })" />
    </div>

    <div v-if="usesPlaceholder">
      <label class="ui-label">Placeholder</label>
      <input class="ui-input" :value="field.placeholder ?? ''" @input="update({ placeholder: ($event.target as HTMLInputElement).value || undefined })" />
    </div>

    <div v-if="!isSection" class="border-t border-ink-100 pt-3">
      <UiToggle :model-value="field.required" label="Required" @update:model-value="update({ required: $event })" />
    </div>

    <div v-if="hasOptions" class="border-t border-ink-100 pt-3">
      <OptionsEditor :field="field" />
    </div>

    <!-- validation -->
    <div v-if="isText || isNumber || isRating || isMulti" class="space-y-2 border-t border-ink-100 pt-3">
      <p class="ui-label">Validation</p>

      <div v-if="isText" class="grid grid-cols-2 gap-2">
        <div>
          <label class="mb-1 block text-xs text-ink-500">Min length</label>
          <input class="ui-input" type="number" :value="field.validation?.minLength ?? ''" @input="setValidation({ minLength: numOrUndef(($event.target as HTMLInputElement).value) })" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-ink-500">Max length</label>
          <input class="ui-input" type="number" :value="field.validation?.maxLength ?? ''" @input="setValidation({ maxLength: numOrUndef(($event.target as HTMLInputElement).value) })" />
        </div>
      </div>

      <div v-if="isNumber" class="grid grid-cols-2 gap-2">
        <div>
          <label class="mb-1 block text-xs text-ink-500">Min</label>
          <input class="ui-input" type="number" :value="field.validation?.min ?? ''" @input="setValidation({ min: numOrUndef(($event.target as HTMLInputElement).value) })" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-ink-500">Max</label>
          <input class="ui-input" type="number" :value="field.validation?.max ?? ''" @input="setValidation({ max: numOrUndef(($event.target as HTMLInputElement).value) })" />
        </div>
      </div>

      <div v-if="isRating">
        <label class="mb-1 block text-xs text-ink-500">Stars</label>
        <input class="ui-input" type="number" min="1" :value="field.validation?.max ?? 5" @input="setValidation({ max: numOrUndef(($event.target as HTMLInputElement).value) })" />
      </div>

      <div v-if="isMulti" class="grid grid-cols-2 gap-2">
        <div>
          <label class="mb-1 block text-xs text-ink-500">Min selections</label>
          <input class="ui-input" type="number" :value="field.validation?.min ?? ''" @input="setValidation({ min: numOrUndef(($event.target as HTMLInputElement).value) })" />
        </div>
        <div>
          <label class="mb-1 block text-xs text-ink-500">Max selections</label>
          <input class="ui-input" type="number" :value="field.validation?.max ?? ''" @input="setValidation({ max: numOrUndef(($event.target as HTMLInputElement).value) })" />
        </div>
      </div>
    </div>
  </div>
</template>
