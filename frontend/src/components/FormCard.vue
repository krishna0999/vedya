<script setup lang="ts">
// One card in the "My forms" grid. Presentation only — every action is
// emitted up to the page, which owns navigation, clipboard, and deletion.
import type { FormSummary } from "@/api/client";
import { relativeTime } from "@/lib/time";
import UiActionMenu, {
  type UiActionItem,
} from "@/components/ui/UiActionMenu.vue";
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
  <li
    class="group relative flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card transition-all duration-200 hover:z-20 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-md focus-within:z-20"
    :style="{
      borderLeftWidth: '3px',
      borderLeftColor: form.primaryColor,
    }"
  >
    <!-- Header: title + status, actions on the right -->
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <router-link
          :to="{ name: 'builder', params: { id: form.id } }"
          class="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900 transition-colors group-hover:text-brand-700"
        >
          {{ form.title }}
        </router-link>
        <span
          v-if="form.published"
          class="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-sm font-medium text-green-700"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
          Published
        </span>
        <span
          v-else
          class="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-ink-100 px-2 py-0.5 text-sm font-medium text-ink-500"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-ink-400" />
          Draft
        </span>
      </div>

      <div class="flex shrink-0 items-center gap-0.5">
        <!-- Quick actions — fade in on hover / keyboard focus -->
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
          class="-mr-1 shrink-0"
          :items="moreActions()"
          :label="`More actions for ${form.title}`"
          @select="emit('action', $event)"
        />
      </div>
    </div>

    <!-- Prominent inline metrics -->
    <div class="flex items-center gap-5">
      <div class="flex items-baseline gap-1.5">
        <span class="text-2xl font-semibold tabular-nums text-ink-900">{{
          form.responseCount
        }}</span>
        <span class="text-sm text-ink-500"
          >response{{ form.responseCount === 1 ? "" : "s" }}</span
        >
      </div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-2xl font-semibold tabular-nums text-ink-900">{{
          form.viewCount
        }}</span>
        <span class="text-sm text-ink-500"
          >view{{ form.viewCount === 1 ? "" : "s" }}</span
        >
      </div>
    </div>

    <p class="flex items-center gap-1.5 text-sm text-ink-500">
      <UiIcon name="calendar" class="h-5 w-5" />
      Edited {{ relativeTime(form.updatedAt) }}
      <!-- Copy feedback lands here since the menu closes on select -->
      <span v-if="copied" class="font-medium text-brand-700"
        >· Link copied!</span
      >
    </p>
  </li>
</template>
