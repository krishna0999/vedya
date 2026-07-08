<script setup lang="ts">
// Owner responses view: a table of submissions + CSV export. Columns are the
// union of answer fields across submissions (headers from each submission's
// labelSnapshot, so they stay readable after the form is edited — CLAUDE.md §3).
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Submission } from '@schema';
import { api } from '@/api/client';
import AppNavMenu from '@/components/AppNavMenu.vue';
import UiButton from '@/components/ui/UiButton.vue';

const route = useRoute();
const router = useRouter();
const formId = route.params.id as string;

const title = ref('Responses');
const submissions = ref<Submission[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const [form, subs] = await Promise.all([api.getForm(formId), api.listSubmissions(formId)]);
    title.value = form.title;
    submissions.value = subs;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load responses.';
  } finally {
    loading.value = false;
  }
}

// Column set: first-seen id wins its (latest) label, since submissions arrive
// newest-first from the API.
const columns = computed(() => {
  const cols = new Map<string, string>();
  for (const s of submissions.value) {
    for (const [id, label] of Object.entries(s.labelSnapshot)) {
      if (!cols.has(id)) cols.set(id, label);
    }
  }
  return [...cols.entries()].map(([id, header]) => ({ id, header }));
});

function formatCell(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.start === 'string' && typeof o.end === 'string') return `${o.start} – ${o.end}`;
    return JSON.stringify(value);
  }
  return String(value);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-ink-50 text-ink-900">
    <header class="border-b border-ink-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div class="flex min-w-0 items-center gap-2.5">
          <AppNavMenu />
          <div class="min-w-0">
            <h1 class="truncate text-base font-semibold">{{ title }}</h1>
            <p class="text-xs text-ink-400">
              {{ submissions.length }} response{{ submissions.length === 1 ? '' : 's' }}
            </p>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <UiButton variant="secondary" size="sm" @click="router.push({ name: 'builder', params: { id: formId } })">
            Edit form
          </UiButton>
          <a v-if="submissions.length" :href="api.csvUrl(formId)" download>
            <UiButton size="sm">Export CSV</UiButton>
          </a>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <p v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{{ error }}</p>

      <div v-if="loading" class="py-16 text-center text-sm text-ink-400">Loading responses…</div>

      <div
        v-else-if="submissions.length === 0"
        class="rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center"
      >
        <h2 class="text-lg font-semibold text-ink-900">No responses yet</h2>
        <p class="mx-auto mt-1 max-w-sm text-sm text-ink-500">
          Publish the form and share its link. Submissions will show up here.
        </p>
      </div>

      <div v-else class="overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-card">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-ink-200 bg-ink-50 text-left">
              <th class="whitespace-nowrap px-4 py-3 font-semibold text-ink-500">Submitted</th>
              <th
                v-for="col in columns"
                :key="col.id"
                class="whitespace-nowrap px-4 py-3 font-semibold text-ink-700"
              >
                {{ col.header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in submissions"
              :key="s.id"
              class="border-b border-ink-100 last:border-0 hover:bg-ink-50/60"
            >
              <td class="whitespace-nowrap px-4 py-3 text-ink-400">{{ formatTime(s.meta.submittedAt) }}</td>
              <td
                v-for="col in columns"
                :key="col.id"
                class="max-w-xs truncate px-4 py-3 text-ink-800"
                :title="formatCell(s.answers[col.id])"
              >
                {{ formatCell(s.answers[col.id]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
