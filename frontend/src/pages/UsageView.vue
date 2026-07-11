<script setup lang="ts">
// Account-level analytics: KPI tiles, monthly quota meters, a 30-day
// views/submissions line chart (hand-rolled SVG — no chart dep), and a
// per-form table (which doubles as the chart's tabular fallback).
// Series palette (indigo #4f46e5 + teal #0d9488) validated for CVD separation
// and 3:1 surface contrast (dataviz six-checks, light surface #ffffff).
import { computed, onMounted, ref } from "vue";
import { api, type AccountUsage, type FormSummary } from "@/api/client";
import AppShell from "@/components/AppShell.vue";
import UiUserMenu from "@/components/ui/UiUserMenu.vue";

const usage = ref<AccountUsage | null>(null);
const forms = ref<FormSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    [usage.value, forms.value] = await Promise.all([
      api.getUsage(),
      api.listForms(),
    ]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load usage.";
  } finally {
    loading.value = false;
  }
});

const conversion = computed(() => {
  const u = usage.value;
  if (!u || u.views === 0) return "—";
  return `${Math.round((u.submissions / u.views) * 100)}%`;
});

// Per-form table, busiest first.
const topForms = computed(() =>
  [...forms.value].sort((a, b) => b.viewCount - a.viewCount),
);

// --- chart geometry (SVG viewBox units; the svg stretches to the card) ---
const W = 640;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 36 };
const SERIES = [
  { key: "views", label: "Views", color: "#4f46e5" },
  { key: "submissions", label: "Submissions", color: "#0d9488" },
] as const;

const days = computed(() => usage.value?.timeline ?? []);

// Clean y ticks: a "nice" step (1/2/5 × 10^k) covering the max.
const yMax = computed(() => {
  const raw = Math.max(
    1,
    ...days.value.map((d) => Math.max(d.views, d.submissions)),
  );
  const step = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 5, 10].find((m) => m * step >= raw)! * step;
  return nice;
});
const yTicks = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax.value),
);

