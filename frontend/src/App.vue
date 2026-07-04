<script setup lang="ts">
// Step-2 harness: render the sample FormVersion and show the emitted payload.
// No builder yet — this proves the renderer + shared validator end to end.
import { ref } from 'vue';
import FormRenderer from './components/FormRenderer.vue';
import { sampleForm } from './fixtures/sampleForm';

const submission = ref<Record<string, unknown> | null>(null);

function onSubmit(answers: Record<string, unknown>): void {
  submission.value = answers;
}
</script>

<template>
  <main class="min-h-screen bg-gray-50 px-4 py-10">
    <FormRenderer :version="sampleForm" title="Event signup" @submit="onSubmit" />

    <section v-if="submission" class="mx-auto mt-8 max-w-xl">
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Submitted payload</h2>
      <pre class="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-300">{{ JSON.stringify(submission, null, 2) }}</pre>
    </section>
  </main>
</template>
