<script setup lang="ts">
// The public renderer a stranger loads at /f/:formId. Fetches the PUBLISHED
// FormVersion and feeds it to <FormRenderer>. The server re-validates on submit
// (authoritative); this page just relays the answers and shows the outcome.
// Form theme is scoped inside FormRenderer — no product brand leaks into it.
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { FormVersion } from '@schema';
import { api, ApiError } from '@/api/client';
import FormRenderer from '@/components/FormRenderer.vue';

const route = useRoute();
const formId = route.params.formId as string;

const version = ref<FormVersion | null>(null);
const loading = ref(true);
const loadError = ref<string | null>(null);

const submitting = ref(false);
const submitError = ref<string | null>(null);
const done = ref(false);

async function load(): Promise<void> {
  loading.value = true;
  loadError.value = null;
  try {
    version.value = await api.getPublishedVersion(formId);
  } catch (err) {
    loadError.value =
      err instanceof ApiError && err.status === 404
        ? 'This form isn’t available. It may be unpublished or the link is wrong.'
        : err instanceof Error ? err.message : 'Failed to load form.';
  } finally {
    loading.value = false;
  }
}

async function onSubmit(answers: Record<string, unknown>): Promise<void> {
  submitting.value = true;
  submitError.value = null;
  try {
    await api.submit(formId, answers);
    done.value = true;
  } catch (err) {
    submitError.value =
      err instanceof ApiError && err.status === 429
        ? 'Too many submissions. Please wait a moment and try again.'
        : err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-ink-50 px-4 py-10">
    <div class="mx-auto max-w-xl">
      <div v-if="loading" class="py-20 text-center text-sm text-ink-400">Loading…</div>

      <div v-else-if="loadError" class="rounded-2xl border border-ink-200 bg-white p-10 text-center">
        <h1 class="text-lg font-semibold text-ink-900">Form unavailable</h1>
        <p class="mt-1 text-sm text-ink-500">{{ loadError }}</p>
      </div>

      <div v-else-if="done" class="rounded-2xl border border-ink-200 bg-white p-10 text-center shadow-card">
        <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-2xl text-brand-600">✓</div>
        <h1 class="text-lg font-semibold text-ink-900">Thanks — your response was recorded.</h1>
        <p class="mt-1 text-sm text-ink-500">You can close this tab now.</p>
      </div>

      <div v-else-if="version">
        <div class="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
          <p v-if="submitError" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
            {{ submitError }}
          </p>
          <FormRenderer :version="version" :submitting="submitting" @submit="onSubmit" />
        </div>
        <p class="mt-6 text-center text-xs text-ink-400">Made with Forms</p>
      </div>
    </div>
  </div>
</template>
