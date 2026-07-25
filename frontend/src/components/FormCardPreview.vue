<script setup lang="ts">
// Miniature "paper" rendering of a form's first few questions — the card's
// face, shown at all times so the fixed-height tile never looks empty. Mostly
// grayscale (the accent tints only the type glyphs and the top edge),
// non-interactive, decorative (the card text carries the accessible content,
// hence aria-hidden).
//
// Every row is a FIXED height. Question types render at wildly different
// natural heights (a 2-option select is ~2x a short-text field), so a variable
// row meant one card showed two questions and the next clipped its second
// halfway. Fixed rows make "N questions visible" deterministic for a caller
// with a fixed-height slot.
import { computed } from "vue";
import type { Field } from "@schema";
import { FIELD_TYPES } from "@/data/fieldTypes";
import UiIcon from "@/components/ui/UiIcon.vue";
import type { IconName } from "@/lib/icons";

const props = defineProps<{
  fields?: Field[];
  /** The form's theme color — tints the type glyphs and the top edge. */
  accent?: string;
  /** Render extra questions so the card's hover-expand can peek deeper. */
  peek?: boolean;
}>();

// Default to the product brand so a form with no theme still gets an accent.
const accent = computed(() => props.accent ?? "#047857");

// Reuse the builder's type→icon map rather than keeping a second one in sync.
const TYPE_ICON = new Map<Field["type"], IconName>(
  FIELD_TYPES.map((t) => [t.type, t.icon]),
);
function typeIcon(type: Field["type"]): IconName {
  return TYPE_ICON.get(type) ?? "text-t";
}

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

const SELECT = new Set<Field["type"]>([
  "single_select",
  "multi_select",
  "dropdown",
  "multi_dropdown",
]);
const RADIO = new Set<Field["type"]>(["single_select", "dropdown"]);
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none relative select-none space-y-1.5 overflow-hidden rounded-lg border border-line-200 p-3 text-left transition-[max-height,background-color] duration-200 ease-soft"
    :style="{
      // A very light wash of the accent instead of flat white — enough to read
      // as a tinted surface, not enough to fight the grayscale content.
      background: `color-mix(in srgb, ${accent} 4%, white)`,
      borderTop: `1px solid ${accent}`,
    }"
  >
    <!-- Empty form: an inviting placeholder instead of dead space. The card
         title already links to the builder; this lights up with the card's
         hover to read as "click to start". -->
    <div
      v-if="preview.length === 0"
      class="flex h-full flex-col items-center justify-center gap-1.5 text-center text-ink-400 transition-colors duration-200 group-hover:text-brand-600"
    >
      <span
        class="grid h-7 w-7 place-items-center rounded-full bg-ink-100 transition-colors duration-200 group-hover:bg-brand-100"
      >
        <UiIcon name="plus" class="h-4 w-4 text-inherit" />
      </span>
      <p class="text-xs font-medium">Add your first question</p>
    </div>

    <!-- h-8 per row is the contract: a caller sizing its slot at
         (rows x 32px) + (gaps x 6px) + 24px padding + 2px border gets exactly
         `rows` questions visible, whatever types they happen to be.
         Two rows => 98px, which is what TemplateCard reserves. -->
    <div
      v-for="f in preview"
      :key="f.id"
      class="flex h-8 flex-col justify-start gap-1.5 overflow-hidden"
    >
      <p class="flex items-center gap-1.5">
        <UiIcon
          :name="typeIcon(f.type)"
          class="h-3 w-3 shrink-0"
          :style="{ color: accent }"
        />
        <span
          class="truncate text-[11px] font-medium leading-none text-ink-700"
          >{{ f.label }}</span
        >
      </p>

      <!-- Answer affordance — one compact line per type, so the row height
           never depends on how many options a question happens to have. -->
      <span
        v-if="SELECT.has(f.type)"
        class="flex items-center gap-2 overflow-hidden"
      >
        <span
          v-for="opt in (f.options ?? []).slice(0, 2)"
          :key="opt.id"
          class="flex min-w-0 items-center gap-1"
        >
          <span
            class="h-2 w-2 shrink-0 border border-line-400 bg-white"
            :class="RADIO.has(f.type) ? 'rounded-full' : 'rounded-[2px]'"
          />
          <span class="truncate text-[10px] leading-none text-ink-400">{{
            opt.label
          }}</span>
        </span>
      </span>

      <span
        v-else-if="f.type === 'rating'"
        class="text-[10px] leading-none tracking-widest text-ink-400"
        >★★★★★</span
      >

      <span v-else-if="f.type === 'date'" class="flex w-2/5 items-end gap-1">
        <span class="h-2.5 flex-1 border-b border-line-400" />
        <UiIcon name="calendar" class="h-3 w-3 shrink-0 text-ink-400" />
      </span>

      <!-- Everything else: a blank answer line -->
      <span v-else class="block h-2.5 w-3/5 border-b border-line-400" />
    </div>
  </div>
</template>
