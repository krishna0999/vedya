<script setup lang="ts">
// One card in the template gallery grid, styled as a small sheet of paper:
// the template's actual first questions rendered in grayscale, metadata kept
// quiet, the accent reserved for identity and the primary action. Presentation
// only — preview/use are emitted up to the gallery.
//
// The accent comes from the template's CATEGORY, not its theme: every template
// ships the same default primaryColor, so theming by it made all 100+ cards
// identical. Category is the axis with real variety, so it drives the top strip,
// the icon chip, the preview's edge and the hover glow — one color, four places.
import { computed } from "vue";
import type { TemplateSummary } from "@/api/client";
import { categoryAccent } from "@/lib/categories";
import FormCardPreview from "@/components/FormCardPreview.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiTooltip from "@/components/ui/UiTooltip.vue";

const props = defineProps<{
  template: TemplateSummary;
  /** A create-from-template call is in flight (disables the button). */
  busy?: boolean;
  /** THIS card was the one clicked — shows the inline "Creating…" state. */
  pending?: boolean;
  /** Pinned cards float to the top of the gallery. */
  pinned?: boolean;
}>();
// `move` is the keyboard path to the drag-reorder the card body supports.
defineEmits<{ preview: []; use: []; pin: []; move: [delta: number] }>();

const accent = computed(() => categoryAccent(props.template.category));

// ponytail: ~15s per question, rounded up — an estimate, not analytics.
function estMinutes(): number {
  return Math.max(1, Math.ceil((props.template.fieldCount * 15) / 60));
}
</script>

