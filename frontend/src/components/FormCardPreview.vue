<script setup lang="ts">
// Miniature "paper" rendering of a form's first few questions — the card's
// face, shown at all times so the fixed-height tile never looks empty. Pure
// grayscale, non-interactive, decorative (the card text carries the accessible
// content, hence aria-hidden).
import { computed } from "vue";
import type { Field } from "@schema";

const props = defineProps<{ fields?: Field[] }>();

// Two complete questions read as a clean teaser and fit the fixed-height tile
// without clipping; the builder shows the whole form.
const preview = computed(() =>
  (props.fields ?? []).filter((f) => f.type !== "section_break").slice(0, 2),
);

const SELECT = new Set<Field["type"]>(["single_select", "multi_select"]);
const DROPDOWN = new Set<Field["type"]>(["dropdown", "multi_dropdown"]);
</script>

<template>
  <div
    aria-hidden="true"
    class="pointer-events-none select-none space-y-3 text-left"
  >
    <p v-if="preview.length === 0" class="text-xs italic text-ink-400">
      No questions yet
    </p>

    <div v-for="f in preview" :key="f.id" class="space-y-1.5">
      <p class="truncate text-xs font-medium text-ink-600">{{ f.label }}</p>

      <!-- Choice fields: first two options with circle / square marks -->
      <template v-if="SELECT.has(f.type)">
        <p
          v-for="opt in (f.options ?? []).slice(0, 2)"
          :key="opt.id"
          class="flex items-center gap-1.5"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 border border-ink-300 bg-white"
            :class="
              f.type === 'multi_select' ? 'rounded-[3px]' : 'rounded-full'
            "
          />
          <span class="truncate text-xs text-ink-400">{{ opt.label }}</span>
        </p>
      </template>

      <p
        v-else-if="f.type === 'rating'"
        class="text-xs tracking-widest text-ink-300"
      >
        ★★★★★
      </p>

      <!-- Dropdowns: answer line with a collapsed chevron -->
      <div v-else-if="DROPDOWN.has(f.type)" class="flex w-3/5 items-end gap-1">
        <span class="h-3 flex-1 border-b border-ink-300" />
        <span class="text-[10px] leading-none text-ink-300">▾</span>
      </div>

      <!-- Long text: two ruled lines, like lined paper -->
      <template v-else-if="f.type === 'long_text'">
        <div class="h-3 w-full border-b border-ink-300" />
        <div class="h-3 w-4/5 border-b border-ink-300" />
      </template>

      <!-- Everything else: a blank answer line -->
      <div v-else class="h-3 w-3/5 border-b border-ink-300" />
    </div>
  </div>
</template>
