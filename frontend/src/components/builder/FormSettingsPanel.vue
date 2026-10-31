<script setup lang="ts">
// Right pane when no field is selected: form title + form theme (the end-user's
// per-form styling, distinct from our product chrome).
import { ref, watch } from 'vue';
import { FORM_TITLE_MAX, validateFormTitle } from '@schema';
import { useBuilderStore } from '@/stores/builder';
import { FORM_CATEGORIES } from '@/data/categories';
import BuilderSelect from './BuilderSelect.vue';

const builder = useBuilderStore();

// The input holds what was typed; the draft only ever holds a VALID title. That
// keeps autosave from PATCHing a name the server would reject (the same shared
// rule guards both ends) while still letting the user see what they're typing.
const title = ref(builder.draft.title);
const titleError = ref<string | null>(null);

// Keep in step when the draft loads or another surface renames the form.
watch(
  () => builder.draft.title,
  (next) => {
    if (next !== title.value.trim()) title.value = next;
  },
);

function onTitleInput(value: string): void {
  title.value = value;
  titleError.value = validateFormTitle(value);
  if (!titleError.value) builder.setTitle(value.trim());
}

// Leaving the field invalid would strand the input on a name that was never
// saved — put the last good one back so what's shown is what exists.
function onTitleBlur(): void {
  if (!titleError.value) return;
  title.value = builder.draft.title;
  titleError.value = null;
}

// Leading "" clears the type back to none.
const CATEGORY_OPTIONS = [
  { label: 'No type', value: '' },
  ...FORM_CATEGORIES.map((c) => ({ label: c, value: c })),
];

const FONTS = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'System', value: 'system-ui, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, monospace' },
];
</script>

<template>
  <div class="space-y-4">
    <span class="rounded-md bg-ink-100 px-2 py-0.5 text-sm font-medium text-ink-600">Form settings</span>

    <div>
      <label for="form-title" class="ui-label">Title</label>
      <input
        id="form-title"
        class="ui-input"
        :class="titleError && 'border-danger focus:border-danger focus:ring-red-100'"
        :value="title"
        :maxlength="FORM_TITLE_MAX + 1"
        :aria-invalid="!!titleError"
        :aria-describedby="titleError ? 'form-title-error' : undefined"
        @input="onTitleInput(($event.target as HTMLInputElement).value)"
        @blur="onTitleBlur"
      />
      <p v-if="titleError" id="form-title-error" role="alert" class="mt-1 text-sm text-danger">
        {{ titleError }}
      </p>
    </div>

    <div>
      <label class="ui-label">Type</label>
      <BuilderSelect
        :model-value="builder.draft.category ?? ''"
        :options="CATEGORY_OPTIONS"
        @update:model-value="builder.setCategory($event)"
      />
    </div>

    <div class="border-t border-line-100 pt-3">
      <p class="ui-label">Theme</p>

      <label class="mb-1 block text-sm text-ink-500">Primary color</label>
      <div class="flex items-center gap-2">
        <input
          type="color"
          class="ui-color"
          aria-label="Primary color"
          :value="builder.draft.theme.primaryColor"
          @input="builder.setTheme({ primaryColor: ($event.target as HTMLInputElement).value })"
        />
        <input
          class="ui-input"
          :value="builder.draft.theme.primaryColor"
          @input="builder.setTheme({ primaryColor: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <label class="mb-1 mt-3 block text-sm text-ink-500">Corner radius: {{ builder.draft.theme.borderRadius }}px</label>
      <input
        type="range"
        min="0"
        max="24"
        class="w-full accent-brand-600"
        :value="builder.draft.theme.borderRadius"
        @input="builder.setTheme({ borderRadius: Number(($event.target as HTMLInputElement).value) })"
      />

      <label class="mb-1 mt-3 block text-sm text-ink-500">Font</label>
      <BuilderSelect
        :model-value="builder.draft.theme.fontFamily"
        :options="FONTS"
        @update:model-value="builder.setTheme({ fontFamily: $event })"
      />
    </div>
  </div>
</template>
