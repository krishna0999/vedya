<script setup lang="ts">
// Home dashboard: personalised hero + quick actions, headline stats with
// week-over-week trends, an interactive analytics chart, activity, recent
// forms/responses, and plan usage. The full forms list lives on /forms; this
// page is the at-a-glance overview.
// Topbar (search/bell/avatar) is AppShell's — shared across all pages.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { FORM_TITLE_MAX } from "@schema";
import {
  primeNotifications,
  useNotifications,
} from "@/lib/notifications";
import {
  api,
  type AccountUsage,
  type FormSummary,
  type UsageDay,
} from "@/api/client";
import { useBoard } from "@/lib/board";
import type { IconName } from "@/lib/icons";
import {
  bucketOf,
  rateOver,
  total,
  trendPct,
  trendPoints,
  type Trend,
} from "@/lib/stats";
import { relativeTime } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth";
import AiGenerateModal from "@/components/AiGenerateModal.vue";
import AppShell from "@/components/AppShell.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";
import UiTooltip from "@/components/ui/UiTooltip.vue";
import type { TemplateSummary } from "@/api/client";

const router = useRouter();
const auth = useAuthStore();
// Favourites are the same pins the /forms grid uses — starred forms lead here.
const board = useBoard("forms");

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
    // The bell needs exactly this data — hand it over rather than refetching.
    primeNotifications(forms.value, usage.value, recentResponses.value);
    startCounters();
    if (!forms.value.length) loadSuggestions();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load dashboard.";
  } finally {
    loading.value = false;
  }
});

// --- hero -----------------------------------------------------------------

const firstName = computed(() => {
  const source =
    auth.user?.name?.trim() || (auth.user?.email ?? "").split("@")[0] || "";
  return source.split(/[\s._+-]+/)[0] || "there";
});

const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
});

// One line that reacts to where the account actually is, instead of the same
// static sentence for everyone.
const heroMessage = computed(() => {
  const u = usage.value;
  if (!u) return "Here's what's happening with your forms.";
  if (u.forms === 0) return "Create your first form — it takes about a minute.";
  if (u.published === 0) return "Publish a form to start collecting responses.";
  if (weekResponses.value > 0)
    return `You're on a roll — ${weekResponses.value} new response${
      weekResponses.value === 1 ? "" : "s"
    } this week.`;
  return "Quiet week so far — share a form to get responses flowing.";
});

// --- period maths ---------------------------------------------------------

const timeline = computed<UsageDay[]>(() => usage.value?.timeline ?? []);

const thisWeek = computed(() => timeline.value.slice(-7));
const lastWeek = computed(() => timeline.value.slice(-14, -7));
const weekResponses = computed(() =>
  total(thisWeek.value, (d) => d.submissions),
);
const weekViews = computed(() => total(thisWeek.value, (d) => d.views));

// --- stat cards -----------------------------------------------------------

// Semantic tints: brand = forms, cyan = responses, slate = views,
// green = success/completion.
const TINTS = {
  brand: "bg-brand-50 text-brand-600",
  cyan: "bg-secondary-50 text-secondary-600",
  slate: "bg-ink-100 text-ink-600",
  green: "bg-green-50 text-green-600",
} as const;

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
  icon: IconName;
  tint: keyof typeof TINTS;
  trend: Trend | null;
  /** 0–100 for the completion ring; undefined on the other cards. */
  ring?: number;
  /** Shown instead of the number when the metric has nothing to report yet. */
  empty?: { title: string; body: string };
  /** Tooltip spelling out how the number is derived. */
  explain?: string;
}

const completionRate = computed(() =>
  usage.value?.views
    ? (usage.value.submissions / usage.value.views) * 100
    : null,
);

const stats = computed<Stat[]>(() => {
  const u = usage.value;
  if (!u) return [];
  return [
    {
      label: "Forms",
      value: u.forms,
      hint: `${u.published} published · ${u.forms - u.published} draft`,
      icon: "rectangle-group",
      tint: "brand",
      trend: null,
    },
    {
      label: "Responses",
      value: u.submissions,
      hint: `${weekResponses.value} this week`,
      icon: "paper-airplane",
      tint: "cyan",
      trend: trendPct(
        weekResponses.value,
        total(lastWeek.value, (d) => d.submissions),
      ),
    },
    {
      label: "Views",
      value: u.views,
      hint: `${weekViews.value} this week`,
      icon: "eye",
      tint: "slate",
      trend: trendPct(
        weekViews.value,
        total(lastWeek.value, (d) => d.views),
      ),
    },
    {
      label: "Completion rate",
      value: Math.round(completionRate.value ?? 0),
      suffix: "%",
      hint: "responses ÷ views",
      icon: "chart-bar",
      tint: "green",
      explain: "Responses divided by form views, across every published form.",
      trend: trendPoints(rateOver(thisWeek.value), rateOver(lastWeek.value)),
      ring: Math.round(completionRate.value ?? 0),
      empty:
        completionRate.value === null
          ? {
              title: "No data yet",
              body: "Share your form to start collecting responses.",
            }
          : undefined,
    },
  ];
});

