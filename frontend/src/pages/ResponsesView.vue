<script setup lang="ts">
// Owner responses view. Two tabs over the same data:
//  - Summary: one card per current question (lib/summary.ts) — bars for
//    choices and ratings, averages for numbers, latest answers for text.
//  - Responses: the full table (the data view behind every chart), searchable,
//    with a side panel to read and delete one response.
// Column labels come from each submission's labelSnapshot, so they stay
// readable after the form is edited (CLAUDE.md §3).
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Field, Submission } from "@schema";
import { api, ApiError, type FormStats } from "@/api/client";
import { summarize } from "@/lib/summary";
import { toast } from "@/lib/toast";
import AppShell from "@/components/AppShell.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiConfirmDialog from "@/components/ui/UiConfirmDialog.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSearchInput from "@/components/ui/UiSearchInput.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const route = useRoute();
const router = useRouter();
const formId = route.params.id as string;

const title = ref("Responses");
const fields = ref<Field[]>([]); // the form's current questions, top to bottom
const submissions = ref<Submission[]>([]);
const stats = ref<FormStats | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const tab = ref<"summary" | "responses">("summary");

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
    fields.value = form.fields;
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

const summaries = computed(() => summarize(fields.value, submissions.value));

// Column set: first-seen id wins its (latest) label, since submissions arrive
// newest-first from the API. Ordered like the form — labelSnapshot is jsonb,
// which doesn't keep key order. Fields since deleted go last (stable sort).
const columns = computed(() => {
  const order = fields.value.map((f) => f.id);
  const cols = new Map<string, string>();
  for (const s of submissions.value) {
    for (const [id, label] of Object.entries(s.labelSnapshot)) {
      if (!cols.has(id)) cols.set(id, label);
    }
  }
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? order.length : i;
  };
  return [...cols.entries()]
    .map(([id, header]) => ({ id, header }))
    .sort((a, b) => rank(a.id) - rank(b.id));
});

function formatCell(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
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

const formatNumber = (n: number | null) =>
  n === null ? "-" : Number.isInteger(n) ? String(n) : n.toFixed(1);

// --- search (any answer, case-insensitive) ---------------------------------
const query = ref("");
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return submissions.value;
  return submissions.value.filter((s) =>
    Object.values(s.answers).some((v) =>
      formatCell(v).toLowerCase().includes(q),
    ),
  );
});

// --- one response in a side panel ------------------------------------------
const openId = ref<string | null>(null);
const open = computed(
  () => submissions.value.find((s) => s.id === openId.value) ?? null,
);
const closeBtn = ref<HTMLButtonElement | null>(null);
watch(openId, async (id) => {
  if (id) {
    await nextTick();
    closeBtn.value?.focus();
  }
});

const confirmDelete = ref(false);
const deleting = ref(false);
async function deleteOpen(): Promise<void> {
  const s = open.value;
  if (!s) return;
  deleting.value = true;
  try {
    await api.deleteSubmission(formId, s.id);
    submissions.value = submissions.value.filter((x) => x.id !== s.id);
    if (stats.value) stats.value.submissions -= 1;
    openId.value = null;
    toast("Response deleted.", "success");
  } catch (err) {
    toast(err instanceof ApiError ? err.message : "Couldn't delete the response.", "error");
  } finally {
    deleting.value = false;
    confirmDelete.value = false;
  }
}

function tabClass(t: "summary" | "responses"): string {
  return tab.value === t
    ? "border-brand-600 text-ink-900"
    : "border-transparent text-ink-500 hover:text-ink-800";
}

onMounted(load);
</script>

