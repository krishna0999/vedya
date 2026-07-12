<script setup lang="ts">
// Home dashboard: welcome + quick actions, headline stats, recent forms,
// recent responses, a 30-day response trend, and an activity feed. The full
// forms list lives on /forms; this page is the at-a-glance overview.
// Topbar (search/bell/avatar) is AppShell's — shared across all pages.
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  api,
  type AccountUsage,
  type FormSummary,
} from "@/api/client";
import { relativeTime } from "@/lib/time";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/AppShell.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const router = useRouter();
const auth = useAuthStore();

const usage = ref<AccountUsage | null>(null);
const forms = ref<FormSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

interface RecentResponse {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
}
const recentResponses = ref<RecentResponse[]>([]);

onMounted(async () => {
  try {
    [usage.value, forms.value] = await Promise.all([
      api.getUsage(),
      api.listForms(),
    ]);
    // ponytail: recent responses are merged client-side from the 3 most
    // recently active forms — add a /submissions/recent endpoint if form
    // counts grow past a handful.
    const active = [...forms.value]
      .filter((f) => f.responseCount > 0)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3);
    const perForm = await Promise.all(
      active.map(async (f) => {
        const subs = await api.listSubmissions(f.id);
        return subs.map((s) => ({
          id: s.id,
          formId: f.id,
          formTitle: f.title,
          submittedAt: s.meta.submittedAt,
        }));
      }),
    );
    recentResponses.value = perForm
      .flat()
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5);
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load dashboard.";
  } finally {
    loading.value = false;
  }
});

const firstName = computed(() => {
  const source =
    auth.user?.name?.trim() || (auth.user?.email ?? "").split("@")[0] || "";
  return source.split(/[\s._+-]+/)[0] || "there";
});

const completionRate = computed(() => {
  const u = usage.value;
  if (!u || u.views === 0) return "—";
  return `${Math.round((u.submissions / u.views) * 100)}%`;
});

const stats = computed(() => {
  const u = usage.value;
  return [
    { label: "Forms", value: u ? String(u.forms) : "—", hint: u ? `${u.published} published` : "" },
    { label: "Responses", value: u ? u.submissions.toLocaleString() : "—", hint: "all time" },
    { label: "Views", value: u ? u.views.toLocaleString() : "—", hint: "all time" },
    { label: "Completion rate", value: completionRate.value, hint: "responses ÷ views" },
  ];
});

const recentForms = computed(() =>
  [...forms.value]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5),
);

// Activity feed derived from what we already have (edits + responses) —
// ponytail: becomes a real event log when post-submission actions (§9) land.
const activity = computed(() => {
  const events = [
    ...recentResponses.value.map((r) => ({
      key: `sub-${r.id}`,
      icon: "paper-airplane" as const,
      text: `New response on “${r.formTitle}”`,
      at: r.submittedAt,
      to: { name: "responses", params: { id: r.formId } },
    })),
    ...forms.value.map((f) => ({
      key: `edit-${f.id}`,
      icon: "pencil-square" as const,
      text: `Edited “${f.title}”`,
      at: f.updatedAt,
      to: { name: "builder", params: { id: f.id } },
    })),
  ];
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
});

