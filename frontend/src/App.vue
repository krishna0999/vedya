<script setup lang="ts">
// Step-2 harness: render the sample FormVersion and show the emitted payload.
// (The builder from step 3 will replace this as the app's home.)
import { ref } from 'vue';
import FormRenderer from './components/FormRenderer.vue';
import { sampleForm } from './fixtures/sampleForm';

const submission = ref<Record<string, unknown> | null>(null);

function onSubmit(answers: Record<string, unknown>): void {
  submission.value = answers;
}
</script>

<template>
  <main class="min-h-screen bg-ink-50 px-4 py-12">
    <div class="mx-auto max-w-xl">
      <div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <FormRenderer :version="sampleForm" title="Event signup" @submit="onSubmit" />
      </div>

      <section v-if="submission" class="mt-6">
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Submitted payload</h2>
        <pre class="overflow-x-auto rounded-xl bg-ink-900 p-4 text-sm leading-relaxed text-brand-200">{{ JSON.stringify(submission, null, 2) }}</pre>
      </section>
    </div>
  </main>
</template>