<template>
  <AppShell>
    <main class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="page-title truncate">{{ title }}</h1>
          <p class="page-subtitle">
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
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>

      <!-- Headline numbers -->
      <dl v-if="!loading && stats" class="mb-6 grid grid-cols-3 gap-3">
        <div class="rounded-md border border-line-200 bg-white px-4 py-3">
          <dt class="text-sm font-medium text-ink-500">Views</dt>
          <dd class="mt-0.5 text-xl font-semibold tabular-nums text-ink-900">
            {{ stats.views }}
          </dd>
        </div>
        <div class="rounded-md border border-line-200 bg-white px-4 py-3">
          <dt class="text-sm font-medium text-ink-500">Responses</dt>
          <dd class="mt-0.5 text-xl font-semibold tabular-nums text-ink-900">
            {{ stats.submissions }}
          </dd>
        </div>
        <div class="rounded-md border border-line-200 bg-white px-4 py-3">
          <dt class="text-sm font-medium text-ink-500">Completion</dt>
          <dd class="mt-0.5 text-xl font-semibold tabular-nums text-ink-900">
            {{ completionRate === null ? "-" : `${completionRate}%` }}
          </dd>
        </div>
      </dl>

      <!-- Skeleton mirror of the stats row + content -->
      <div v-if="loading" role="status">
        <span class="sr-only">Loading responses…</span>
        <div class="mb-6 grid grid-cols-3 gap-3">
          <div
            v-for="n in 3"
            :key="n"
            class="rounded-md border border-line-200 bg-white px-4 py-3"
          >
            <UiSkeleton class="h-3.5 w-20" />
            <UiSkeleton class="mt-2 h-6 w-12" />
          </div>
        </div>
        <div class="rounded-md border border-line-200 bg-white p-4">
          <UiSkeleton class="h-4 w-full" />
          <UiSkeleton v-for="n in 6" :key="n" class="mt-3 h-3.5 w-full" />
        </div>
      </div>

      <div
        v-else-if="submissions.length === 0"
        class="rounded-md border border-dashed border-line-300 bg-white p-12 text-center"
      >
        <h2 class="text-lg font-semibold text-ink-900">No responses yet</h2>
        <p class="mx-auto mt-1 max-w-sm text-sm text-ink-500">
          Publish the form and share its link. Submissions will show up here.
        </p>
      </div>

      <template v-else>
        <!-- Tabs -->
        <div
          class="mb-5 flex gap-5 border-b border-line-200"
          role="tablist"
          aria-label="Responses view"
        >
          <button
            v-for="t in (['summary', 'responses'] as const)"
            :key="t"
            type="button"
            role="tab"
            :aria-selected="tab === t"
            class="-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            :class="tabClass(t)"
            @click="tab = t"
          >
            {{ t === "summary" ? "Summary" : `Responses (${submissions.length})` }}
          </button>
        </div>

        <!-- SUMMARY: one card per question -->
        <div v-if="tab === 'summary'" class="grid gap-4 lg:grid-cols-2" role="tabpanel">
          <section
            v-for="s in summaries"
            :key="s.field.id"
            class="rounded-md border border-line-200 bg-white p-5"
          >
            <h2 class="font-semibold text-ink-900">{{ s.field.label }}</h2>
            <p class="mt-0.5 text-sm text-ink-500">
              {{ s.answered }} of {{ submissions.length }} answered
            </p>

            <!-- Choices & ratings: single-series horizontal bars, anchored left,
                 4px rounded data end; numbers in ink, never the bar colour. -->
            <template v-if="s.kind === 'choice' || s.kind === 'rating'">
              <p v-if="s.kind === 'rating'" class="mt-3">
                <span class="text-2xl font-semibold tabular-nums text-ink-900">{{
                  formatNumber(s.average)
                }}</span>
                <span class="text-sm text-ink-500">
                  / {{ s.field.validation?.max ?? 5 }} average</span
                >
              </p>
              <ul class="mt-4 space-y-2.5">
                <li
                  v-for="b in s.bars"
                  :key="b.label"
                  class="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm"
                  :title="`${b.label}: ${b.count} response${b.count === 1 ? '' : 's'} (${b.pct}%)`"
                >
                  <span class="truncate text-ink-700">{{ b.label }}</span>
                  <span class="h-2 min-w-0" aria-hidden="true">
                    <span
                      class="block h-2 rounded-r-md bg-brand-600"
                      :style="{ width: b.count ? `max(${b.pct}%, 2px)` : '0' }"
                    ></span>
                  </span>
                  <span class="whitespace-nowrap tabular-nums text-ink-600"
                    >{{ b.count }} · {{ b.pct }}%</span
                  >
                </li>
              </ul>
            </template>

            <!-- Numbers: average / lowest / highest -->
            <dl v-else-if="s.kind === 'number'" class="mt-4 grid grid-cols-3 gap-3">
              <div v-for="[label, value] in ([['Average', s.average], ['Lowest', s.min], ['Highest', s.max]] as const)" :key="label">
                <dt class="text-sm text-ink-500">{{ label }}</dt>
                <dd class="text-xl font-semibold tabular-nums text-ink-900">
                  {{ formatNumber(value) }}
                </dd>
              </div>
            </dl>

            <!-- Text, email, phone, dates: latest answers -->
            <template v-else>
              <ul v-if="s.recent.length" class="mt-3 divide-y divide-line-100">
                <li
                  v-for="(r, i) in s.recent"
                  :key="i"
                  class="flex items-baseline justify-between gap-4 py-2 text-sm"
                >
                  <span class="min-w-0 break-words text-ink-800">{{ r.value }}</span>
                  <span class="shrink-0 text-ink-500">{{ formatTime(r.submittedAt) }}</span>
                </li>
              </ul>
              <p v-else class="mt-3 text-sm text-ink-500">No answers yet.</p>
              <button
                v-if="s.answered > s.recent.length"
                type="button"
                class="mt-2 text-sm font-medium text-brand-700 hover:underline"
                @click="tab = 'responses'"
              >
                See all {{ s.answered }} in Responses
              </button>
            </template>
          </section>
        </div>

        <!-- RESPONSES: searchable table; a row opens the side panel -->
        <div v-else role="tabpanel">
          <div class="mb-3 max-w-sm">
            <UiSearchInput
              v-model="query"
              placeholder="Search answers…"
              aria-label="Search responses"
            />
          </div>
          <p v-if="!visible.length" class="rounded-md border border-line-200 bg-white p-8 text-center text-sm text-ink-500">
            No responses match “{{ query }}”.
          </p>
          <div
            v-else
            class="scrollbar-thin overflow-x-auto rounded-md border border-line-200 bg-white"
          >
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-line-200 bg-ink-50 text-left">
                  <th class="whitespace-nowrap px-4 py-3 font-semibold text-ink-500">
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
                  v-for="s in visible"
                  :key="s.id"
                  class="cursor-pointer border-b border-line-100 last:border-0 hover:bg-ink-50/60"
                  tabindex="0"
                  :aria-label="`Open response from ${formatTime(s.meta.submittedAt)}`"
                  @click="openId = s.id"
                  @keydown.enter="openId = s.id"
                >
                  <td class="whitespace-nowrap px-4 py-3 text-ink-500">
                    {{ formatTime(s.meta.submittedAt) }}
                  </td>
                  <td
                    v-for="col in columns"
                    :key="col.id"
                    class="max-w-xs truncate px-4 py-3 text-ink-800"
                  >
                    {{ formatCell(s.answers[col.id]) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- Side panel: one response, every answer, delete -->
      <div
        v-if="open"
        class="fixed inset-0 z-40 flex justify-end bg-ink-900/20"
        @click.self="openId = null"
        @keydown.esc="openId = null"
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="response-title"
          class="flex h-full w-full max-w-md flex-col border-l border-line-200 bg-white"
        >
          <header class="flex items-start justify-between gap-3 border-b border-line-200 px-5 py-4">
            <div>
              <h2 id="response-title" class="font-semibold text-ink-900">Response</h2>
              <p class="text-sm text-ink-500">{{ formatTime(open.meta.submittedAt) }}</p>
            </div>
            <button
              ref="closeBtn"
              type="button"
              class="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              aria-label="Close"
              @click="openId = null"
            >
              <UiIcon name="x-mark" class="h-5 w-5 text-inherit" />
            </button>
          </header>
          <dl class="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div v-for="col in columns" :key="col.id">
              <dt class="text-sm font-medium text-ink-500">
                {{ open.labelSnapshot[col.id] ?? col.header }}
              </dt>
              <dd class="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-900">
                {{ formatCell(open.answers[col.id]) }}
              </dd>
            </div>
          </dl>
          <footer class="border-t border-line-200 px-5 py-4">
            <UiButton variant="secondary" size="sm" :disabled="deleting" @click="confirmDelete = true">
              Delete response
            </UiButton>
          </footer>
        </aside>
      </div>

      <UiConfirmDialog
        :open="confirmDelete"
        title="Delete this response?"
        message="It's removed from this form, its summary and future CSV exports. This can't be undone."
        confirm-label="Delete response"
        :confirm-disabled="deleting"
        @confirm="deleteOpen"
        @cancel="confirmDelete = false"
      />
    </main>
  </AppShell>
</template>
