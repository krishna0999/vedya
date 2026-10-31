<script setup lang="ts">
// The schema-driven renderer (CLAUDE.md §4.2). Eats a FormVersion, renders
// every field type, runs the SHARED validateAnswers for instant feedback, and
// emits a submission payload keyed by Field.id. The builder is later just a UI
// that emits the JSON this component already consumes.
import { computed, reactive, ref } from 'vue';
import { validateAnswers, type DateRangeValue, type Field, type FieldType, type FormVersion } from '@schema';
import UiField from './ui/UiField.vue';
import UiTextInput from './ui/UiTextInput.vue';
import UiTextarea from './ui/UiTextarea.vue';
import UiSelect from './ui/UiSelect.vue';
import UiMultiSelectDropdown from './ui/UiMultiSelectDropdown.vue';
import UiOptionGroup from './ui/UiOptionGroup.vue';
import UiRating from './ui/UiRating.vue';
import UiPhoneInput from './ui/UiPhoneInput.vue';
import UiDatePicker from './ui/UiDatePicker.vue';
import UiIcon from '@/components/ui/UiIcon.vue';

const props = defineProps<{ version: FormVersion; title?: string; submitting?: boolean }>();
const emit = defineEmits<{ submit: [answers: Record<string, unknown>] }>();

// Answers keyed by Field.id. Multi-value fields start as an empty array so they
// always have a stable array shape for the control and the validator.
const answers = reactive<Record<string, unknown>>({});
for (const field of props.version.fields) {
  if (field.type === 'multi_select' || field.type === 'multi_dropdown') answers[field.id] = [];
}

const submitted = ref(false);
const touched = reactive<Record<string, boolean>>({});

// Client-side result via the shared validator (UX only — server is authoritative).
const result = computed(() => validateAnswers(props.version, answers));

// Only surface an error once the user has submitted or touched that field.
function errorFor(field: Field): string | undefined {
  if (!submitted.value && !touched[field.id]) return undefined;
  return result.value.errors[field.id];
}

// Coerce raw control output to the type the schema expects before storing.
function setAnswer(field: Field, raw: unknown): void {
  touched[field.id] = true;
  if (field.type === 'number' || field.type === 'rating') {
    if (typeof raw === 'number') {
      answers[field.id] = raw;
      return;
    }
    const s = String(raw ?? '').trim();
    answers[field.id] = s === '' ? undefined : Number(s);
    return;
  }
  answers[field.id] = raw;
}

function onSubmit(): void {
  submitted.value = true;
  if (result.value.valid) emit('submit', { ...answers });
}

const themeVars = computed(() => ({
  '--fb-primary': props.version.theme.primaryColor,
  '--fb-radius': `${props.version.theme.borderRadius}px`,
  fontFamily: props.version.theme.fontFamily,
}));

// phone and date have dedicated components (UiPhoneInput / UiDatePicker).
const TEXT_INPUT_TYPES: Record<string, string> = {
  short_text: 'text',
  email: 'email',
  number: 'number',
};

function isTextInput(type: FieldType): boolean {
  return type in TEXT_INPUT_TYPES;
}

// Typed accessors keep template casts precise (no `any`).
function asText(id: string): string | number | undefined {
  return answers[id] as string | number | undefined;
}
function asChoice(id: string): string | string[] | undefined {
  return answers[id] as string | string[] | undefined;
}
function asStringArray(id: string): string[] | undefined {
  return answers[id] as string[] | undefined;
}
function asNumber(id: string): number | undefined {
  return answers[id] as number | undefined;
}
function asDateRange(id: string): string | DateRangeValue | undefined {
  return answers[id] as string | DateRangeValue | undefined;
}
</script>

<template>
  <form :style="themeVars" class="mx-auto max-w-xl" novalidate @submit.prevent="onSubmit">
    <h1 v-if="title" class="mb-8 text-3xl font-semibold tracking-tight text-ink-900">{{ title }}</h1>

    <template v-for="field in version.fields" :key="field.id">
      <!-- section_break: presentational only, carries no answer -->
      <div v-if="field.type === 'section_break'" class="mb-4 mt-8 border-t border-line-200 pt-4">
        <h2 class="text-lg font-semibold text-ink-900">{{ field.label }}</h2>
        <p v-if="field.description" class="mt-0.5 text-sm text-ink-500">{{ field.description }}</p>
      </div>

      <UiField
        v-else
        :label="field.label"
        :required="field.required"
        :description="field.description"
        :error="errorFor(field)"
        :input-id="field.id"
      >
        <UiTextInput
          v-if="isTextInput(field.type)"
          :id="field.id"
          :type="TEXT_INPUT_TYPES[field.type]"
          :placeholder="field.placeholder"
          :model-value="asText(field.id)"
          :invalid="!!errorFor(field)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiTextarea
          v-else-if="field.type === 'long_text'"
          :id="field.id"
          :placeholder="field.placeholder"
          :model-value="asText(field.id) as string | undefined"
          :invalid="!!errorFor(field)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiPhoneInput
          v-else-if="field.type === 'phone'"
          :id="field.id"
          :placeholder="field.placeholder"
          :model-value="asText(field.id) as string | undefined"
          :invalid="!!errorFor(field)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiDatePicker
          v-else-if="field.type === 'date'"
          :id="field.id"
          :range="field.date?.mode === 'range'"
          :presets="field.date?.showPresets ? (field.date?.presets ?? []) : []"
          :placeholder="field.placeholder"
          :model-value="asDateRange(field.id)"
          :invalid="!!errorFor(field)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiSelect
          v-else-if="field.type === 'dropdown'"
          :id="field.id"
          :options="field.options ?? []"
          :placeholder="field.placeholder"
          :model-value="asChoice(field.id) as string | undefined"
          :invalid="!!errorFor(field)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiMultiSelectDropdown
          v-else-if="field.type === 'multi_dropdown'"
          :id="field.id"
          :options="field.options ?? []"
          :placeholder="field.placeholder"
          :model-value="asStringArray(field.id)"
          :invalid="!!errorFor(field)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiOptionGroup
          v-else-if="field.type === 'single_select'"
          :name="field.id"
          :options="field.options ?? []"
          :model-value="asChoice(field.id)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiOptionGroup
          v-else-if="field.type === 'multi_select'"
          multiple
          :name="field.id"
          :options="field.options ?? []"
          :model-value="asChoice(field.id)"
          @update:model-value="setAnswer(field, $event)"
        />

        <UiRating
          v-else-if="field.type === 'rating'"
          :max="field.validation?.max ?? 5"
          :model-value="asNumber(field.id)"
          @update:model-value="setAnswer(field, $event)"
        />
      </UiField>
    </template>

    <!-- Host-page content that must sit above Submit (e.g. the public page's
         bot check), so a respondent sees it before they click. -->
    <slot name="before-submit" />

    <button type="submit" class="fb-btn w-full sm:w-auto" :disabled="submitting">
      <UiIcon v-if="submitting" name="arrow-path" class="text-inherit h-5 w-5 animate-spin" />
      {{ submitting ? 'Submitting…' : 'Submit' }}
    </button>
  </form>
</template>
