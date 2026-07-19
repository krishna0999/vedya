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

const props = defineProps<{
  form: FormSummary;
  /** True right after the share link was copied — shows inline feedback. */
  copied?: boolean;
}>();
const emit = defineEmits<{ action: [actionId: string] }>();

// Why a form can't be shared until it's published — reused by the hover quick
// actions and the "more" menu so the affordance is discoverable pre-publish.
function needsPublishTitle(): string | undefined {
  return props.form.published ? undefined : "Publish the form to get a link";
}

// Edit / Open / Email surface as hover quick actions on the card; everything
// else lives in the kebab "more options" menu.
const moreActions = (): UiActionItem[] => [
  { id: "responses", label: "Responses", icon: "responses" },
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
  <!-- Fixed-height tile. On hover it scales up from its own center (transforms
       don't reflow, so it pops OVER its neighbors on every side instead of
       pushing them) and lifts above the grid via z-index. -->
  <li
    class="group relative flex h-80 flex-col overflow-hidden rounded-xl border border-ink-200 bg-white p-5 shadow-card transition duration-200 ease-soft hover:z-30 hover:scale-[1.04] hover:border-ink-300 hover:shadow-pop"
  >
    <!-- Header: title left, actions right (fade in on hover / focus) -->
    <div class="flex shrink-0 items-start justify-between gap-2">
      <router-link
        :to="{ name: 'builder', params: { id: form.id } }"
        class="line-clamp-2 min-w-0 text-lg font-bold leading-snug text-ink-900 transition-colors duration-200 group-hover:text-brand-700"
      >
        {{ form.title }}
      </router-link>

      <div class="-mr-1.5 -mt-1.5 flex shrink-0 items-center gap-0.5">
        <div
          class="flex items-center gap-0.5 opacity-100 transition-opacity duration-150 focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Edit form"
            title="Edit form"
            @click="emit('action', 'edit')"
          >
            <UiIcon name="pencil-square" class="text-inherit h-5 w-5" />
          </button>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Open form"
            :title="needsPublishTitle() ?? 'Open form'"
            :disabled="!form.published"
            @click="emit('action', 'open')"
          >
            <UiIcon
              name="arrow-top-right-on-square"
              class="text-inherit h-5 w-5"
            />
          </button>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Email form"
            :title="needsPublishTitle() ?? 'Email form'"
            :disabled="!form.published"
            @click="emit('action', 'email')"
          >
            <UiIcon name="envelope" class="text-inherit h-5 w-5" />
          </button>
        </div>
        <UiActionMenu
          class="shrink-0"
          :items="moreActions()"
          :label="`More actions for ${form.title}`"
          @select="emit('action', $event)"
        />
      </div>
    </div>

    <!-- The paper: this form's first questions. flex-1 + min-h-0 lets it absorb
         the slack and clip gracefully, so the metrics below are never clipped. -->
    <FormCardPreview
      :fields="form.previewFields"
      class="mt-6 min-h-0 flex-1 overflow-hidden"
    />

    <!-- Quiet metrics — pinned to the bottom so every tile lines up -->
    <div
      class="flex shrink-0 items-baseline gap-4 border-t border-ink-100 pt-6 text-sm text-ink-900"
    >
      <span>
        <span class="font-semibold tabular-nums text-ink-800">{{
          form.responseCount
        }}</span>
        response{{ form.responseCount === 1 ? "" : "s" }}
      </span>
      <span>
        <span class="font-semibold tabular-nums text-ink-800">{{
          form.viewCount
        }}</span>
        view{{ form.viewCount === 1 ? "" : "s" }}
      </span>
    </div>

    <!-- Meta: type + status badges, then last edit. -->
    <div class="mt-6 flex shrink-0 flex-wrap items-center gap-2 text-sm text-ink-500">
      <UiBadge v-if="form.category" variant="brand">
        {{ form.category }}
      </UiBadge>
      <UiBadge :variant="form.published ? 'green' : 'gray'" dot>
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
