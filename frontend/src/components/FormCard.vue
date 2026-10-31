<script setup lang="ts">
// One card in the "My forms" grid, styled as a small sheet of paper: title,
// a grayscale mini preview of the form's first questions, then quiet metrics.
// Presentation only — every action is emitted up to the page, which owns
// navigation, clipboard, and deletion.
import type { FormSummary } from "@/api/client";
import { relativeTime } from "@/lib/time";
import FormCardPreview from "@/components/FormCardPreview.vue";
import UiActionMenu, {
  type UiActionItem,
} from "@/components/ui/UiActionMenu.vue";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiTooltip from "@/components/ui/UiTooltip.vue";

const props = defineProps<{
  form: FormSummary;
  /** True right after the share link was copied — shows inline feedback. */
  copied?: boolean;
  /** Pinned cards float to the top of the grid. */
  pinned?: boolean;
}>();
const emit = defineEmits<{ action: [actionId: string] }>();

// Why a form can't be shared until it's published — reused by the hover quick
// actions and the "more" menu so the affordance is discoverable pre-publish.
function needsPublishTitle(): string | undefined {
  return props.form.published ? undefined : "Publish the form to get a link";
}

// Edit / Open / Email surface as hover quick actions on the card; everything
// else lives in the kebab "more options" menu. Move left/right is the keyboard
// (and discoverable) path to the drag-reorder the card body supports.
const moreActions = (): UiActionItem[] => [
  { id: "edit", label: "Edit form", icon: "pencil" },
  { id: "responses", label: "Responses", icon: "responses" },
  {
    id: "open",
    label: "Open form",
    icon: "external",
    disabled: !props.form.published,
    title: needsPublishTitle(),
  },
  {
    id: "email",
    label: "Email form",
    icon: "email",
    disabled: !props.form.published,
    title: needsPublishTitle(),
  },
  { id: "move-back", label: "Move left", icon: "move-left" },
  { id: "move-forward", label: "Move right", icon: "move-right" },
  {
    id: "copy",
    label: "Copy link",
    icon: "copy",
    disabled: !props.form.published,
    title: needsPublishTitle(),
  },
  { id: "delete", label: "Delete form", icon: "trash", danger: true },
];
</script>

<template>
  <!-- Fixed-height tile. Hover is deliberately quiet (border only); it lifts
       above the grid via z-index so the question preview can peek out. -->
  <!-- overflow-visible (no clip) so the preview can float BELOW the card on
       hover to peek at more questions than the tile's height would fit. -->
  <li
    class="group relative flex h-80 flex-col rounded-xl border border-line-200 bg-white p-5 transition-colors duration-150 ease-soft hover:z-30 hover:border-line-300"
    :style="{ '--card-accent': form.primaryColor }"
  >
    <!-- Header: title left, actions right (fade in on hover / focus) -->
    <div class="flex shrink-0 items-start justify-between gap-2">
      <!-- min-h reserves two lines so every card's preview starts at the same y,
           whether the title wraps to one line or two. -->
      <!-- draggable=false so grabbing the title drags the card, not the link -->
      <router-link
        :to="{ name: 'builder', params: { id: form.id } }"
        draggable="false"
        class="line-clamp-2 min-h-[2.75rem] min-w-0 break-words text-base font-semibold leading-snug text-ink-900 transition-colors duration-200 group-hover:text-[color:var(--card-accent)]"
      >
        {{ form.title }}
      </router-link>

      <div class="-mr-1.5 -mt-1.5 flex shrink-0 items-center gap-0.5">
        <!-- Sits next to the kebab on purpose: a pinned star is the only thing
             still visible at rest, so it must not float in the gap the hidden
             quick actions leave behind. -->
        <UiTooltip
          :text="pinned ? 'Unpin form' : 'Pin to the top'"
          align="end"
        >
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            :class="[
              pinned
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-ink-500 hover:text-ink-800 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
            ]"
            :aria-pressed="!!pinned"
            :aria-label="pinned ? 'Unpin form' : 'Pin form'"
            @click="emit('action', 'pin')"
          >
            <UiIcon
              :name="pinned ? 'star' : 'star-outline'"
              :type="pinned ? 'solid' : 'outline'"
              class="text-inherit h-5 w-5"
            />
          </button>
        </UiTooltip>
        <UiActionMenu
          class="shrink-0"
          :items="moreActions()"
          :label="`More actions for ${form.title}`"
          @select="emit('action', $event)"
        />
      </div>
    </div>

    <!-- The paper: this form's questions. The preview absolutely fills this
         reserved slot, then on hover grows past it (max-height) into a floating
         panel that peeks at more questions — no grid reflow. An empty form has
         nothing to peek, so it doesn't expand. -->
    <div class="relative mt-6 min-h-0 flex-1">
      <FormCardPreview
        :fields="form.previewFields"
        :accent="form.primaryColor"
        :peek="form.fieldCount > 0"
        class="absolute inset-x-0 top-0 z-10 max-h-full min-h-full"
        :class="
          form.fieldCount > 0
            ? 'group-hover:z-20 group-hover:max-h-[28rem] group-hover:shadow-xl'
            : ''
        "
      />
    </div>

    <!-- Quiet metrics — pinned to the bottom so every tile lines up -->
    <div
      class="flex shrink-0 flex-wrap items-center gap-2 border-t border-line-100 pt-6 text-sm text-ink-600"
    >
      <span>
        <span class="font-semibold tabular-nums text-ink-800">{{
          form.responseCount
        }}</span>
        Response{{ form.responseCount === 1 ? "" : "s" }}
      </span>
      <span class="text-ink-300">•</span>
      <span>
        <span class="font-semibold tabular-nums text-ink-800">{{
          form.viewCount
        }}</span>
        View{{ form.viewCount === 1 ? "" : "s" }}
      </span>
      <span class="text-ink-300">•</span>
      <span>
        <span class="font-semibold tabular-nums text-ink-800">{{
          form.fieldCount
        }}</span>
        Question{{ form.fieldCount === 1 ? "" : "s" }}
      </span>
    </div>

    <!-- Meta: type + status badges, then last edit. -->
    <div class="mt-6 flex shrink-0 flex-wrap items-center gap-2 text-sm text-ink-500">
      <UiBadge v-if="form.category" variant="brand">
        {{ form.category }}
      </UiBadge>
      <!-- Semantic status colours: green = published, amber = draft -->
      <UiBadge :variant="form.published ? 'green' : 'amber'" dot>
        {{ form.published ? "Published" : "Draft" }}
      </UiBadge>
      <span class="text-ink-300">·</span>
      <span>Edited {{ relativeTime(form.updatedAt) }}</span>
      <!-- Copy feedback lands here since the menu closes on select -->
      <span v-if="copied" class="font-medium text-brand-700"
        >· Link copied!</span
      >
    </div>
  </li>
</template>
