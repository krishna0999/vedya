<script setup lang="ts">
// One card in the template gallery grid. Presentation only — preview/use are
// emitted up to the gallery, which owns the slideover and creation flow.
import type { TemplateSummary } from "@/api/client";
import { metaFor } from "@/data/fieldTypes";
import UiButton from "@/components/ui/UiButton.vue";

const props = defineProps<{
  template: TemplateSummary;
  /** A create-from-template call is in flight (disables the button). */
  busy?: boolean;
  /** THIS card was the one clicked — shows the inline "Creating…" state. */
  pending?: boolean;
}>();
defineEmits<{ preview: []; use: [] }>();

function questionSummary(): string {
  const types = [
    ...new Set(props.template.fields.map((f) => metaFor(f.type)?.label ?? f.type)),
  ];
  return types.slice(0, 3).join(" · ");
}

// Per-category chip tint. Hashed, so new categories get a stable color without
// maintaining a map. Classes are literal for Tailwind.
const TINTS = [
  "bg-brand-100 text-brand-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];
function tintFor(category: string): string {
  let h = 0;
  for (const c of category) h = (h * 31 + c.charCodeAt(0)) % 997;
  return TINTS[h % TINTS.length]!;
}

// Popular reads green; anything else (Trending…) amber.
function badgeClass(badge: "Popular" | "Trending"): string {
  return badge === "Popular"
    ? "bg-green-50 text-green-700"
    : "bg-amber-50 text-amber-700";
}

// ponytail: ~15s per question, rounded up — an estimate, not analytics.
function estMinutes(): number {
  return Math.max(1, Math.ceil((props.template.fieldCount * 15) / 60));
}
</script>

<template>
  <div
    class="flex flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition hover:border-ink-300"
  >
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-semibold text-ink-900">{{ template.title }}</h3>
      <span
        v-if="template.badge"
        class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="badgeClass(template.badge)"
      >
        {{ template.badge }}
      </span>
    </div>
    <p class="mt-1 flex-1 text-sm text-ink-500">{{ template.description }}</p>
    <div
      class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500"
    >
      <span
        class="rounded-full px-2 py-0.5 text-xs font-medium"
        :class="tintFor(template.category)"
      >
        {{ template.category }}
      </span>
      <span>
        {{ template.fieldCount }} question{{
          template.fieldCount === 1 ? "" : "s"
        }}
        · ⏱ ~{{ estMinutes() }} min
      </span>
    </div>
    <p class="mt-1.5 truncate text-sm text-ink-500">
      {{ questionSummary() }}
    </p>
    <p v-if="template.stat" class="mt-1 text-sm text-ink-500">
      {{ template.stat }}
    </p>
    <div class="mt-4 flex items-center gap-2">
      <UiButton variant="secondary" size="sm" @click="$emit('preview')">
        Preview
      </UiButton>
      <UiButton size="sm" :disabled="busy" @click="$emit('use')">
        {{ pending ? "Creating…" : "Use template" }}
      </UiButton>
    </div>
  </div>
</template>
