<script setup lang="ts">
// One card in the template gallery grid, styled as a small sheet of paper:
// the template's actual first questions rendered in grayscale, metadata kept
// quiet, the accent reserved for the primary action. Presentation only —
// preview/use are emitted up to the gallery.
import type { TemplateSummary } from "@/api/client";
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

// ponytail: ~15s per question, rounded up — an estimate, not analytics.
function estMinutes(): number {
  return Math.max(1, Math.ceil((props.template.fieldCount * 15) / 60));
}
</script>

<template>
  <!-- Fixed-height tile. On hover it scales up from its own center (transforms
       don't reflow, so it pops OVER its neighbors on every side instead of
       pushing them) and lifts above the grid via z-index. -->
  <!-- No overflow clip: tooltips on the header actions render above the tile.
       The preview is the only child that paints to the edge and it clips
       itself. -->
  <div
    class="group relative flex h-80 flex-col rounded-xl border border-ink-200 bg-white p-5 shadow-card transition duration-200 ease-soft hover:z-30 hover:scale-[1.06] hover:border-ink-300 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08),0_16px_38px_-12px_color-mix(in_srgb,var(--card-accent)_45%,transparent)]"
    :style="{ '--card-accent': template.primaryColor }"
  >
    <!-- min-h on title + description reserves two lines each, so every card's
         preview starts at the same y regardless of how much text wraps. -->
    <div class="flex shrink-0 items-start justify-between gap-2">
      <h3
        class="line-clamp-2 min-h-[2.5rem] min-w-0 text-[15px] font-semibold leading-snug text-ink-900 transition-colors duration-200 group-hover:text-brand-700"
      >
        {{ template.title }}
      </h3>
      <div class="-mr-1.5 -mt-1 flex shrink-0 items-center gap-0.5">
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
             them would sit stranded in that gap. -->
        <UiBadge v-if="template.badge" variant="brand" class="ml-1">
          {{ template.badge }}
        </UiBadge>
      </div>
    </div>
    <p class="mt-1 line-clamp-2 min-h-[2.5rem] shrink-0 text-sm text-ink-500">
      {{ template.description }}
    </p>

    <!-- The paper: this template's first questions. flex-1 + min-h-0 lets it
         absorb the slack and clip gracefully, so the footer is never clipped. -->
    <FormCardPreview
      :fields="template.fields"
      :accent="template.primaryColor"
      class="mt-4 min-h-0 flex-1 overflow-hidden"
    />

    <div
      class="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink-100 pt-3 text-sm text-ink-500"
    >
      <UiBadge variant="gray">{{ template.category }}</UiBadge>
      <span>
        {{ template.fieldCount }} question{{
          template.fieldCount === 1 ? "" : "s"
        }}
      </span>
      <span class="inline-flex items-center gap-1">
        <UiIcon name="clock" class="h-4 w-4 text-ink-400" />
        ~{{ estMinutes() }} min
      </span>
      <span v-if="template.stat">· {{ template.stat }}</span>
    </div>

    <div class="mt-3 flex shrink-0 items-center gap-2">
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
