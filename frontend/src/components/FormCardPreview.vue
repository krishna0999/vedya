<script setup lang="ts">
// Miniature "paper" rendering of a form's first few questions — the card's
// face, shown at all times so the fixed-height tile never looks empty. Pure
// grayscale, non-interactive, decorative (the card text carries the accessible
// content, hence aria-hidden).
import { computed } from "vue";
import type { Field } from "@schema";
import UiIcon from "@/components/ui/UiIcon.vue";

const props = defineProps<{
  fields?: Field[];
  /** The form's theme color — drives the 3px top edge of the preview panel. */
  accent?: string;
  /** Render extra questions so the card's hover-expand can peek deeper. */
  peek?: boolean;
}>();

// Default to the product brand so templates (no per-form theme yet) still get a
// tasteful accent. White paper + hairline border + a top edge in the form color.
const accent = computed(() => props.accent ?? "#4f46e5");
const panelStyle = computed(() => ({ borderTop: `3px solid ${accent.value}` }));

// The question types that give a form its character — a rating says "feedback",
// a skills dropdown says "recruitment". Generic name/email/text fields look the
// same on every form, so we surface the distinctive ones first.
const DEFINING = new Set<Field["type"]>([
  "rating",
  "single_select",
  "multi_select",
  "dropdown",
  "multi_dropdown",
  "date",
]);

// Questions that define the form: prefer distinctive types, otherwise keep
// document order (stable sort). Two show in the fixed tile; peek renders more so
// the hover-expand has something extra to reveal.
const preview = computed(() =>
  (props.fields ?? [])
    .filter((f) => f.type !== "section_break")
    .map((f, i) => ({ f, i }))
    .sort(
      (a, b) =>
        Number(DEFINING.has(b.f.type)) - Number(DEFINING.has(a.f.type)) ||
        a.i - b.i,
    )
    .slice(0, props.peek ? 6 : 2)
    .map((x) => x.f),
);

const SELECT = new Set<Field["type"]>(["single_select", "multi_select"]);
const DROPDOWN = new Set<Field["type"]>(["dropdown", "multi_dropdown"]);
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none relative select-none space-y-3 overflow-hidden rounded-lg border border-[#ECECEC] bg-white p-3.5 text-left transition-[max-height,background-color] duration-200 ease-soft group-hover:bg-gray-50"
    :style="panelStyle"
  >
    <!-- Empty form: an inviting placeholder instead of dead space. The card
         title already links to the builder; this lights up with the card's
         hover to read as "click to start". -->
    <div
      v-if="preview.length === 0"
      class="flex h-full flex-col items-center justify-center gap-2 py-6 text-center text-ink-400 transition-colors duration-200 group-hover:text-brand-600"
    >
      <span
        class="grid h-9 w-9 place-items-center rounded-full bg-ink-100 transition-colors duration-200 group-hover:bg-brand-100"
      >
        <UiIcon name="plus" class="h-5 w-5 text-inherit" />
      </span>
      <p class="text-xs font-medium">Add your first question</p>
    </div>

    <div v-for="f in preview" :key="f.id" class="space-y-1.5">
      <p class="truncate text-xs font-medium text-ink-700">{{ f.label }}</p>

      <!-- Choice fields: first two options with circle / square marks -->
      <template v-if="SELECT.has(f.type)">
        <p
          v-for="opt in (f.options ?? []).slice(0, 2)"
          :key="opt.id"
          class="flex items-center gap-1.5"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 border border-ink-400 bg-white"
            :class="
              f.type === 'multi_select' ? 'rounded-[3px]' : 'rounded-full'
            "
          />
          <span class="truncate text-xs text-ink-400">{{ opt.label }}</span>
        </p>
      </template>

      <p
        v-else-if="f.type === 'rating'"
        class="text-xs tracking-widest text-ink-400"
      >
        ★★★★★
      </p>

      <!-- Dropdowns: answer line with a collapsed chevron -->
      <div v-else-if="DROPDOWN.has(f.type)" class="flex w-3/5 items-end gap-1">
        <span class="h-3 flex-1 border-b border-ink-400" />
        <span class="text-[10px] leading-none text-ink-400">▾</span>
      </div>

      <!-- Long text: two ruled lines, like lined paper -->
      <template v-else-if="f.type === 'long_text'">
        <div class="h-3 w-full border-b border-ink-400" />
        <div class="h-3 w-4/5 border-b border-ink-400" />
      </template>

      <!-- Everything else: a blank answer line -->
      <div v-else class="h-3 w-3/5 border-b border-ink-400" />
    </div>
  </div>
</template>