// Counters ease in once, on load. Skipped when the user prefers reduced motion.
const ease = ref(1);
function startCounters(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ease.value = 0;
  const from = performance.now();
  const step = (now: number): void => {
    const p = Math.min(1, (now - from) / 600);
    ease.value = 1 - (1 - p) ** 3; // easeOutCubic
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const counted = (n: number): string =>
  Math.round(n * ease.value).toLocaleString();

// Completion ring geometry (r=20 circle, dash offset from the percentage).
const RING_LEN = 2 * Math.PI * 20;
const ringDash = (pct: number): string =>
  `${(pct / 100) * RING_LEN * ease.value} ${RING_LEN}`;

// --- analytics chart ------------------------------------------------------

const METRICS = [
  { id: "submissions", label: "Responses", color: "#047857" },
  { id: "views", label: "Views", color: "#0e7490" },
  { id: "completion", label: "Completion", color: "#16a34a" },
] as const;
type MetricId = (typeof METRICS)[number]["id"];

const metric = ref<MetricId>("submissions");
const RANGES = [7, 30, 90];
const range = ref(30);
const chartType = ref<"line" | "bar">("line");
const isRate = computed(() => metric.value === "completion");
const color = computed(() => METRICS.find((m) => m.id === metric.value)!.color);

const W = 600;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

const days = computed(() => timeline.value.slice(-range.value));
function valueOf(d: UsageDay): number {
  if (metric.value === "views") return d.views;
  if (metric.value === "completion")
    return d.views ? (d.submissions / d.views) * 100 : 0;
  return d.submissions;
}
const yMax = computed(() => {
  if (isRate.value) return 100;
  const raw = Math.max(1, ...days.value.map(valueOf));
  const step = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].find((m) => m * step >= raw)! * step;
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
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(valueOf(d)).toFixed(1)}`,
    )
    .join(""),
);
const areaPath = computed(() =>
  days.value.length
    ? `${linePath.value}L${x(days.value.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`
    : "",
);
// Bars share the line's x positions; 70% of a slot leaves a gap between them.
const barWidth = computed(() =>
  Math.max(1, ((W - PAD.left - PAD.right) / days.value.length) * 0.7),
);
const xTicks = computed(() => {
  const every = Math.max(1, Math.ceil(days.value.length / 5));
  return days.value
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % every === 0 || i === days.value.length - 1);
});
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
function fmt(v: number): string {
  return isRate.value ? `${Math.round(v)}%` : v.toLocaleString();
}

const hover = ref<number | null>(null);
function onMove(e: MouseEvent): void {
  const svg = e.currentTarget as SVGSVGElement;
  const frac = (e.clientX - svg.getBoundingClientRect().left) / svg.clientWidth;
  const n = Math.max(1, days.value.length - 1);
  const i = Math.round(
    ((frac * W - PAD.left) / (W - PAD.left - PAD.right)) * n,
  );
  hover.value = Math.min(Math.max(i, 0), days.value.length - 1);
}

// --- recent forms ---------------------------------------------------------

// Favourites first (board.arrange), then most recently edited.
const recentForms = computed(() =>
  board
    .arrange(
      [...forms.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      false,
    )
    .slice(0, 5),
);

async function copyLink(form: FormSummary): Promise<void> {
  await navigator.clipboard.writeText(`${window.location.origin}/f/${form.id}`);
  toast("Share link copied to clipboard", "success");
}

// --- continue editing ------------------------------------------------------

// The one form you were last in. Resuming is the most common reason to open
// the dashboard at all, so it gets a dedicated one-click row.
const lastEdited = computed(
  () =>
    [...forms.value].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    )[0] ?? null,
);

// --- unread responses ------------------------------------------------------

// Read state is owned by lib/notifications so this panel and the topbar bell
// can never disagree about what's been seen. Still a per-device high-water
// mark in localStorage, not a server-side read receipt.
const { markAllRead: markResponsesSeen, seenAt } = useNotifications();
const isUnread = (r: RecentResponse): boolean => r.submittedAt > seenAt.value;
const unreadCount = computed(
  () => recentResponses.value.filter(isUnread).length,
);

// --- health summary --------------------------------------------------------

// Plain rules over the numbers we already have — ponytail: no model call, the
// insights worth showing at this size are arithmetic, not inference.
const health = computed(() => {
  const u = usage.value;
  if (!u || !forms.value.length) return null;
  const top = [...forms.value].sort(
    (a, b) => b.responseCount - a.responseCount,
  )[0]!;
  const prev = total(lastWeek.value, (d) => d.submissions);
  const growth = trendPct(weekResponses.value, prev);
  const stalled = forms.value.filter(
    (f) => f.published && f.viewCount >= 10 && f.responseCount === 0,
  );
  const unpublished = forms.value.filter((f) => !f.published).length;

  const suggestions: string[] = [];
  if (stalled.length)
    suggestions.push(
      `${stalled.length} published form${stalled.length === 1 ? " is" : "s are"} getting views but no responses — try shortening ${stalled.length === 1 ? "it" : "them"}.`,
    );
  if ((completionRate.value ?? 100) < 30 && u.views >= 20)
    suggestions.push(
      "Completion is under 30% — fewer required fields usually lifts it fastest.",
    );
  if (unpublished)
    suggestions.push(
      `${unpublished} draft${unpublished === 1 ? "" : "s"} waiting to be published.`,
    );
  if (!suggestions.length)
    suggestions.push("Nothing needs attention — your forms are healthy.");
  return { top, growth, suggestions: suggestions.slice(0, 2) };
});

// --- activity -------------------------------------------------------------

// Derived from what we already have (edits + responses) — ponytail: becomes a
// real event log when post-submission actions (§9) land.
const ACTIVITY_FILTERS = [
  { id: "all", label: "All" },
  { id: "responses", label: "Responses" },
  { id: "edits", label: "Edits" },
] as const;
const activityFilter = ref<"all" | "responses" | "edits">("all");

const activityGroups = computed(() => {
  const mode = activityFilter.value;
  const events = [
    ...recentResponses.value.map((r) => ({
      key: `sub-${r.id}`,
      kind: "responses" as const,
      icon: "paper-airplane" as IconName,
      tint: "cyan" as keyof typeof TINTS,
      text: `New response on “${r.formTitle}”`,
      at: r.submittedAt,
      to: { name: "responses", params: { id: r.formId } },
    })),
    ...forms.value.map((f) => ({
      key: `edit-${f.id}`,
      kind: "edits" as const,
      icon: (f.published ? "check" : "pencil-square") as IconName,
      tint: (f.published ? "green" : "brand") as keyof typeof TINTS,
      text: `${f.published ? "Published" : "Edited"} “${f.title}”`,
      at: f.updatedAt,
      to: { name: "builder", params: { id: f.id } },
    })),
  ]
    .filter((e) => mode === "all" || e.kind === mode)
    .sort((a, b) => b.at.localeCompare(a.at));

  const labels = { today: "Today", yesterday: "Yesterday", earlier: "Earlier" };
  return (["today", "yesterday", "earlier"] as const)
    .map((key) => ({
      key,
      label: labels[key],
      items: events.filter((e) => bucketOf(e.at) === key).slice(0, 5),
    }))
    .filter((g) => g.items.length);
});

// --- quick actions --------------------------------------------------------

const creating = ref(false);
const aiOpen = ref(false);

async function createForm(): Promise<void> {
  creating.value = true;
  try {
    const draft = await api.createForm();
    router.push({ name: "builder", params: { id: draft.id } });
  } catch (err) {
    toast(
      err instanceof Error ? err.message : "Failed to create form.",
      "error",
    );
    creating.value = false;
  }
}

// Duplicate + import both compose the existing endpoints (read → create →
// patch) — ponytail: no new API surface until one of them needs to be atomic.
async function duplicate(form: FormSummary): Promise<void> {
  creating.value = true;
  try {
    const src = await api.getForm(form.id);
    // Trim the base so " (copy)" can't push the name past the title limit —
    // the copy would be created, then fail its first autosave.
    const copy = await api.createForm(
      `${src.title.slice(0, FORM_TITLE_MAX - " (copy)".length)} (copy)`,
    );
    await api.updateForm(copy.id, {
      fields: src.fields,
      theme: src.theme,
      category: src.category,
    });
    router.push({ name: "builder", params: { id: copy.id } });
  } catch (err) {
    toast(err instanceof Error ? err.message : "Failed to duplicate.", "error");
    creating.value = false;
  }
}

const fileInput = ref<HTMLInputElement | null>(null);
async function onImport(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // let the same file be picked again after an error
  if (!file) return;
  creating.value = true;
  try {
    const json = JSON.parse(await file.text());
    // Accepts a form straight out of the account export, or a bare draft.
    const src = json.currentDraft ?? json;
    if (!Array.isArray(src.fields))
      throw new Error("That file doesn't contain a form.");
    const draft = await api.createForm(
      src.title ?? json.title ?? "Imported form",
    );
    // The server re-validates the fields/theme — a hand-edited file can't get
    // a malformed schema past it.
    await api.updateForm(draft.id, {
      fields: src.fields,
      theme: src.theme,
      category: src.category,
    });
    router.push({ name: "builder", params: { id: draft.id } });
  } catch (err) {
    toast(
      err instanceof Error ? err.message : "Failed to import form.",
      "error",
    );
    creating.value = false;
  }
}

// The duplicate tile needs a form to copy — same outside-mousedown + Escape
// close idiom as UiActionMenu.
const dupOpen = ref(false);
const dupRoot = ref<HTMLElement | null>(null);
function onDupPointer(e: MouseEvent): void {
  if (dupRoot.value && !dupRoot.value.contains(e.target as Node)) closeDup();
}
function closeDup(): void {
  if (!dupOpen.value) return;
  dupOpen.value = false;
  document.removeEventListener("mousedown", onDupPointer);
}
function toggleDup(): void {
  if (dupOpen.value) return closeDup();
  dupOpen.value = true;
  document.addEventListener("mousedown", onDupPointer);
}

type QuickActionId = "blank" | "ai" | "templates" | "import" | "duplicate";
// `key` is both the hint shown on the tile and the shortcut that fires it —
// one source of truth, so the hint can't drift from the binding.
const QUICK_ACTIONS: Array<{
  id: QuickActionId;
  label: string;
  icon: IconName;
  key: string;
}> = [
  { id: "blank", label: "Create form", icon: "plus", key: "C" },
  { id: "ai", label: "Generate with AI", icon: "sparkles", key: "G" },
  { id: "templates", label: "Browse templates", icon: "squares-2x2", key: "T" },
  { id: "import", label: "Import form", icon: "arrow-up-tray", key: "I" },
  {
    id: "duplicate",
    label: "Duplicate a form",
    icon: "document-duplicate",
    key: "D",
  },
];

function onQuickAction(id: QuickActionId): void {
  if (id === "blank") createForm();
  else if (id === "ai") aiOpen.value = true;
  else if (id === "templates")
    router.push({ name: "forms", query: { view: "templates" } });
  else if (id === "import") fileInput.value?.click();
  else toggleDup();
}

// Single-key shortcuts, ignored while typing or when a modifier is held (⌘K
// belongs to the shell's search).
function onDashboardKey(e: KeyboardEvent): void {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const el = e.target as HTMLElement | null;
  if (
    el &&
    (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
  )
    return;
  const hit = QUICK_ACTIONS.find(
    (a) => a.key.toLowerCase() === e.key.toLowerCase(),
  );
  if (!hit) return;
  e.preventDefault();
  onQuickAction(hit.id);
}
onMounted(() => document.addEventListener("keydown", onDashboardKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onDashboardKey));

// --- plan usage -----------------------------------------------------------

const quotas = computed(() => {
  const u = usage.value;
  if (!u) return [];
  const rows = [
    {
      label: "Responses this month",
      used: u.monthSubmissions,
      cap: u.limits.responsesPerMonth,
    },
    {
      label: "AI generations this month",
      used: u.monthAiGenerations,
      cap: u.limits.aiGenerationsPerMonth,
    },
  ];
  return rows.map((r) => ({
    ...r,
    pct: r.cap ? Math.min(100, Math.round((r.used / r.cap) * 100)) : null,
    left: r.cap === null ? null : Math.max(0, r.cap - r.used),
  }));
});

// Nudge to upgrade only once a quota is actually tight — a permanent upsell
// banner is noise.
const nearLimit = computed(() =>
  quotas.value.some((q) => q.pct !== null && q.pct >= 80),
);

// --- tips + announcement ---------------------------------------------------

const TIPS: Array<{ text: string; icon: IconName; to: string }> = [
  {
    text: "Start from a template — then change everything.",
    icon: "squares-2x2",
    to: "templates",
  },
  {
    text: "Star a form to pin it to the top of your list.",
    icon: "star-outline",
    to: "forms",
  },
  {
    text: "Export responses as CSV from any form's responses page.",
    icon: "arrow-down-tray",
    to: "forms",
  },
  {
    text: "Press C anywhere on this page to start a new form.",
    icon: "sparkles",
    to: "forms",
  },
];

// One tip at a time, rotating. Auto-rotation is motion too, so reduced-motion
// users get a static tip they can still step through by hand.
const tipIndex = ref(0);
const tip = computed(() => TIPS[tipIndex.value % TIPS.length]!);
function nextTip(): void {
  tipIndex.value = (tipIndex.value + 1) % TIPS.length;
}
let tipTimer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    tipTimer = setInterval(nextTip, 9000);
});
onBeforeUnmount(() => clearInterval(tipTimer));

// Dismissals are remembered by id, so changing the copy re-shows the card.
const DISMISS_KEY = "vedya.dismissed";
const dismissed = ref<string[]>(readDismissed());
function readDismissed(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function dismiss(id: string): void {
  dismissed.value = [...dismissed.value, id];
  localStorage.setItem(DISMISS_KEY, JSON.stringify(dismissed.value));
}
const isDismissed = (id: string): boolean => dismissed.value.includes(id);

// ponytail: a constant, not a feed. Edit it here when there's something to say;
// wire it to an endpoint only once someone other than us needs to publish it.
const ANNOUNCEMENT = {
  id: "2026-07-drag-pin",
  title: "New: drag to reorder and pin your favourites",
  body: "Rearrange the forms and templates grids, and star the ones you use most.",
} as const;

// --- analytics export ------------------------------------------------------

// The chart's own data, as CSV. ponytail: built client-side from the timeline
// we already loaded — no endpoint, no second source of truth.
function exportChart(): void {
  const rows = [
    ["date", "views", "responses", "completion_rate"],
    ...days.value.map((d) => [
      d.day,
      String(d.views),
      String(d.submissions),
      d.views ? ((d.submissions / d.views) * 100).toFixed(1) : "",
    ]),
  ];
  const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-last-${range.value}-days.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Analytics exported as CSV", "success");
}

// --- template suggestions (empty state) ------------------------------------

// Only fetched when there's nothing to show — an empty dashboard is the one
// place a starting point beats a blank slate.
const suggestedTemplates = ref<TemplateSummary[]>([]);
async function loadSuggestions(): Promise<void> {
  try {
    const catalog = await api.listTemplates();
    suggestedTemplates.value = catalog.templates.slice(0, 3);
  } catch {
    // A missing suggestion strip is not worth an error banner.
  }
}
async function useTemplate(templateId: string): Promise<void> {
  creating.value = true;
  try {
    const draft = await api.createFromTemplate(templateId);
    router.push({ name: "builder", params: { id: draft.id } });
  } catch (err) {
    toast(
      err instanceof Error ? err.message : "Failed to create from template.",
      "error",
    );
    creating.value = false;
  }
}
</script>

<template>
  <AppShell>
    <!-- Full-width content — px-6 side padding only, no centered max-w column.
         Bands are separated by space-y-6; the top padding is deliberately
         tighter than the gaps so the hero starts near the header. -->
    <main class="w-full space-y-6 px-6 pb-28 pt-6 md:pb-8">
      <p
        v-if="error"
        class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>

      <!-- Announcement — dismissible, remembered by id -->
      <div
        v-if="!isDismissed(ANNOUNCEMENT.id)"
        class="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3"
      >
        <span
          class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand-600"
          aria-hidden="true"
        >
          <UiIcon name="sparkles" class="text-inherit h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink-900">
            {{ ANNOUNCEMENT.title }}
          </p>
          <p class="mt-0.5 text-sm text-ink-600">{{ ANNOUNCEMENT.body }}</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-ink-500 transition hover:bg-white hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          aria-label="Dismiss announcement"
          @click="dismiss(ANNOUNCEMENT.id)"
        >
          <UiIcon name="x-mark" class="text-inherit h-4 w-4" />
        </button>
      </div>

      <!-- Hero: greeting, live highlights, quick actions -->
      <section>
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-2xl font-semibold tracking-tight text-ink-900">
              {{ greeting }}, {{ firstName }} 👋
            </h1>
            <UiSkeleton v-if="loading" class="mt-2 h-4 w-72" />
            <p v-else class="mt-1 text-sm text-ink-500">{{ heroMessage }}</p>
            <div
              v-if="!loading && usage"
              class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-600"
            >
              <span
                ><span class="font-semibold text-ink-900">{{
                  usage.published
                }}</span>
                published</span
              >
              <span class="text-ink-300">·</span>
              <span
                ><span class="font-semibold text-ink-900">{{
                  usage.submissions.toLocaleString()
                }}</span>
                responses</span
              >
              <span class="text-ink-300">·</span>
              <span
                ><span class="font-semibold text-ink-900">{{
                  weekResponses
                }}</span>
                this week</span
              >
            </div>
          </div>

          <!-- Continue editing: the single most likely next action -->
          <router-link
            v-if="!loading && lastEdited"
            :to="{ name: 'builder', params: { id: lastEdited.id } }"
            class="group flex min-w-0 max-w-xs items-center gap-3 rounded-xl border border-line-200 bg-white px-3.5 py-2.5 shadow-card transition duration-150 ease-soft hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
          >
            <span
              class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"
              aria-hidden="true"
            >
              <UiIcon name="pencil-square" class="text-inherit h-5 w-5" />
            </span>
            <span class="min-w-0">
              <span class="block text-xs font-medium text-ink-500"
                >Continue editing</span
              >
              <span
                class="block truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700"
                >{{ lastEdited.title }}</span
              >
            </span>
            <UiIcon
              name="chevron-right"
              class="h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
            />
          </router-link>
        </div>

        <!-- Quick actions panel -->
        <div
          class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
          role="group"
          aria-label="Quick actions"
        >
          <div
            v-for="a in QUICK_ACTIONS"
            :key="a.id"
            :ref="
              a.id === 'duplicate'
                ? (el) => (dupRoot = el as HTMLElement)
                : undefined
            "
            class="relative"
            @keydown.escape="closeDup"
          >
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-xl border border-line-200 bg-white px-3.5 py-3 text-left text-sm font-medium text-ink-800 shadow-card transition duration-150 ease-soft hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
              :disabled="creating"
              :aria-haspopup="a.id === 'duplicate' ? 'menu' : undefined"
              :aria-expanded="a.id === 'duplicate' ? dupOpen : undefined"
              @click="onQuickAction(a.id)"
            >
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"
                aria-hidden="true"
              >
                <UiIcon :name="a.icon" class="text-inherit h-5 w-5" />
              </span>
              <span class="min-w-0 flex-1 truncate">{{ a.label }}</span>
              <kbd
                class="hidden shrink-0 rounded border border-line-200 bg-ink-50 px-1.5 py-0.5 font-sans text-xs font-medium text-ink-500 lg:inline"
                aria-hidden="true"
                >{{ a.key }}</kbd
              >
            </button>

            <!-- Pick which form to duplicate -->
            <transition
              enter-active-class="transition duration-150 ease-soft"
              enter-from-class="opacity-0 -translate-y-1"
              leave-active-class="transition duration-100 ease-soft"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-if="a.id === 'duplicate' && dupOpen"
                role="menu"
                class="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-xl border border-line-200 bg-white p-1 shadow-pop"
              >
                <p v-if="!forms.length" class="px-3 py-2 text-sm text-ink-500">
                  No forms to duplicate yet.
                </p>
                <button
                  v-for="f in forms.slice(0, 8)"
                  :key="f.id"
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                  @click="
                    closeDup();
                    duplicate(f);
                  "
                >
                  <UiIcon
                    name="document-duplicate"
                    class="h-5 w-5 shrink-0 text-ink-500"
                  />
                  <span class="min-w-0 truncate">{{ f.title }}</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="onImport"
        />
      </section>

      <!-- Stats -->
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <template v-if="loading">
          <div
            v-for="n in 4"
            :key="n"
            class="rounded-xl border border-line-200 bg-white p-4"
          >
            <div class="flex items-center gap-2.5">
              <UiSkeleton class="h-9 w-9 rounded-lg" />
              <UiSkeleton class="h-3.5 w-24" />
            </div>
            <UiSkeleton class="mt-4 h-8 w-20" />
            <UiSkeleton class="mt-2 h-3.5 w-28" />
          </div>
        </template>
        <div
          v-for="s in stats"
          v-else
          :key="s.label"
          class="rounded-xl border border-line-200 bg-white p-4 shadow-card transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-line-300 hover:shadow-pop"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span
                class="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                :class="TINTS[s.tint]"
                aria-hidden="true"
              >
                <UiIcon :name="s.icon" class="text-inherit h-5 w-5" />
              </span>
              <dt
                class="flex items-center gap-1 text-sm font-medium text-ink-500"
              >
                {{ s.label }}
                <UiTooltip v-if="s.explain" :text="s.explain">
                  <p
                    class="h-4 w-4 cursor-help flex items-center justify-center rounded-full border border-line-300 text-[10px] font-semibold text-ink-500"
                    tabindex="0"
                    role="note"
                    :aria-label="s.explain"
                  >
                    ?
                  </p>
                </UiTooltip>
              </dt>
            </div>
            <span
              v-if="s.trend"
              class="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium"
              :class="
                s.trend.dir === 'up'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              "
              title="vs. the previous 7 days"
            >
              <UiIcon
                :name="
                  s.trend.dir === 'up'
                    ? 'arrow-trending-up'
                    : 'arrow-trending-down'
                "
                class="text-inherit h-4 w-4"
              />
              {{ s.trend.label }}
            </span>
          </div>

          <!-- Nothing to report yet: say so plainly instead of showing a dash -->
          <template v-if="s.empty">
            <dd class="mt-3 text-base font-semibold text-ink-700">
              {{ s.empty.title }}
            </dd>
            <p class="mt-0.5 text-sm text-ink-500">{{ s.empty.body }}</p>
          </template>
          <div v-else class="mt-3 flex items-end justify-between gap-3">
            <div>
              <dd
                class="text-3xl font-semibold leading-none text-ink-900"
                style="font-variant-numeric: tabular-nums"
              >
                {{ counted(s.value) }}{{ s.suffix ?? "" }}
              </dd>
              <p class="mt-1.5 text-sm text-ink-500">{{ s.hint }}</p>
            </div>
            <!-- Completion ring — only once there's data behind it -->
            <svg
              v-if="s.ring !== undefined"
              viewBox="0 0 48 48"
              class="h-12 w-12 shrink-0 -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#e2e8f0"
                stroke-width="5"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="#16a34a"
                stroke-width="5"
                stroke-linecap="round"
                :stroke-dasharray="ringDash(s.ring)"
              />
            </svg>
          </div>
        </div>
      </dl>

      <!-- Row 1: analytics (8) | activity (4) -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          class="rounded-xl border border-line-200 bg-white p-5 shadow-card lg:col-span-8"
          aria-label="Analytics"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold text-ink-900">Analytics</h2>
              <p class="text-sm text-ink-500">
                {{ METRICS.find((m) => m.id === metric)!.label }}, last
                {{ range }} days
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <!-- metric -->
              <div
                class="flex rounded-lg bg-ink-100 p-0.5"
                role="group"
                aria-label="Metric"
              >
                <button
                  v-for="m in METRICS"
                  :key="m.id"
                  type="button"
                  class="rounded-md px-2.5 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  :class="
                    metric === m.id
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-800'
                  "
                  :aria-pressed="metric === m.id"
                  @click="metric = m.id"
                >
                  {{ m.label }}
                </button>
              </div>
              <!-- range -->
              <div
                class="flex rounded-lg bg-ink-100 p-0.5"
                role="group"
                aria-label="Date range"
              >
                <button
                  v-for="r in RANGES"
                  :key="r"
                  type="button"
                  class="rounded-md px-2.5 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  :class="
                    range === r
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-800'
                  "
                  :aria-pressed="range === r"
                  @click="range = r"
                >
                  {{ r }}d
                </button>
              </div>
              <UiTooltip text="Download this range as CSV">
                <button
                  type="button"
                  class="grid h-7 w-7 place-items-center rounded-md text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  aria-label="Export analytics as CSV"
                  @click="exportChart"
                >
                  <UiIcon name="arrow-down-tray" class="text-inherit h-4 w-4" />
                </button>
              </UiTooltip>
              <!-- chart type -->
              <div
                class="flex rounded-lg bg-ink-100 p-0.5"
                role="group"
                aria-label="Chart type"
              >
                <button
                  v-for="t in ['line', 'bar'] as const"
                  :key="t"
                  type="button"
                  class="grid h-7 w-7 place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  :class="
                    chartType === t
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-ink-500 hover:text-ink-800'
                  "
                  :aria-pressed="chartType === t"
                  :aria-label="t === 'line' ? 'Line chart' : 'Bar chart'"
                  @click="chartType = t"
                >
                  <UiIcon
                    :name="t === 'line' ? 'chart-line' : 'chart-bar'"
                    class="text-inherit h-4 w-4"
                  />
                </button>
              </div>
            </div>
          </div>

          <UiSkeleton v-if="loading" class="mt-4 h-56 w-full rounded-lg" />

          <!-- Empty state: nothing published means nothing to measure -->
          <div
            v-else-if="!usage?.published"
            class="mt-4 flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-line-200 bg-ink-50/60 px-6 text-center"
          >
            <span
              class="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink-400 shadow-card"
              aria-hidden="true"
            >
              <UiIcon name="chart-bar" class="text-inherit h-5 w-5" />
            </span>
            <p class="mt-3 font-medium text-ink-800">No analytics yet</p>
            <p class="mt-1 max-w-xs text-sm text-ink-500">
              Publish a form and its views and responses will show up here.
            </p>
            <UiButton
              variant="secondary"
              size="sm"
              class="mt-4"
              @click="router.push({ name: 'forms' })"
            >
              Publish a form
            </UiButton>
          </div>

          <div v-else class="relative mt-4">
            <svg
              :viewBox="`0 0 ${W} ${H}`"
              class="w-full"
              role="img"
              :aria-label="`${METRICS.find((m) => m.id === metric)!.label} per day over the last ${range} days`"
              @mousemove="onMove"
              @mouseleave="hover = null"
            >
              <g v-for="t in yTicks" :key="t">
                <line
                  :x1="PAD.left"
                  :x2="W - PAD.right"
                  :y1="y(t)"
                  :y2="y(t)"
                  stroke="#e2e8f0"
                  stroke-width="1"
                />
                <text
                  :x="PAD.left - 8"
                  :y="y(t) + 3"
                  text-anchor="end"
                  class="fill-ink-400"
                  style="font-size: 10px; font-variant-numeric: tabular-nums"
                >
                  {{ fmt(t) }}
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

              <!-- Series fades between metric / range / type changes -->
              <transition
                enter-active-class="transition-opacity duration-300 ease-soft"
                enter-from-class="opacity-0"
                leave-active-class="transition-opacity duration-200 ease-soft"
                leave-to-class="opacity-0"
              >
                <g :key="`${metric}-${range}-${chartType}`">
                  <template v-if="chartType === 'line'">
                    <path
                      :d="areaPath"
                      :fill="color"
                      opacity="0.08"
                      class="chart-area"
                    />
                    <path
                      :d="linePath"
                      fill="none"
                      :stroke="color"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="chart-line"
                    />
                  </template>
                  <rect
                    v-for="(d, i) in days"
                    v-else
                    :key="d.day"
                    :x="x(i) - barWidth / 2"
                    :y="y(valueOf(d))"
                    :width="barWidth"
                    :height="Math.max(0, y(0) - y(valueOf(d)))"
                    :fill="color"
                    rx="1.5"
                    class="chart-bar"
                    :opacity="hover === null || hover === i ? 0.9 : 0.45"
                  />
                </g>
              </transition>

              <template v-if="hover !== null && days[hover]">
                <line
                  :x1="x(hover)"
                  :x2="x(hover)"
                  :y1="PAD.top"
                  :y2="H - PAD.bottom"
                  stroke="#94a3b8"
                  stroke-width="1"
                />
                <circle
                  v-if="chartType === 'line'"
                  :cx="x(hover)"
                  :cy="y(valueOf(days[hover]!))"
                  r="4"
                  :fill="color"
                  stroke="#ffffff"
                  stroke-width="2"
                />
              </template>
            </svg>
            <div
              v-if="hover !== null && days[hover]"
              class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line-200 bg-white px-3 py-2 shadow-pop"
              :style="{ left: `${(x(hover) / W) * 100}%` }"
            >
              <p class="whitespace-nowrap text-sm font-medium text-ink-900">
                {{ shortDate(days[hover]!.day) }}
              </p>
              <p class="whitespace-nowrap text-sm text-ink-600">
                {{ METRICS.find((m) => m.id === metric)!.label }}:
                <span style="font-variant-numeric: tabular-nums">{{
                  fmt(valueOf(days[hover]!))
                }}</span>
              </p>
              <p
                v-if="metric === 'completion'"
                class="whitespace-nowrap text-sm text-ink-500"
              >
                {{ days[hover]!.submissions }} of {{ days[hover]!.views }} views
              </p>
            </div>
          </div>
        </section>

        <!-- Activity -->
        <section
          class="rounded-xl border border-line-200 bg-white p-5 shadow-card lg:col-span-4"
          aria-label="Recent activity"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-semibold text-ink-900">Activity</h2>
            <div
              class="flex rounded-lg bg-ink-100 p-0.5"
              role="group"
              aria-label="Filter activity"
            >
              <button
                v-for="af in ACTIVITY_FILTERS"
                :key="af.id"
                type="button"
                class="rounded-md px-2 py-0.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                :class="
                  activityFilter === af.id
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-ink-500 hover:text-ink-800'
                "
                :aria-pressed="activityFilter === af.id"
                @click="activityFilter = af.id"
              >
                {{ af.label }}
              </button>
            </div>
          </div>
          <div v-if="loading" class="mt-4 space-y-4">
            <div v-for="n in 4" :key="n" class="flex items-center gap-3">
              <UiSkeleton class="h-8 w-8 shrink-0 rounded-lg" />
              <div class="flex-1 space-y-1.5">
                <UiSkeleton class="h-3.5 w-2/3" />
                <UiSkeleton class="h-3 w-1/4" />
              </div>
            </div>
          </div>
          <p
            v-else-if="!activityGroups.length"
            class="mt-3 text-sm text-ink-500"
          >
            Nothing yet — activity shows up as you build and collect.
          </p>
          <div v-else class="mt-2 space-y-4">
            <div v-for="g in activityGroups" :key="g.key">
              <p
                class="text-xs font-semibold uppercase tracking-wide text-ink-400"
              >
                {{ g.label }}
              </p>
              <ul class="mt-1 divide-y divide-line-100">
                <li v-for="ev in g.items" :key="ev.key">
                  <router-link
                    :to="ev.to"
                    class="group flex items-center gap-3 py-2.5"
                  >
                    <span
                      class="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      :class="TINTS[ev.tint]"
                      aria-hidden="true"
                    >
                      <UiIcon :name="ev.icon" class="text-inherit h-4 w-4" />
                    </span>
                    <p
                      class="min-w-0 flex-1 truncate text-sm text-ink-700 group-hover:text-brand-700"
                    >
                      {{ ev.text }}
                    </p>
                    <span class="shrink-0 text-sm text-ink-500">{{
                      relativeTime(ev.at)
                    }}</span>
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <!-- Row 2: recent forms (7) | recent responses (5) -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          class="rounded-xl border border-line-200 bg-white p-5 shadow-card lg:col-span-7"
          aria-label="Recent forms"
        >
          <div class="flex items-baseline justify-between">
            <h2 class="font-semibold text-ink-900">Recent forms</h2>
            <router-link
              :to="{ name: 'forms' }"
              class="text-sm font-medium text-brand-700 hover:underline"
            >
              View all
            </router-link>
          </div>

          <div v-if="loading" class="mt-4 space-y-4">
            <div v-for="n in 4" :key="n" class="flex items-center gap-3">
              <div class="flex-1 space-y-1.5">
                <UiSkeleton class="h-3.5 w-2/5" />
                <UiSkeleton class="h-3 w-1/4" />
              </div>
              <UiSkeleton class="h-5 w-20 rounded-full" />
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!recentForms.length"
            class="mt-4 flex flex-col items-center rounded-lg border border-dashed border-line-200 bg-ink-50/60 px-6 py-10 text-center"
          >
            <span
              class="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink-400 shadow-card"
              aria-hidden="true"
            >
              <UiIcon name="rectangle-group" class="text-inherit h-5 w-5" />
            </span>
            <p class="mt-3 font-medium text-ink-800">No forms yet</p>
            <p class="mt-1 max-w-xs text-sm text-ink-500">
              Create your first form, add a few questions, and publish to share
              a link.
            </p>
            <UiButton
              size="sm"
              class="mt-4"
              :disabled="creating"
              @click="createForm"
            >
              Create form
            </UiButton>

            <!-- Starting points beat a blank slate on an empty account -->
            <div v-if="suggestedTemplates.length" class="mt-5 w-full">
              <p
                class="text-xs font-semibold uppercase tracking-wide text-ink-400"
              >
                Or start from a template
              </p>
              <div class="mt-2 flex flex-wrap justify-center gap-2">
                <button
                  v-for="t in suggestedTemplates"
                  :key="t.id"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full border border-line-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-55"
                  :disabled="creating"
                  @click="useTemplate(t.id)"
                >
                  <span aria-hidden="true">{{ t.icon }}</span>
                  {{ t.title }}
                </button>
              </div>
            </div>
          </div>

          <ul v-else class="mt-2 divide-y divide-line-100">
            <li
              v-for="f in recentForms"
              :key="f.id"
              class="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-ink-50"
            >
              <router-link
                :to="{ name: 'builder', params: { id: f.id } }"
                class="min-w-0 flex-1"
              >
                <p class="flex items-center gap-1.5 truncate">
                  <UiIcon
                    v-if="board.isPinned(f.id)"
                    name="star"
                    type="solid"
                    class="h-4 w-4 shrink-0 text-amber-500"
                  />
                  <span
                    class="truncate text-sm font-medium text-ink-900 group-hover:text-brand-700"
                    >{{ f.title }}</span
                  >
                </p>
                <p class="mt-0.5 text-sm text-ink-500">
                  {{ f.responseCount }} response{{
                    f.responseCount === 1 ? "" : "s"
                  }}
                  · edited {{ relativeTime(f.updatedAt) }}
                </p>
              </router-link>

              <!-- Row actions, revealed on hover (always shown on touch) -->
              <div
                class="flex shrink-0 items-center gap-0.5 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <UiTooltip text="Edit">
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    aria-label="Edit form"
                    @click="
                      router.push({ name: 'builder', params: { id: f.id } })
                    "
                  >
                    <UiIcon name="pencil-square" class="text-inherit h-5 w-5" />
                  </button>
                </UiTooltip>
                <UiTooltip
                  :text="
                    f.published ? 'Copy link' : 'Publish the form to get a link'
                  "
                >
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Copy share link"
                    :disabled="!f.published"
                    @click="copyLink(f)"
                  >
                    <UiIcon
                      name="document-duplicate"
                      class="text-inherit h-5 w-5"
                    />
                  </button>
                </UiTooltip>
                <UiTooltip text="Analytics">
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    aria-label="View responses"
                    @click="
                      router.push({ name: 'responses', params: { id: f.id } })
                    "
                  >
                    <UiIcon name="chart-bar" class="text-inherit h-5 w-5" />
                  </button>
                </UiTooltip>
                <UiTooltip text="Duplicate">
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    aria-label="Duplicate form"
                    :disabled="creating"
                    @click="duplicate(f)"
                  >
                    <UiIcon name="arrow-path" class="text-inherit h-5 w-5" />
                  </button>
                </UiTooltip>
              </div>

              <UiBadge
                :variant="f.published ? 'green' : 'amber'"
                dot
                class="shrink-0"
              >
                {{ f.published ? "Published" : "Draft" }}
              </UiBadge>
            </li>
          </ul>
        </section>

        <!-- Recent responses -->
        <section
          class="rounded-xl border border-line-200 bg-white p-5 shadow-card lg:col-span-5"
          aria-label="Recent responses"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="flex items-center gap-2 font-semibold text-ink-900">
              Recent responses
              <UiBadge v-if="unreadCount" variant="brand"
                >{{ unreadCount }} new</UiBadge
              >
            </h2>
            <button
              v-if="unreadCount"
              type="button"
              class="rounded-md px-1.5 py-0.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              @click="markResponsesSeen"
            >
              Mark all read
            </button>
          </div>

          <div v-if="loading" class="mt-4 space-y-4">
            <div v-for="n in 4" :key="n" class="flex items-center gap-3">
              <UiSkeleton class="h-8 w-8 shrink-0 rounded-lg" />
              <div class="flex-1 space-y-1.5">
                <UiSkeleton class="h-3.5 w-2/5" />
                <UiSkeleton class="h-3 w-1/4" />
              </div>
            </div>
          </div>

          <div
            v-else-if="!recentResponses.length"
            class="mt-4 flex flex-col items-center rounded-lg border border-dashed border-line-200 bg-ink-50/60 px-6 py-10 text-center"
          >
            <span
              class="grid h-11 w-11 place-items-center rounded-xl bg-white text-ink-400 shadow-card"
              aria-hidden="true"
            >
              <UiIcon name="paper-airplane" class="text-inherit h-5 w-5" />
            </span>
            <p class="mt-3 font-medium text-ink-800">No responses yet</p>
            <p class="mt-1 max-w-xs text-sm text-ink-500">
              Share a published form and answers will land here.
            </p>
            <UiButton
              variant="secondary"
              size="sm"
              class="mt-4"
              @click="router.push({ name: 'forms' })"
            >
              Share a form
            </UiButton>
          </div>

          <ul v-else class="mt-2 divide-y divide-line-100">
            <li v-for="r in recentResponses" :key="r.id">
              <router-link
                :to="{ name: 'responses', params: { id: r.formId } }"
                class="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-ink-50"
                @click="markResponsesSeen"
              >
                <span
                  class="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary-50 text-secondary-600"
                  aria-hidden="true"
                >
                  <UiIcon name="paper-airplane" class="text-inherit h-4 w-4" />
                  <!-- Unread dot: arrived after you last looked -->
                  <span
                    v-if="isUnread(r)"
                    class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-secondary-600"
                  />
                </span>
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm text-ink-900 group-hover:text-brand-700"
                    :class="isUnread(r) ? 'font-semibold' : 'font-medium'"
                  >
                    {{ r.formTitle }}
                    <span v-if="isUnread(r)" class="sr-only">(unread)</span>
                  </p>
                  <p class="text-sm text-ink-500">
                    {{ relativeTime(r.submittedAt) }}
                  </p>
                </div>
                <!-- Quick open: straight to this form's responses table -->
                <UiIcon
                  name="chevron-right"
                  class="h-4 w-4 shrink-0 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                />
              </router-link>
            </li>
          </ul>
        </section>
      </div>

      <!-- Row 3: plan usage | tips -->
      <div v-if="!loading && usage" class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          class="rounded-xl border border-line-200 bg-white p-5 shadow-card lg:col-span-7"
          aria-label="Plan usage"
        >
          <div class="flex items-baseline justify-between">
            <h2 class="font-semibold text-ink-900">Usage this month</h2>
            <UiBadge variant="brand" class="capitalize">{{
              usage.plan
            }}</UiBadge>
          </div>
          <div class="mt-4 space-y-4">
            <div v-for="q in quotas" :key="q.label">
              <div class="flex items-baseline justify-between text-sm">
                <span class="text-ink-600">{{ q.label }}</span>
                <span
                  class="font-medium text-ink-900"
                  style="font-variant-numeric: tabular-nums"
                >
                  {{ q.used.toLocaleString()
                  }}<span class="text-ink-500">
                    /
                    {{ q.cap === null ? "unlimited" : q.cap.toLocaleString() }}
                  </span>
                </span>
              </div>
              <p v-if="q.left !== null" class="mt-0.5 text-sm text-ink-500">
                {{ q.left.toLocaleString() }} left this month
              </p>
              <div
                v-if="q.pct !== null"
                class="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100"
              >
                <div
                  class="h-full rounded-full transition-[width] duration-500 ease-soft"
                  :class="
                    q.pct >= 90
                      ? 'bg-danger'
                      : q.pct >= 70
                        ? 'bg-warn'
                        : 'bg-brand-500'
                  "
                  :style="{ width: `${q.pct}%` }"
                />
              </div>
            </div>
          </div>
          <!-- Upgrade prompt only when a quota is actually tight -->
          <div
            v-if="nearLimit"
            class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
          >
            <p class="text-sm text-amber-800">
              You're close to a monthly limit — upgrade to keep collecting.
            </p>
            <UiButton size="sm" @click="router.push({ name: 'settings' })">
              Upgrade
            </UiButton>
          </div>
          <router-link
            :to="{ name: 'settings' }"
            class="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Manage plan
          </router-link>
        </section>

        <section
          v-if="!isDismissed('tips')"
          class="flex flex-col rounded-xl border border-line-200 bg-white p-5 shadow-card lg:col-span-5"
          aria-label="Tips"
        >
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold text-ink-900">Tips</h2>
            <div class="flex items-center gap-0.5">
              <UiTooltip text="Next tip">
                <button
                  type="button"
                  class="grid h-7 w-7 place-items-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  aria-label="Show next tip"
                  @click="nextTip"
                >
                  <UiIcon name="arrow-path" class="text-inherit h-4 w-4" />
                </button>
              </UiTooltip>
              <UiTooltip text="Hide tips">
                <button
                  type="button"
                  class="grid h-7 w-7 place-items-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                  aria-label="Dismiss tips"
                  @click="dismiss('tips')"
                >
                  <UiIcon name="x-mark" class="text-inherit h-4 w-4" />
                </button>
              </UiTooltip>
            </div>
          </div>

          <!-- One tip at a time, cross-faded as it rotates -->
          <transition
            mode="out-in"
            enter-active-class="transition-opacity duration-200 ease-soft"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150 ease-soft"
            leave-to-class="opacity-0"
          >
            <router-link
              :key="tip.text"
              :to="
                tip.to === 'templates'
                  ? { name: 'forms', query: { view: 'templates' } }
                  : { name: 'forms' }
              "
              class="group mt-3 flex items-start gap-3"
            >
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500"
                aria-hidden="true"
              >
                <UiIcon :name="tip.icon" class="text-inherit h-4 w-4" />
              </span>
              <span class="text-sm text-ink-700 group-hover:text-brand-700">{{
                tip.text
              }}</span>
            </router-link>
          </transition>

          <!-- Progress dots double as a manual picker -->
          <div class="mt-auto flex gap-1.5 pt-4">
            <button
              v-for="(t, i) in TIPS"
              :key="t.text"
              type="button"
              class="h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              :class="
                i === tipIndex % TIPS.length
                  ? 'w-5 bg-brand-500'
                  : 'w-1.5 bg-ink-200 hover:bg-ink-300'
              "
              :aria-label="`Show tip ${i + 1}`"
              :aria-current="i === tipIndex % TIPS.length"
              @click="tipIndex = i"
            />
          </div>
        </section>
      </div>

      <!-- Health summary: what the numbers add up to -->
      <section
        v-if="!loading && health"
        class="rounded-xl border border-line-200 bg-white p-5 shadow-card"
        aria-label="Form health"
      >
        <h2 class="font-semibold text-ink-900">Health summary</h2>
        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wide text-ink-400"
            >
              Top form
            </p>
            <router-link
              :to="{ name: 'responses', params: { id: health.top.id } }"
              class="mt-1 block truncate text-sm font-semibold text-ink-900 hover:text-brand-700"
            >
              {{ health.top.title }}
            </router-link>
            <p class="text-sm text-ink-500">
              {{ health.top.responseCount }} response{{
                health.top.responseCount === 1 ? "" : "s"
              }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wide text-ink-400"
            >
              Weekly growth
            </p>
            <p
              class="mt-1 flex items-center gap-1 text-sm font-semibold"
              :class="
                health.growth?.dir === 'down' ? 'text-danger' : 'text-green-700'
              "
            >
              <UiIcon
                v-if="health.growth"
                :name="
                  health.growth.dir === 'up'
                    ? 'arrow-trending-up'
                    : 'arrow-trending-down'
                "
                class="text-inherit h-4 w-4"
              />
              {{ health.growth?.label ?? "—" }}
            </p>
            <p class="text-sm text-ink-500">responses vs. last week</p>
          </div>
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wide text-ink-400"
            >
              Suggestions
            </p>
            <ul class="mt-1 space-y-1">
              <li
                v-for="tipText in health.suggestions"
                :key="tipText"
                class="flex items-start gap-1.5 text-sm text-ink-700"
              >
                <UiIcon
                  name="sparkles"
                  class="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
                />
                {{ tipText }}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <!-- Mobile sticky actions: the primary two, docked above the tab bar. -->
    <div
      class="fixed inset-x-0 bottom-14 z-20 flex gap-2 border-t border-line-200 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden"
    >
      <UiButton class="flex-1" :disabled="creating" @click="createForm">
        <UiIcon name="plus" class="text-inherit h-4 w-4" />
        {{ creating ? "Creating…" : "Create form" }}
      </UiButton>
      <UiButton
        variant="secondary"
        aria-label="Generate with AI"
        @click="aiOpen = true"
      >
        <UiIcon name="sparkles" class="text-inherit h-4 w-4" />
      </UiButton>
    </div>

    <AiGenerateModal v-model:open="aiOpen" />
  </AppShell>
</template>

<style scoped>
/* Chart draw-on: the line traces itself, bars grow from the baseline. Both are
   keyed to the series <g>, so a metric/range/type switch replays them. */
.chart-line {
  stroke-dasharray: 2400;
  stroke-dashoffset: 2400;
  animation: chart-draw 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.chart-area {
  animation: chart-fade 700ms ease-out forwards;
}
.chart-bar {
  transform-box: fill-box;
  transform-origin: bottom;
  animation: chart-grow 450ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
}
@keyframes chart-draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes chart-fade {
  from {
    opacity: 0;
  }
}
@keyframes chart-grow {
  from {
    transform: scaleY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .chart-line,
  .chart-area,
  .chart-bar {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
