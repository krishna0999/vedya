<script setup lang="ts">
// Custom date picker. Single or range mode (range enabled per-field at form
// setup — the `date_range` field type). Preset shortcuts show their label in the
// trigger and a selected state. Emits ISO 'YYYY-MM-DD' (single) or
// { start, end } (range) — matching the schema's date / date_range validation.
import { computed, onBeforeUnmount, ref } from "vue";
import type { DateRangeValue } from "@schema";
import UiIcon from "@/components/ui/UiIcon.vue";

interface Preset {
  label: string;
  offsetDays: number;
}

const props = withDefaults(
  defineProps<{
    id?: string;
    modelValue: string | DateRangeValue | undefined;
    invalid?: boolean;
    placeholder?: string;
    range?: boolean;
    presets?: Preset[];
  }>(),
  {
    presets: () => [
      { label: "Today", offsetDays: 0 },
      { label: "Tomorrow", offsetDays: 1 },
      { label: "In a week", offsetDays: 7 },
    ],
  },
);
const emit = defineEmits<{
  "update:modelValue": [value: string | DateRangeValue];
}>();

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function parse(
  iso: string | undefined,
): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
}
function fmt(iso: string): string {
  const p = parse(iso);
  return p ? `${MONTHS[p.m]!.slice(0, 3)} ${p.d}, ${p.y}` : "";
}
function todayParts(): { y: number; m: number; d: number } {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
}
function isRangeVal(v: unknown): v is DateRangeValue {
  return typeof v === "object" && v !== null && "start" in v && "end" in v;
}

const todayISO = (() => {
  const t = todayParts();
  return toISO(t.y, t.m, t.d);
})();

// Which month to show first.
const initFrom =
  (typeof props.modelValue === "string" && parse(props.modelValue)) ||
  (isRangeVal(props.modelValue) && parse(props.modelValue.start)) ||
  todayParts();
const viewY = ref(initFrom.y);
const viewM = ref(initFrom.m);

// Preset selection (single mode): remember the chosen preset to show its label.
const presetLabel = ref<string | null>(null);
// Range in-progress: first endpoint picked, waiting for the second.
const pendingStart = ref<string | null>(null);
const hoverISO = ref<string | null>(null);

const singleISO = computed(() =>
  typeof props.modelValue === "string" ? props.modelValue : undefined,
);

// Effective [start,end] for highlighting (either committed range or live preview).
const activeRange = computed<{ start: string; end: string } | null>(() => {
  if (pendingStart.value) {
    const s = pendingStart.value;
    const e = hoverISO.value ?? s;
    return e < s ? { start: e, end: s } : { start: s, end: e };
  }
  if (props.range && isRangeVal(props.modelValue)) {
    return { start: props.modelValue.start, end: props.modelValue.end };
  }
  return null;
});

const display = computed(() => {
  if (props.range) {
    if (pendingStart.value) return `${fmt(pendingStart.value)} – …`;
    if (isRangeVal(props.modelValue))
      return `${fmt(props.modelValue.start)} – ${fmt(props.modelValue.end)}`;
    return "";
  }
  if (presetLabel.value) return presetLabel.value;
  return singleISO.value ? fmt(singleISO.value) : "";
});

