<script setup lang="ts">
// The builder: palette → canvas → config panel, with an Edit/Preview toggle.
// Preview is literally <FormRenderer> fed the draft (as a preview FormVersion),
// so builder and renderer can never drift. Persistence (autosave + publish) is
// driven by the builder store; this shell surfaces its status.
import { computed, ref } from 'vue';
import { useBuilderStore } from '@/stores/builder';
import FieldPalette from './FieldPalette.vue';
import BuilderCanvas from './BuilderCanvas.vue';
import FieldConfigPanel from './FieldConfigPanel.vue';
import FormSettingsPanel from './FormSettingsPanel.vue';
import FormRenderer from '@/components/FormRenderer.vue';
import UiButton from '@/components/ui/UiButton.vue';

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

const saveLabel = computed(() => {
  switch (builder.saveStatus) {
    case 'saving': return 'Saving…';
    case 'saved': return 'Saved';
    case 'error': return 'Save failed';
    default: return '';
  }
});

const canPublish = computed(() => builder.draft.fields.length > 0 && builder.publishStatus !== 'publishing');
const publicUrl = computed(() => `${window.location.origin}/f/${builder.draft.id}`);

const copied = ref(false);
async function copyLink(): Promise<void> {
  await navigator.clipboard.writeText(publicUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <div class="flex h-screen flex-col bg-ink-50 text-ink-900">
    <header class="flex items-center justify-between gap-3 border-b border-ink-200 bg-white px-4 py-2.5">
      <div class="flex min-w-0 items-center gap-2">
        <router-link
          :to="{ name: 'dashboard' }"
          class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white transition hover:bg-brand-700"
          title="All forms"
        >F</router-link>
        <span class="truncate text-sm font-semibold text-ink-900">{{ builder.draft.title }}</span>
        <span class="hidden text-xs text-ink-400 sm:inline">· {{ builder.draft.fields.length }} fields</span>
        <span
          v-if="saveLabel"
          class="hidden text-xs sm:inline"
          :class="builder.saveStatus === 'error' ? 'text-danger' : 'text-ink-400'"
        >· {{ saveLabel }}</span>
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

      <div class="flex shrink-0 items-center gap-1.5">
        <UiButton
          variant="ghost"
          size="sm"
          @click="$router.push({ name: 'responses', params: { id: builder.draft.id } })"
        >
          Responses
        </UiButton>
        <UiButton size="sm" :disabled="!canPublish" @click="builder.publish()">
          {{ builder.publishStatus === 'publishing' ? 'Publishing…' : 'Publish' }}
        </UiButton>
      </div>
    </header>

    <!-- Post-publish share banner -->
    <div
      v-if="builder.publishStatus === 'published'"
      class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-brand-100 bg-brand-50 px-4 py-2 text-sm"
    >
      <span class="font-medium text-brand-800">Published{{ builder.lastPublished ? ` · v${builder.lastPublished.version}` : '' }}.</span>
      <code class="truncate rounded bg-white px-2 py-0.5 text-xs text-ink-600 ring-1 ring-ink-200">{{ publicUrl }}</code>
      <button type="button" class="text-xs font-medium text-brand-700 hover:text-brand-800" @click="copyLink">
        {{ copied ? 'Copied!' : 'Copy link' }}
      </button>
      <a :href="publicUrl" target="_blank" rel="noopener" class="text-xs font-medium text-brand-700 hover:text-brand-800">Open ↗</a>
    </div>
    <p
      v-else-if="builder.publishStatus === 'error'"
      class="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-danger"
    >
      {{ builder.error ?? 'Publish failed.' }}
    </p>

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