<template>
  <!-- Fixed-height tile. On hover it scales up from its own center (transforms
       don't reflow, so it pops OVER its neighbors on every side instead of
       pushing them) and lifts above the grid via z-index. -->
  <!-- No overflow clip: tooltips on the header actions render above the tile. -->
  <!-- The category accent strip IS the card's top border, not a bar drawn over
       it. An absolutely-positioned strip sits against the padding box (inside
       the 1px border) and can't take the card's 18px corner radius at 4px tall,
       so it left a visible gap at both top corners. As a border it follows
       `rounded-xl` by construction and the browser mitres the corners for us. -->
  <div
    class="group relative flex h-[22rem] flex-col rounded-xl border border-t-4 border-line-200 bg-white px-5 py-4 shadow-card transition duration-200 ease-soft hover:z-30 hover:scale-[1.06] hover:border-line-300 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08),0_16px_38px_-12px_color-mix(in_srgb,var(--card-accent)_45%,transparent)]"
    :style="{
      '--card-accent': accent,
      borderTopColor: accent,
      // A whisper of the accent bleeding down from the strip, gone by 45%.
      // Any stronger and 100 cards become a paint chart.
      backgroundImage:
        'linear-gradient(to bottom, color-mix(in srgb, var(--card-accent) 6%, white), white 45%)',
    }"
  >
    <!-- Identity row: the template's own icon (tinted by category) left,
         reorder/pin/badge right. Giving the icon its own line is what makes a
         template memorable at a glance. -->
    <div class="flex shrink-0 items-start justify-between gap-2">
      <span
        class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg leading-none"
        style="background: color-mix(in srgb, var(--card-accent) 12%, white)"
        aria-hidden="true"
      >
        {{ template.icon }}
      </span>

      <div class="-mr-1.5 -mt-0.5 flex shrink-0 items-center gap-0.5">
        <!-- Reorder fallback for keyboard/touch; the card body also drags. -->
        <UiTooltip
          v-for="d in [-1, 1]"
          :key="d"
          :text="d < 0 ? 'Move left' : 'Move right'"
          align="end"
        >
          <button
            type="button"
            class="grid h-7 w-7 place-items-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            :aria-label="d < 0 ? 'Move template left' : 'Move template right'"
            @click="$emit('move', d)"
          >
            <UiIcon
              :name="d < 0 ? 'chevron-left' : 'chevron-right'"
              class="text-inherit h-4 w-4"
            />
          </button>
        </UiTooltip>
        <!-- A pinned card keeps its star visible; otherwise it fades in. -->
        <UiTooltip
          :text="pinned ? 'Unpin template' : 'Pin to the top'"
          align="end"
        >
          <button
            type="button"
            class="grid h-7 w-7 place-items-center rounded-md transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            :class="
              pinned
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-ink-400 hover:text-ink-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100'
            "
            :aria-pressed="!!pinned"
            :aria-label="pinned ? 'Unpin template' : 'Pin template'"
            @click="$emit('pin')"
          >
            <UiIcon
              :name="pinned ? 'star' : 'star-outline'"
              :type="pinned ? 'solid' : 'outline'"
              class="text-inherit h-4 w-4"
            />
          </button>
        </UiTooltip>
        <!-- Last in the row so it anchors the right edge: the actions before it
             still take up space while invisible, and a badge placed ahead of
             them would sit stranded in that gap. Amber, so merchandising reads
             as distinct from both the category accent and any status color. -->
        <UiBadge v-if="template.badge" variant="amber" class="ml-1">
          <UiIcon
            :name="template.badge === 'Popular' ? 'star' : 'arrow-trending-up'"
            :type="template.badge === 'Popular' ? 'solid' : 'outline'"
            class="text-inherit h-3 w-3"
          />
          {{ template.badge }}
        </UiBadge>
      </div>
    </div>

    <!-- min-h on title + description reserves two lines each, so every card's
         preview starts at the same y regardless of how much text wraps. -->
    <h3
      class="mt-2.5 line-clamp-2 min-h-[2.5rem] shrink-0 text-[15px] font-semibold leading-snug text-ink-900 transition-colors duration-200 group-hover:text-[color:var(--card-accent)]"
    >
      {{ template.title }}
    </h3>
    <p class="mt-1 line-clamp-2 min-h-[2.5rem] shrink-0 text-sm text-ink-500">
      {{ template.description }}
    </p>

    <!-- The paper: this template's first two questions. The height is FIXED,
         not flex-1 — at 32px a row, 6px gaps and 24px padding, 98px is exactly
         two rows, so every card shows two questions and none clips a third
         halfway. shrink-0 keeps a long title from stealing the space. -->
    <FormCardPreview
      :fields="template.fields"
      :accent="accent"
      class="mt-2.5 h-[6.125rem] shrink-0"
    />

    <!-- Meta: category carries the accent as text (no badge — the strip and the
         icon chip already say it in color), then the quiet numbers. One line,
         truncating: wrapping to two would eat the preview's reserved height. -->
    <div
      class="mt-2.5 flex shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-ink-500"
    >
      <span class="shrink-0 font-medium text-[color:var(--card-accent)]">{{
        template.category
      }}</span>
      <span class="shrink-0 text-ink-300">·</span>
      <span class="shrink-0">
        {{ template.fieldCount }} question{{
          template.fieldCount === 1 ? "" : "s"
        }}
      </span>
      <span class="inline-flex shrink-0 items-center gap-1">
        <UiIcon name="clock" class="h-4 w-4 text-ink-400" />
        ~{{ estMinutes() }} min
      </span>
      <span v-if="template.stat" class="truncate">· {{ template.stat }}</span>
    </div>

    <div class="mt-2.5 flex shrink-0 items-center gap-2">
      <UiTooltip text="See it as a respondent would" align="start">
        <UiButton variant="secondary" size="sm" @click="$emit('preview')">
          Preview
        </UiButton>
      </UiTooltip>
      <UiTooltip text="Create an editable form from this template" align="start">
        <UiButton size="sm" :disabled="busy" @click="$emit('use')">
          {{ pending ? "Creating…" : "Use template" }}
        </UiButton>
      </UiTooltip>
    </div>
  </div>
</template>
