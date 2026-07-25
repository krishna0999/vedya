<script setup lang="ts">
// Owner responses view: a table of submissions + CSV export. Columns are the
// union of answer fields across submissions (headers from each submission's
// labelSnapshot, so they stay readable after the form is edited — CLAUDE.md §3).
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Submission } from "@schema";
import { api, type FormStats } from "@/api/client";
import AppShell from "@/components/AppShell.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const route = useRoute();
const router = useRouter();
const formId = route.params.id as string;

const title = ref("Responses");
const submissions = ref<Submission[]>([]);
const stats = ref<FormStats | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const [form, subs, formStats] = await Promise.all([
      api.getForm(formId),
      api.listSubmissions(formId),
      api.getFormStats(formId),
    ]);
    title.value = form.title;
    submissions.value = subs;
    stats.value = formStats;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load responses.";
  } finally {
    loading.value = false;
  }
}

// Completion rate = submissions / views. Views can lag submissions (views only
// count since analytics shipped), so cap the display at 100%.
const completionRate = computed(() => {
  if (!stats.value || stats.value.views === 0) return null;
  return Math.min(
    100,
    Math.round((stats.value.submissions / stats.value.views) * 100),
  );
});

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
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.start === "string" && typeof o.end === "string")
      return `${o.start} – ${o.end}`;
    return JSON.stringify(value);
  }
  return String(value);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(load);
</script>

<template>
  <AppShell>
    <main class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-lg font-semibold">{{ title }}</h1>
          <p class="text-sm text-ink-500">
            {{ submissions.length }} response{{
              submissions.length === 1 ? "" : "s"
            }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1.5">
          <UiButton
            variant="secondary"
            size="sm"
            @click="router.push({ name: 'builder', params: { id: formId } })"
          >
            Edit form
          </UiButton>
          <a v-if="submissions.length" :href="api.csvUrl(formId)" download>
            <UiButton size="sm">Export CSV</UiButton>
          </a>
        </div>
      </div>
      <p
        v-if="error"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>

      <!-- Basic analytics (ROADMAP Phase 1): views / submissions / completion. -->
      <dl v-if="!loading && stats" class="mb-6 grid grid-cols-3 gap-3">
        <div
          class="rounded-xl border border-line-200 bg-white px-4 py-3 shadow-card"
        >
          <dt class="text-sm font-medium text-ink-500">Views</dt>
          <dd class="mt-0.5 text-xl font-semibold text-ink-900">
            {{ stats.views }}
          </dd>
        </div>
        <div
          class="rounded-xl border border-line-200 bg-white px-4 py-3 shadow-card"
        >
          <dt class="text-sm font-medium text-ink-500">Responses</dt>
          <dd class="mt-0.5 text-xl font-semibold text-ink-900">
            {{ stats.submissions }}
          </dd>
        </div>
        <div
          class="rounded-xl border border-line-200 bg-white px-4 py-3 shadow-card"
        >
          <dt class="text-sm font-medium text-ink-500">Completion</dt>
          <dd class="mt-0.5 text-xl font-semibold text-ink-900">
            {{ completionRate === null ? "—" : `${completionRate}%` }}
          </dd>
        </div>
      </dl>

      <!-- Skeleton mirror of the stats row + table -->
      <div v-if="loading" role="status">
        <span class="sr-only">Loading responses…</span>
        <div class="mb-6 grid grid-cols-3 gap-3">
          <div
            v-for="n in 3"
            :key="n"
            class="rounded-xl border border-line-200 bg-white px-4 py-3 shadow-card"
          >
            <UiSkeleton class="h-3.5 w-20" />
            <UiSkeleton class="mt-2 h-6 w-12" />
          </div>
        </div>
        <div class="rounded-xl border border-line-200 bg-white p-4 shadow-card">
          <UiSkeleton class="h-4 w-full" />
          <UiSkeleton v-for="n in 6" :key="n" class="mt-3 h-3.5 w-full" />
        </div>
      </div>

      <div
        v-else-if="submissions.length === 0"
        class="rounded-2xl border border-dashed border-line-300 bg-white p-12 text-center"
      >
        <h2 class="text-lg font-semibold text-ink-900">No responses yet</h2>
        <p class="mx-auto mt-1 max-w-sm text-sm text-ink-500">
          Publish the form and share its link. Submissions will show up here.
        </p>
      </div>

      <div
        v-else
        class="scrollbar-thin overflow-x-auto rounded-xl border border-line-200 bg-white shadow-card"
      >
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-line-200 bg-ink-50 text-left">
              <th
                class="whitespace-nowrap px-4 py-3 font-semibold text-ink-500"
              >
                Submitted
              </th>
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
              class="border-b border-line-100 last:border-0 hover:bg-ink-50/60"
            >
              <td class="whitespace-nowrap px-4 py-3 text-ink-500">
                {{ formatTime(s.meta.submittedAt) }}
              </td>
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
  </AppShell>
</template>