const cells = computed(() => {
  const first = new Date(viewY.value, viewM.value, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday-based
  const daysInMonth = new Date(viewY.value, viewM.value + 1, 0).getDate();
  const rows = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const out: {
    y: number;
    m: number;
    d: number;
    iso: string;
    inMonth: boolean;
  }[] = [];
  for (let i = 0; i < rows; i++) {
    const dt = new Date(viewY.value, viewM.value, i - startWeekday + 1);
    const y = dt.getFullYear();
    const m = dt.getMonth();
    const d = dt.getDate();
    out.push({ y, m, d, iso: toISO(y, m, d), inMonth: m === viewM.value });
  }
  return out;
});

function cellState(iso: string): "endpoint" | "inRange" | "none" {
  const r = activeRange.value;
  if (props.range && r) {
    if (iso === r.start || iso === r.end) return "endpoint";
    if (iso > r.start && iso < r.end) return "inRange";
    return "none";
  }
  return !props.range && iso === singleISO.value ? "endpoint" : "none";
}

function prevMonth(): void {
  if (viewM.value === 0) {
    viewM.value = 11;
    viewY.value -= 1;
  } else {
    viewM.value -= 1;
  }
}
function nextMonth(): void {
  if (viewM.value === 11) {
    viewM.value = 0;
    viewY.value += 1;
  } else {
    viewM.value += 1;
  }
}

// --- popover ---
const open = ref(false);
const root = ref<HTMLElement | null>(null);

function onDocPointer(e: MouseEvent): void {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
function openMenu(): void {
  if (open.value) return;
  open.value = true;
  document.addEventListener("mousedown", onDocPointer);
}
function close(): void {
  if (!open.value) return;
  open.value = false;
  pendingStart.value = null;
  hoverISO.value = null;
  document.removeEventListener("mousedown", onDocPointer);
}
function toggle(): void {
  open.value ? close() : openMenu();
}

function selectCell(c: { y: number; m: number; iso: string }): void {
  if (props.range) {
    if (!pendingStart.value) {
      pendingStart.value = c.iso;
      return;
    }
    const s = pendingStart.value;
    const range =
      c.iso < s ? { start: c.iso, end: s } : { start: s, end: c.iso };
    pendingStart.value = null;
    emit("update:modelValue", range);
    close();
    return;
  }
  presetLabel.value = null;
  viewY.value = c.y;
  viewM.value = c.m;
  emit("update:modelValue", c.iso);
  close();
}

function applyPreset(p: Preset): void {
  const t = new Date();
  t.setDate(t.getDate() + p.offsetDays);
  presetLabel.value = p.label;
  emit("update:modelValue", toISO(t.getFullYear(), t.getMonth(), t.getDate()));
  close();
}

onBeforeUnmount(() => document.removeEventListener("mousedown", onDocPointer));
</script>

<template>
  <div ref="root" class="relative">
    <button
      :id="id"
      type="button"
      :class="[
        'fb-input flex items-center justify-between text-left',
        invalid && 'fb-input--invalid',
        !display && 'text-ink-500',
      ]"
      :aria-expanded="open"
      @click="toggle"
    >
      <span>{{
        display ||
        (placeholder ?? (range ? "Select a date range" : "Select a date"))
      }}</span>
      <UiIcon name="calendar" class="ml-2 h-5 w-5 shrink-0 text-ink-500" />
    </button>

    <transition
      enter-active-class="transition duration-150 ease-soft"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-soft"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        class="absolute z-20 mt-2 w-[19rem] overflow-hidden rounded-2xl border border-ink-200 bg-white p-3 shadow-pop"
      >
        <!-- presets (single mode) -->
        <div
          v-if="!range && presets.length"
          class="mb-2 flex flex-wrap gap-1.5 border-b border-ink-100 pb-3"
        >
          <button
            v-for="p in presets"
            :key="p.label"
            type="button"
            class="rounded-full px-3 py-1 text-sm font-medium transition-colors duration-150"
            :class="
              presetLabel === p.label
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-700 hover:bg-brand-50 hover:text-brand-700'
            "
            @click="applyPreset(p)"
          >
            {{ p.label }}
          </button>
        </div>

        <div class="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
            aria-label="Previous month"
            @click="prevMonth"
          >
            <UiIcon name="chevron-left" class="text-inherit h-5 w-5" />
          </button>
          <span class="text-sm font-semibold text-ink-900"
            >{{ MONTHS[viewM] }} {{ viewY }}</span
          >
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100"
            aria-label="Next month"
            @click="nextMonth"
          >
            <UiIcon name="chevron-right" class="text-inherit h-5 w-5" />
          </button>
        </div>

        <div class="grid grid-cols-7 gap-1 px-1 pb-1">
          <span
            v-for="w in WEEKDAYS"
            :key="w"
            class="grid h-8 place-items-center text-sm font-medium text-ink-500"
            >{{ w }}</span
          >
        </div>

        <div class="grid grid-cols-7 gap-y-1 px-1">
          <div
            v-for="c in cells"
            :key="c.iso"
            class="relative"
            :class="cellState(c.iso) === 'inRange' && 'bg-brand-50'"
            @mouseenter="range && pendingStart ? (hoverISO = c.iso) : null"
          >
            <button
              type="button"
              class="relative z-10 grid h-9 w-full place-items-center rounded-lg text-sm transition-colors duration-150"
              :class="[
                cellState(c.iso) === 'endpoint'
                  ? 'bg-brand-600 font-semibold text-white'
                  : c.inMonth
                    ? 'text-ink-800 hover:bg-brand-50'
                    : 'text-ink-300 hover:bg-ink-50',
                c.iso === todayISO &&
                  cellState(c.iso) !== 'endpoint' &&
                  'font-semibold text-brand-600',
              ]"
              @click="selectCell(c)"
            >
              {{ c.d }}
              <span
                v-if="c.iso === todayISO && cellState(c.iso) !== 'endpoint'"
                class="absolute bottom-1 h-1 w-1 rounded-full bg-brand-600"
              ></span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
