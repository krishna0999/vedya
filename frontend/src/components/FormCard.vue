<script setup lang="ts">
import type { FormSummary } from "@/api/client";
import { relativeTime } from "@/lib/time";
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

function needsPublishTitle(): string | undefined {
  return props.form.published ? undefined : "Publish the form to get a link";
}

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
  <li
    class="group relative flex flex-col rounded-md border border-line-200 bg-white p-5 transition-colors duration-150 ease-soft hover:z-30 hover:border-line-300"
      >
    <!-- Header: title left, actions right (fade in on hover / focus) -->
    <div class="flex shrink-0 items-start justify-between gap-2">
      <!-- The form's colour, as one small mark: identity without decoration. -->
      <div class="flex min-w-0 items-start gap-2.5">
        <span
          class="mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ background: form.primaryColor }"
          aria-hidden="true"
        ></span>
        <router-link
          :to="{ name: 'builder', params: { id: form.id } }"
          draggable="false"
          class="line-clamp-2 min-w-0 break-words text-base font-semibold leading-snug text-ink-900 transition-colors duration-150 hover:text-brand-700"
        >
          {{ form.title }}
        </router-link>
      </div>

      <div class="-mr-1.5 -mt-1.5 flex shrink-0 items-center gap-0.5">
        <UiTooltip :text="pinned ? 'Unpin form' : 'Pin to the top'" align="end">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-md transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
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

    <!-- Quiet metrics -->
    <div
      class="mt-4 flex shrink-0 flex-wrap items-center gap-2 border-t border-line-100 pt-4 text-sm text-ink-600"
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
    <div
      class="mt-3 flex shrink-0 flex-wrap items-center gap-2 text-sm text-ink-500"
    >
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
