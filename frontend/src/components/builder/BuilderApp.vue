<script setup lang="ts">
// The builder: palette → canvas → config panel, with an Edit/Preview toggle.
// Preview is literally <FormRenderer> fed the draft (as a preview FormVersion),
// so builder and renderer can never drift.
import { ref } from 'vue';
import { useBuilderStore } from '@/stores/builder';
import FieldPalette from './FieldPalette.vue';
import BuilderCanvas from './BuilderCanvas.vue';
import FieldConfigPanel from './FieldConfigPanel.vue';
import FormSettingsPanel from './FormSettingsPanel.vue';
import FormRenderer from '@/components/FormRenderer.vue';

const builder = useBuilderStore();
const mode = ref<'edit' | 'preview'>('edit');
const previewSubmission = ref<Record<string, unknown> | null>(null);

function setMode(next: 'edit' | 'preview'): void {
  mode.value = next;
  if (next === 'preview') builder.select(null);
  previewSubmission.value = null;
}
function onPreviewSubmit(answers: Record<string, unknown>): void {
  previewSubmission.value = answers;
}
</script>

<template>
  <div class="flex h-screen flex-col bg-ink-50 text-ink-900">
    <header class="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-2.5">
      <div class="flex items-center gap-2">
        <span class="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">F</span>
        <span class="truncate text-sm font-semibold text-ink-900">{{ builder.draft.title }}</span>
        <span class="hidden text-xs text-ink-400 sm:inline">· {{ builder.draft.fields.length }} fields</span>
      </div>
      <div class="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5 text-sm">
        <button
          type="button"
          class="rounded-md px-3 py-1 font-medium transition-colors"
          :class="mode === 'edit' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'"
          @click="setMode('edit')"
        >
          Edit
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1 font-medium transition-colors"
          :class="mode === 'preview' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'"
          @click="setMode('preview')"
        >
          Preview
        </button>
      </div>
    </header>

    <!-- EDIT -->
    <div v-if="mode === 'edit'" class="flex min-h-0 flex-1">
      <FieldPalette />
      <main class="flex-1 overflow-y-auto p-6" @click.self="builder.select(null)">
        <BuilderCanvas />
      </main>
      <aside class="w-80 shrink-0 overflow-y-auto border-l border-ink-200 bg-white p-4">
        <FieldConfigPanel v-if="builder.selectedField" :key="builder.selectedField.id" :field="builder.selectedField" />
        <FormSettingsPanel v-else />
      </aside>
    </div>

    <!-- PREVIEW -->
    <div v-else class="min-h-0 flex-1 overflow-y-auto p-8">
      <div class="mx-auto max-w-xl">
        <div v-if="builder.draft.fields.length === 0" class="rounded-2xl border border-ink-200 bg-white p-10 text-center text-ink-500">
          Add some fields to preview the form.
        </div>
        <div v-else class="rounded-2xl border border-ink-200 bg-white p-8 shadow-card">
          <FormRenderer :version="builder.previewVersion" :title="builder.draft.title" @submit="onPreviewSubmit" />
        </div>

        <section v-if="previewSubmission" class="mt-6">
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Validated submission (preview)</h2>
          <pre class="overflow-x-auto rounded-xl bg-ink-900 p-4 text-sm leading-relaxed text-brand-200">{{ JSON.stringify(previewSubmission, null, 2) }}</pre>
        </section>
      </div>
    </div>
  </div>
</template>
