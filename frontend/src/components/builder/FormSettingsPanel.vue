<script setup lang="ts">
// Right pane when no field is selected: form title + form theme (the end-user's
// per-form styling, distinct from our product chrome).
import { useBuilderStore } from '@/stores/builder';
import BuilderSelect from './BuilderSelect.vue';

const builder = useBuilderStore();

const FONTS = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'System', value: 'system-ui, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, monospace' },
];
</script>

<template>
  <div class="space-y-4">
    <span class="rounded bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">Form settings</span>

    <div>
      <label class="ui-label">Title</label>
      <input class="ui-input" :value="builder.draft.title" @input="builder.setTitle(($event.target as HTMLInputElement).value)" />
    </div>

    <div class="border-t border-ink-100 pt-3">
      <p class="ui-label">Theme</p>

      <label class="mb-1 block text-xs text-ink-500">Primary color</label>
      <div class="flex items-center gap-2">
        <input
          type="color"
          class="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-ink-200 bg-white p-0.5"
          :value="builder.draft.theme.primaryColor"
          @input="builder.setTheme({ primaryColor: ($event.target as HTMLInputElement).value })"
        />
        <input
          class="ui-input"
          :value="builder.draft.theme.primaryColor"
          @input="builder.setTheme({ primaryColor: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <label class="mb-1 mt-3 block text-xs text-ink-500">Corner radius: {{ builder.draft.theme.borderRadius }}px</label>
      <input
        type="range"
        min="0"
        max="24"
        class="w-full accent-brand-600"
        :value="builder.draft.theme.borderRadius"
        @input="builder.setTheme({ borderRadius: Number(($event.target as HTMLInputElement).value) })"
      />

      <label class="mb-1 mt-3 block text-xs text-ink-500">Font</label>
      <BuilderSelect
        :model-value="builder.draft.theme.fontFamily"
        :options="FONTS"
        @update:model-value="builder.setTheme({ fontFamily: $event })"
      />
    </div>
  </div>
</template>
