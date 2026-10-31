<script setup lang="ts">
// Right pane when no field is selected: form title + form theme (the end-user's
// per-form styling, distinct from our product chrome), what respondents see
// after submitting, and whether the form still takes responses.
import { computed, ref, watch } from 'vue';
import { FORM_TITLE_MAX, isSafeRedirectUrl, validateFormTitle } from '@schema';
import UiDatePicker from '@/components/ui/UiDatePicker.vue';
import UiToggle from '@/components/ui/UiToggle.vue';
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

// Same pattern as the title: the draft only ever holds a valid link (or none).
const redirect = ref(builder.draft.ending?.redirectUrl ?? '');
const redirectError = ref<string | null>(null);
function onRedirectInput(value: string): void {
  redirect.value = value;
  const url = value.trim();
  redirectError.value = url && !isSafeRedirectUrl(url) ? 'Use a full link starting with https://' : null;
  if (!redirectError.value) builder.setEnding({ redirectUrl: url });
}

// Close date: picked as a day, stored as the end of that day in the creator's
// timezone, so "closes on the 5th" still takes responses all of the 5th.
const closesOn = computed(() => {
  const at = builder.draft.access?.closesAt;
  if (!at) return undefined;
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});
function setClosesOn(day: unknown): void {
  builder.setAccess({
    closesAt: typeof day === 'string' ? new Date(`${day}T23:59:59.999`).toISOString() : undefined,
  });
}

function setMaxResponses(value: string): void {
  const n = Math.floor(Number(value));
  builder.setAccess({ maxResponses: value.trim() && n >= 1 ? n : undefined });
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

    <div class="border-t border-line-100 pt-3">
      <p class="ui-label">After submit</p>

      <label for="ending-message" class="mb-1 block text-sm text-ink-500">Thank-you message</label>
      <textarea
        id="ending-message"
        class="ui-input min-h-[72px] resize-y"
        maxlength="500"
        placeholder="Your response is submitted. Thank you!"
        :value="builder.draft.ending?.message ?? ''"
        @input="builder.setEnding({ message: ($event.target as HTMLTextAreaElement).value })"
      />

      <label for="ending-redirect" class="mb-1 mt-3 block text-sm text-ink-500">Redirect to a page</label>
      <input
        id="ending-redirect"
        class="ui-input"
        type="url"
        inputmode="url"
        placeholder="https://example.com/thanks"
        :class="redirectError && 'border-danger focus:border-danger focus:ring-red-100'"
        :value="redirect"
        :aria-invalid="!!redirectError"
        :aria-describedby="redirectError ? 'ending-redirect-error' : undefined"
        @input="onRedirectInput(($event.target as HTMLInputElement).value)"
      />
      <p v-if="redirectError" id="ending-redirect-error" role="alert" class="mt-1 text-sm text-danger">
        {{ redirectError }}
      </p>
      <p v-else class="mt-1 text-sm text-ink-500">Optional. Respondents go here right after submitting.</p>
    </div>

    <div class="border-t border-line-100 pt-3">
      <p class="ui-label">Responses</p>
      <p class="mb-3 text-sm text-ink-500">These apply right away, no need to publish.</p>

      <UiToggle
        label="Accepting responses"
        :model-value="!builder.draft.access?.closed"
        @update:model-value="builder.setAccess({ closed: !$event })"
      />

      <div class="mb-1 mt-3 flex items-baseline justify-between">
        <label for="closes-on" class="text-sm text-ink-500">Close after</label>
        <button
          v-if="closesOn"
          type="button"
          class="text-sm font-medium text-brand-700 hover:text-brand-800"
          @click="setClosesOn(undefined)"
        >
          Clear
        </button>
      </div>
      <UiDatePicker
        id="closes-on"
        placeholder="No close date"
        :model-value="closesOn"
        :presets="[]"
        @update:model-value="setClosesOn"
      />

      <label for="max-responses" class="mb-1 mt-3 block text-sm text-ink-500">Response limit</label>
      <input
        id="max-responses"
        class="ui-input"
        type="number"
        min="1"
        step="1"
        placeholder="No limit"
        :value="builder.draft.access?.maxResponses ?? ''"
        @change="setMaxResponses(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
