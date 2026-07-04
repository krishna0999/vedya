<script setup lang="ts">
// Right pane (edit mode): configure the selected field.
import { computed } from 'vue';
import type { DateConfig, DatePreset, Field, FieldValidation } from '@schema';
import { DATE_PRESET_CATALOG, metaFor, typeHasOptions } from '@/data/fieldTypes';
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
const isDate = computed(() => props.field.type === 'date');

function update(patch: Partial<Field>): void {
  builder.updateField(props.field.id, patch);
}

// --- date config ---
const dateCfg = computed<DateConfig>(
  () => props.field.date ?? { mode: 'single', showPresets: true, presets: [] },
);
const availablePresets = computed(() =>
  DATE_PRESET_CATALOG.filter((p) => !dateCfg.value.presets.some((x) => x.label === p.label)),
);
function setDate(patch: Partial<DateConfig>): void {
  update({ date: { ...dateCfg.value, ...patch } });
}
function addPreset(p: DatePreset): void {
  setDate({ presets: [...dateCfg.value.presets, p] });
}
function removePreset(label: string): void {
  setDate({ presets: dateCfg.value.presets.filter((p) => p.label !== label) });
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

    <!-- date settings -->
    <div v-if="isDate" class="space-y-3 border-t border-ink-100 pt-3">
      <div>
        <p class="ui-label">Selection</p>
        <div class="inline-flex w-full rounded-lg border border-ink-200 bg-ink-50 p-0.5 text-sm">
          <button
            type="button"
            class="flex-1 rounded-md py-1 font-medium transition-colors"
            :class="dateCfg.mode === 'single' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'"
            @click="setDate({ mode: 'single' })"
          >
            Single date
          </button>
          <button
            type="button"
            class="flex-1 rounded-md py-1 font-medium transition-colors"
            :class="dateCfg.mode === 'range' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'"
            @click="setDate({ mode: 'range' })"
          >
            Date range
          </button>
        </div>
      </div>

      <!-- presets only apply to single-date selection -->
      <div v-if="dateCfg.mode === 'single'">
        <UiToggle :model-value="dateCfg.showPresets" label="Show quick presets" @update:model-value="setDate({ showPresets: $event })" />

        <div v-if="dateCfg.showPresets" class="mt-2">
          <p class="mb-1.5 text-xs text-ink-500">Presets shown to respondents</p>
          <div v-if="dateCfg.presets.length" class="mb-2 flex flex-wrap gap-1.5">
            <span v-for="p in dateCfg.presets" :key="p.label" class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-sm text-brand-700">
              {{ p.label }}
              <button type="button" class="grid h-4 w-4 place-items-center rounded hover:bg-brand-100" aria-label="Remove preset" @click="removePreset(p.label)">
                <svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
            </span>
          </div>
          <p v-else class="mb-2 text-xs text-ink-400">No presets added.</p>

          <div v-if="availablePresets.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="p in availablePresets"
              :key="p.label"
              type="button"
              class="inline-flex items-center gap-1 rounded-full border border-dashed border-ink-300 px-2.5 py-1 text-sm text-ink-600 hover:border-brand-400 hover:text-brand-700"
              @click="addPreset(p)"
            >
              <span class="text-base leading-none">+</span> {{ p.label }}
            </button>
          </div>
        </div>
      </div>
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