const creating = ref(false);
async function createForm(): Promise<void> {
  creating.value = true;
  try {
    const draft = await api.createForm();
    router.push({ name: "builder", params: { id: draft.id } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to create form.";
    creating.value = false;
  }
}

// --- response trend (30 days, single indigo series — validated on light) ---
const W = 600;
const H = 200;
const PAD = { top: 12, right: 12, bottom: 24, left: 36 };
const LINE = "#4f46e5";

const days = computed(() => usage.value?.timeline ?? []);
const yMax = computed(() => {
  const raw = Math.max(1, ...days.value.map((d) => d.submissions));
  const step = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 5, 10].find((m) => m * step >= raw)! * step;
  return nice;
});
const yTicks = computed(() => [0, 0.5, 1].map((f) => f * yMax.value));

function x(i: number): number {
  const n = Math.max(1, days.value.length - 1);
  return PAD.left + (i / n) * (W - PAD.left - PAD.right);
}
function y(v: number): number {
  return H - PAD.bottom - (v / yMax.value) * (H - PAD.top - PAD.bottom);
}
const linePath = computed(() =>
  days.value
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.submissions).toFixed(1)}`)
    .join(""),
);
const areaPath = computed(() =>
  days.value.length
    ? `${linePath.value}L${x(days.value.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`
    : "",
);
const xTicks = computed(() =>
  days.value
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % 7 === 0 || i === days.value.length - 1),
);
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
const hover = ref<number | null>(null);
function onMove(e: MouseEvent): void {
  const svg = e.currentTarget as SVGSVGElement;
  const frac = (e.clientX - svg.getBoundingClientRect().left) / svg.clientWidth;
  const n = Math.max(1, days.value.length - 1);
  const i = Math.round(((frac * W - PAD.left) / (W - PAD.left - PAD.right)) * n);
  hover.value = Math.min(Math.max(i, 0), days.value.length - 1);
}
</script>

<template>
  <AppShell>
    <!-- Full-width content — px-6 side padding only, no centered max-w column. -->
    <main class="w-full px-6 py-8">
      <p
        v-if="error"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>

      <!-- Welcome + quick actions -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-ink-900">
            Welcome back, {{ firstName }} 👋
          </h1>
          <p class="mt-1 text-sm text-ink-500">
            Here's what's happening with your forms.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UiButton :disabled="creating" @click="createForm">
            <UiIcon name="plus" class="text-inherit h-4 w-4" />
            <span>{{ creating ? "Creating…" : "Create form" }}</span>
          </UiButton>
          <UiButton
            variant="secondary"
            @click="router.push({ name: 'forms', query: { view: 'templates' } })"
          >
            Browse templates
          </UiButton>
        </div>
      </div>

      <!-- Stats -->
      <dl class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div
          v-for="s in stats"
          :key="s.label"
          class="rounded-lg border border-ink-200 bg-white px-4 py-3"
        >
          <dt class="text-sm font-medium text-ink-400">{{ s.label }}</dt>
          <UiSkeleton v-if="loading" class="mt-1.5 h-7 w-16" />
          <dd
            v-else
            class="mt-0.5 text-2xl font-semibold text-ink-900"
            style="font-variant-numeric: tabular-nums"
          >
            {{ s.value }}
          </dd>
          <UiSkeleton v-if="loading" class="mt-1.5 h-3.5 w-20" />
          <p v-else class="text-sm text-ink-400">{{ s.hint }}</p>
        </div>
      </dl>

      <!-- Skeleton mirror of the 2x2 section grid below -->
      <div v-if="loading" role="status" class="mt-6 grid gap-4 md:grid-cols-2">
        <span class="sr-only">Loading your dashboard…</span>
        <section
          v-for="n in 4"
          :key="n"
          class="rounded-lg border border-ink-200 bg-white p-5"
        >
          <UiSkeleton class="h-5 w-36" />
          <div class="mt-4 space-y-4">
            <div v-for="row in 4" :key="row" class="flex items-center gap-3">
              <UiSkeleton class="h-8 w-8 shrink-0 rounded-lg" />
              <div class="flex-1 space-y-1.5">
                <UiSkeleton class="h-3.5 w-2/5" />
                <UiSkeleton class="h-3 w-1/4" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <template v-else>
        <!-- 2-up rows: Recent forms | Recent responses, then Trend | Activity -->
        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <!-- Recent forms -->
          <section class="rounded-lg border border-ink-200 bg-white p-5" aria-label="Recent forms">
            <div class="flex items-baseline justify-between">
              <h2 class="font-semibold text-ink-900">Recent forms</h2>
              <router-link
                :to="{ name: 'forms' }"
                class="text-sm font-medium text-brand-700 hover:underline"
              >
                View all
              </router-link>
            </div>
            <p v-if="!recentForms.length" class="mt-3 text-sm text-ink-400">
              No forms yet — create one to get started.
            </p>
            <ul v-else class="mt-3 divide-y divide-ink-100">
              <li v-for="f in recentForms" :key="f.id">
                <router-link
                  :to="{ name: 'builder', params: { id: f.id } }"
                  class="group flex items-center gap-3 py-2.5"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-ink-900 group-hover:text-brand-700">
                      {{ f.title }}
                    </p>
                    <p class="text-sm text-ink-400">
                      {{ f.responseCount }} response{{ f.responseCount === 1 ? "" : "s" }}
                      · edited {{ relativeTime(f.updatedAt) }}
                    </p>
                  </div>
                  <span
                    class="shrink-0 rounded-full px-2 py-0.5 text-sm font-medium"
                    :class="f.published ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'"
                  >
                    {{ f.published ? "Published" : "Draft" }}
                  </span>
                </router-link>
              </li>
            </ul>
          </section>

          <!-- Recent responses -->
          <section class="rounded-lg border border-ink-200 bg-white p-5" aria-label="Recent responses">
            <h2 class="font-semibold text-ink-900">Recent responses</h2>
            <p v-if="!recentResponses.length" class="mt-3 text-sm text-ink-400">
              No responses yet — share a published form to start collecting.
            </p>
            <ul v-else class="mt-3 divide-y divide-ink-100">
              <li v-for="r in recentResponses" :key="r.id">
                <router-link
                  :to="{ name: 'responses', params: { id: r.formId } }"
                  class="group flex items-center gap-3 py-2.5"
                >
                  <span
                    class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"
                    aria-hidden="true"
                  >
                    <UiIcon name="paper-airplane" class="text-inherit h-4 w-4" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-ink-900 group-hover:text-brand-700">
                      {{ r.formTitle }}
                    </p>
                    <p class="text-sm text-ink-400">{{ relativeTime(r.submittedAt) }}</p>
                  </div>
                </router-link>
              </li>
            </ul>
          </section>

          <!-- Response trend -->
          <section
            class="rounded-lg border border-ink-200 bg-white p-5"
            aria-label="Responses over the last 30 days"
          >
            <h2 class="font-semibold text-ink-900">Response trend</h2>
            <p class="text-sm text-ink-400">Responses, last 30 days</p>
            <div class="relative mt-4">
              <svg
                :viewBox="`0 0 ${W} ${H}`"
                class="w-full"
                role="img"
                aria-label="Daily responses over the last 30 days"
                @mousemove="onMove"
                @mouseleave="hover = null"
              >
                <g v-for="t in yTicks" :key="t">
                  <line :x1="PAD.left" :x2="W - PAD.right" :y1="y(t)" :y2="y(t)" stroke="#eceaf1" stroke-width="1" />
                  <text :x="PAD.left - 8" :y="y(t) + 3" text-anchor="end" class="fill-ink-400" style="font-size: 10px; font-variant-numeric: tabular-nums">
                    {{ t.toLocaleString() }}
                  </text>
                </g>
                <text
                  v-for="{ d, i } in xTicks"
                  :key="d.day"
                  :x="x(i)"
                  :y="H - 6"
                  text-anchor="middle"
                  class="fill-ink-400"
                  style="font-size: 10px"
                >
                  {{ shortDate(d.day) }}
                </text>
                <path :d="areaPath" :fill="LINE" opacity="0.08" />
                <path
                  :d="linePath"
                  fill="none"
                  :stroke="LINE"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <template v-if="hover !== null && days[hover]">
                  <line :x1="x(hover)" :x2="x(hover)" :y1="PAD.top" :y2="H - PAD.bottom" stroke="#b8b4c2" stroke-width="1" />
                  <circle :cx="x(hover)" :cy="y(days[hover]!.submissions)" r="4" :fill="LINE" stroke="#ffffff" stroke-width="2" />
                </template>
              </svg>
              <div
                v-if="hover !== null && days[hover]"
                class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-pop"
                :style="{ left: `${(x(hover) / W) * 100}%` }"
              >
                <p class="whitespace-nowrap text-sm font-medium text-ink-900">
                  {{ shortDate(days[hover]!.day) }}
                </p>
                <p class="whitespace-nowrap text-sm text-ink-600">
                  Responses:
                  <span style="font-variant-numeric: tabular-nums">{{ days[hover]!.submissions }}</span>
                </p>
              </div>
            </div>
          </section>

          <!-- Activity feed -->
          <section class="rounded-lg border border-ink-200 bg-white p-5" aria-label="Recent activity">
            <h2 class="font-semibold text-ink-900">Activity</h2>
            <p v-if="!activity.length" class="mt-3 text-sm text-ink-400">
              Nothing yet — activity shows up as you build and collect.
            </p>
            <ul v-else class="mt-3 divide-y divide-ink-100">
              <li v-for="ev in activity" :key="ev.key">
                <router-link :to="ev.to" class="group flex items-center gap-3 py-2.5">
                  <span
                    class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500"
                    aria-hidden="true"
                  >
                    <UiIcon :name="ev.icon" class="text-inherit h-4 w-4" />
                  </span>
                  <p class="min-w-0 flex-1 truncate text-sm text-ink-700 group-hover:text-brand-700">
                    {{ ev.text }}
                  </p>
                  <span class="shrink-0 text-sm text-ink-400">{{ relativeTime(ev.at) }}</span>
                </router-link>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </main>
  </AppShell>
</template>