function x(i: number): number {
  const n = Math.max(1, days.value.length - 1);
  return PAD.left + (i / n) * (W - PAD.left - PAD.right);
}
function y(v: number): number {
  return H - PAD.bottom - (v / yMax.value) * (H - PAD.top - PAD.bottom);
}
function linePath(key: "views" | "submissions"): string {
  return days.value
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`)
    .join("");
}
// Label roughly weekly along the x-axis.
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

// Hover: nearest-day crosshair + tooltip (hit target = the day's whole column).
const hover = ref<number | null>(null);
function onMove(e: MouseEvent): void {
  const svg = e.currentTarget as SVGSVGElement;
  const frac =
    (e.clientX - svg.getBoundingClientRect().left) / svg.clientWidth;
  const px = frac * W;
  const n = Math.max(1, days.value.length - 1);
  const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * n);
  hover.value = Math.min(Math.max(i, 0), days.value.length - 1);
}

// Quota meter: fill escalates as the month's quota is consumed.
function meterColor(used: number, limit: number | null): string {
  if (limit === null) return "#4f46e5";
  const f = used / limit;
  return f >= 1 ? "#dc2626" : f >= 0.8 ? "#d97706" : "#4f46e5";
}
function meterTrack(used: number, limit: number | null): string {
  const fill = meterColor(used, limit);
  // lighter step of the same ramp so state reads across the whole bar
  return fill === "#dc2626" ? "#fee2e2" : fill === "#d97706" ? "#fef3c7" : "#e0e7ff";
}
function pct(used: number, limit: number | null): number {
  if (limit === null) return 0;
  return Math.min(100, (used / limit) * 100);
}
</script>

<template>
  <AppShell>
    <header class="sticky top-0 z-20 border-b border-ink-200 bg-white">
      <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <h1 class="text-base font-semibold">Usage</h1>
        <UiUserMenu />
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <p
        v-if="error"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>
      <div v-if="loading" class="py-16 text-center text-sm text-ink-400">
        Loading usage…
      </div>

      <template v-else-if="usage">
        <!-- KPI row -->
        <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card">
            <dt class="text-sm font-medium text-ink-400">Forms</dt>
            <dd class="mt-0.5 text-2xl font-semibold text-ink-900">{{ usage.forms }}</dd>
            <p class="text-sm text-ink-400">{{ usage.published }} published</p>
          </div>
          <div class="rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card">
            <dt class="text-sm font-medium text-ink-400">Views</dt>
            <dd class="mt-0.5 text-2xl font-semibold text-ink-900">{{ usage.views.toLocaleString() }}</dd>
            <p class="text-sm text-ink-400">all time</p>
          </div>
          <div class="rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card">
            <dt class="text-sm font-medium text-ink-400">Responses</dt>
            <dd class="mt-0.5 text-2xl font-semibold text-ink-900">{{ usage.submissions.toLocaleString() }}</dd>
            <p class="text-sm text-ink-400">all time</p>
          </div>
          <div class="rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card">
            <dt class="text-sm font-medium text-ink-400">Conversion</dt>
            <dd class="mt-0.5 text-2xl font-semibold text-ink-900">{{ conversion }}</dd>
            <p class="text-sm text-ink-400">responses ÷ views</p>
          </div>
        </dl>

        <!-- 30-day trend -->
        <section
          class="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
          aria-label="Views and responses, last 30 days"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-semibold text-ink-900">Last 30 days</h2>
            <ul class="flex items-center gap-4">
              <li v-for="s in SERIES" :key="s.key" class="flex items-center gap-1.5 text-sm text-ink-600">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ background: s.color }" aria-hidden="true"></span>
                {{ s.label }}
              </li>
            </ul>
          </div>

          <div class="relative mt-4">
            <svg
              :viewBox="`0 0 ${W} ${H}`"
              class="w-full"
              role="img"
              aria-label="Daily views and responses over the last 30 days; the table below carries the totals per form"
              @mousemove="onMove"
              @mouseleave="hover = null"
            >
              <!-- gridlines + y ticks -->
              <g v-for="t in yTicks" :key="t">
                <line :x1="PAD.left" :x2="W - PAD.right" :y1="y(t)" :y2="y(t)" stroke="#eceaf1" stroke-width="1" />
                <text :x="PAD.left - 8" :y="y(t) + 3" text-anchor="end" class="fill-ink-400" style="font-size: 10px; font-variant-numeric: tabular-nums">
                  {{ t.toLocaleString() }}
                </text>
              </g>
              <!-- x labels (weekly) -->
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
              <!-- series lines: 2px, round joins -->
              <path
                v-for="s in SERIES"
                :key="s.key"
                :d="linePath(s.key)"
                fill="none"
                :stroke="s.color"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- crosshair + markers (2px surface ring) on hover -->
              <template v-if="hover !== null && days[hover]">
                <line :x1="x(hover)" :x2="x(hover)" :y1="PAD.top" :y2="H - PAD.bottom" stroke="#b8b4c2" stroke-width="1" />
                <circle
                  v-for="s in SERIES"
                  :key="s.key"
                  :cx="x(hover)"
                  :cy="y(days[hover]![s.key])"
                  r="4"
                  :fill="s.color"
                  stroke="#ffffff"
                  stroke-width="2"
                />
              </template>
            </svg>

            <!-- tooltip -->
            <div
              v-if="hover !== null && days[hover]"
              class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-pop"
              :style="{ left: `${(x(hover) / W) * 100}%` }"
            >
              <p class="whitespace-nowrap text-sm font-medium text-ink-900">{{ shortDate(days[hover]!.day) }}</p>
              <p v-for="s in SERIES" :key="s.key" class="flex items-center gap-1.5 whitespace-nowrap text-sm text-ink-600">
                <span class="h-2 w-2 rounded-full" :style="{ background: s.color }" aria-hidden="true"></span>
                {{ s.label }}: <span style="font-variant-numeric: tabular-nums">{{ days[hover]![s.key] }}</span>
              </p>
            </div>
          </div>
        </section>

        <!-- Monthly quota -->
        <section
          class="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
          aria-label="This month's quota"
        >
          <h2 class="font-semibold text-ink-900">This month</h2>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <div class="flex items-baseline justify-between">
                <p class="text-sm font-medium text-ink-600">Responses</p>
                <p class="text-sm text-ink-400" style="font-variant-numeric: tabular-nums">
                  {{ usage.monthSubmissions.toLocaleString() }} /
                  {{ usage.limits.responsesPerMonth === null ? "∞" : usage.limits.responsesPerMonth.toLocaleString() }}
                </p>
              </div>
              <div
                class="mt-1.5 h-2 overflow-hidden rounded-full"
                :style="{ background: meterTrack(usage.monthSubmissions, usage.limits.responsesPerMonth) }"
                role="meter"
                :aria-valuenow="usage.monthSubmissions"
                :aria-valuemax="usage.limits.responsesPerMonth ?? undefined"
                aria-label="Responses used this month"
              >
                <div
                  class="h-full rounded-full transition-all"
                  :style="{
                    width: `${pct(usage.monthSubmissions, usage.limits.responsesPerMonth)}%`,
                    background: meterColor(usage.monthSubmissions, usage.limits.responsesPerMonth),
                  }"
                ></div>
              </div>
            </div>
            <div>
              <div class="flex items-baseline justify-between">
                <p class="text-sm font-medium text-ink-600">AI generations</p>
                <p class="text-sm text-ink-400" style="font-variant-numeric: tabular-nums">
                  {{ usage.monthAiGenerations }} / {{ usage.limits.aiGenerationsPerMonth }}
                </p>
              </div>
              <div
                class="mt-1.5 h-2 overflow-hidden rounded-full"
                :style="{ background: meterTrack(usage.monthAiGenerations, usage.limits.aiGenerationsPerMonth) }"
                role="meter"
                :aria-valuenow="usage.monthAiGenerations"
                :aria-valuemax="usage.limits.aiGenerationsPerMonth"
                aria-label="AI generations used this month"
              >
                <div
                  class="h-full rounded-full transition-all"
                  :style="{
                    width: `${pct(usage.monthAiGenerations, usage.limits.aiGenerationsPerMonth)}%`,
                    background: meterColor(usage.monthAiGenerations, usage.limits.aiGenerationsPerMonth),
                  }"
                ></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Per-form breakdown (the chart's tabular fallback) -->
        <section
          class="mt-6 rounded-2xl border border-ink-200 bg-white shadow-card"
          aria-label="Per-form breakdown"
        >
          <h2 class="px-5 pt-5 font-semibold text-ink-900 sm:px-6">By form</h2>
          <p v-if="!topForms.length" class="px-5 pb-5 pt-2 text-sm text-ink-400 sm:px-6">
            No forms yet — numbers show up here once you create one.
          </p>
          <div v-else class="mt-3 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-ink-100 text-left text-ink-400">
                  <th class="px-5 py-2 font-medium sm:px-6">Form</th>
                  <th class="px-4 py-2 text-right font-medium">Views</th>
                  <th class="px-4 py-2 text-right font-medium">Responses</th>
                  <th class="px-5 py-2 text-right font-medium sm:px-6">Conversion</th>
                </tr>
              </thead>
              <tbody style="font-variant-numeric: tabular-nums">
                <tr v-for="f in topForms" :key="f.id" class="border-b border-ink-100 last:border-0">
                  <td class="max-w-0 truncate px-5 py-2.5 font-medium text-ink-900 sm:px-6" style="width: 50%">
                    <router-link :to="{ name: 'responses', params: { id: f.id } }" class="hover:text-brand-700">
                      {{ f.title }}
                    </router-link>
                  </td>
                  <td class="px-4 py-2.5 text-right text-ink-600">{{ f.viewCount.toLocaleString() }}</td>
                  <td class="px-4 py-2.5 text-right text-ink-600">{{ f.responseCount.toLocaleString() }}</td>
                  <td class="px-5 py-2.5 text-right text-ink-600 sm:px-6">
                    {{ f.viewCount ? `${Math.round((f.responseCount / f.viewCount) * 100)}%` : "—" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </main>
  </AppShell>
</template>
