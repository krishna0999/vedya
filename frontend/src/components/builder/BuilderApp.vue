<script setup lang="ts">
// The builder: palette → canvas → config panel, with an Edit/Preview toggle.
// Preview is literally <FormRenderer> fed the draft (as a preview FormVersion),
// so builder and renderer can never drift. Persistence (autosave + publish) is
// driven by the builder store; this shell surfaces its status.
import { computed, ref } from "vue";
import {
  onBeforeRouteLeave,
  useRouter,
  type RouteLocationNormalized,
} from "vue-router";
import { useBuilderStore } from "@/stores/builder";
import FieldPalette from "./FieldPalette.vue";
import BuilderCanvas from "./BuilderCanvas.vue";
import FieldConfigPanel from "./FieldConfigPanel.vue";
import FormSettingsPanel from "./FormSettingsPanel.vue";
import FormRenderer from "@/components/FormRenderer.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiConfirmDialog from "@/components/ui/UiConfirmDialog.vue";
import UiIcon from "@/components/ui/UiIcon.vue";

const router = useRouter();
const builder = useBuilderStore();
const mode = ref<"edit" | "preview">("edit");
const previewSubmission = ref<Record<string, unknown> | null>(null);

// Below lg the palette/config columns collapse into bottom sheets; these drive
// the palette and form-settings ones (field config opens off the selection).
const paletteOpen = ref(false);
const settingsOpen = ref(false);
function closeSheets(): void {
  paletteOpen.value = false;
  settingsOpen.value = false;
  builder.select(null);
}

function setMode(next: "edit" | "preview"): void {
  mode.value = next;
  if (next === "preview") builder.select(null);
  paletteOpen.value = false;
  settingsOpen.value = false;
  previewSubmission.value = null;
}

function modeBtnClass(m: "edit" | "preview"): string {
  return mode.value === m
    ? "bg-white text-ink-900 shadow-sm"
    : "text-ink-500 hover:text-ink-800";
}
function onPreviewSubmit(answers: Record<string, unknown>): void {
  previewSubmission.value = answers;
}

const saveLabel = computed(() => {
  switch (builder.saveStatus) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    default:
      return "";
  }
});

const canPublish = computed(
  () =>
    builder.draft.fields.length > 0 && builder.publishStatus !== "publishing",
);
const publicUrl = computed(
  () => `${window.location.origin}/f/${builder.draft.id}`,
);

const copied = ref(false);
async function copyLink(): Promise<void> {
  await navigator.clipboard.writeText(publicUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

// In edit mode the publish CTA reads as "Save form" — same action underneath
// (flush draft + snapshot a new published version).
const publishLabel = computed(() => {
  if (builder.publishStatus === "publishing")
    return mode.value === "edit" ? "Saving…" : "Publishing…";
  return mode.value === "edit" ? "Save form" : "Publish";
});

// Confirm before saving edits over the published form; publish directly when
// there's nothing new to save.
const saveConfirmOpen = ref(false);
function onPublishClick(): void {
  if (mode.value === "edit" && builder.dirty) saveConfirmOpen.value = true;
  else void builder.publish();
}
function confirmSave(): void {
  saveConfirmOpen.value = false;
  void builder.publish();
}

// Leaving the builder with unsaved (unpublished) edits asks first.
const leaveTo = ref<RouteLocationNormalized | null>(null);
onBeforeRouteLeave((to) => {
  if (!builder.dirty || leaveTo.value) return true;
  leaveTo.value = to;
  return false;
});
function confirmLeave(): void {
  const to = leaveTo.value;
  if (to) void router.push(to);
}
</script>

<template>
  <div class="flex h-full flex-col bg-ink-50 text-ink-900">
    <header class="border-b border-ink-200 bg-white">
      <div
        class="flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5"
      >
        <div class="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span class="truncate text-sm font-semibold text-ink-900">{{
            builder.draft.title
          }}</span>
          <span class="hidden shrink-0 text-sm text-ink-500 md:inline"
            >· {{ builder.draft.fields.length }} fields</span
          >
          <span
            v-if="saveLabel"
            class="hidden shrink-0 text-sm sm:inline"
            :class="
              builder.saveStatus === 'error' ? 'text-danger' : 'text-ink-500'
            "
            >· {{ saveLabel }}</span
          >
        </div>

        <!-- Edit/Preview toggle rides the header on md+; below, it gets its own
             full-width row so the title and actions aren't crushed. -->
        <div
          class="hidden shrink-0 rounded-lg border border-ink-200 bg-ink-50 p-0.5 text-sm md:inline-flex"
        >
          <button
            type="button"
            class="rounded-md px-3 py-1 font-medium transition-colors"
            :class="modeBtnClass('edit')"
            @click="setMode('edit')"
          >
            Edit
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 font-medium transition-colors"
            :class="modeBtnClass('preview')"
            @click="setMode('preview')"
          >
            Preview
          </button>
        </div>

        <div class="flex shrink-0 items-center gap-1.5">
          <UiButton
            variant="ghost"
            size="sm"
            aria-label="Responses"
            @click="
              $router.push({
                name: 'responses',
                params: { id: builder.draft.id },
              })
            "
          >
            <UiIcon name="list-bullet" class="text-inherit h-4 w-4" />
            <span class="hidden sm:inline">Responses</span>
          </UiButton>
          <UiButton size="sm" :disabled="!canPublish" @click="onPublishClick">
            {{ publishLabel }}
          </UiButton>
        </div>
      </div>

      <div class="px-3 pb-2 md:hidden">
        <div
          class="flex rounded-lg border border-ink-200 bg-ink-50 p-0.5 text-sm"
        >
          <button
            type="button"
            class="flex-1 rounded-md py-1 font-medium transition-colors"
            :class="modeBtnClass('edit')"
            @click="setMode('edit')"
          >
            Edit
          </button>
          <button
            type="button"
            class="flex-1 rounded-md py-1 font-medium transition-colors"
            :class="modeBtnClass('preview')"
            @click="setMode('preview')"
          >
            Preview
          </button>
        </div>
      </div>
    </header>

    <!-- Post-publish share banner -->
    <div
      v-if="builder.publishStatus === 'published'"
      class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-brand-100 bg-brand-50 px-4 py-2 text-sm"
    >
      <span class="font-medium text-brand-800"
        >Published{{
          builder.lastPublished ? ` · v${builder.lastPublished.version}` : ""
        }}.</span
      >
      <code
        class="truncate rounded bg-white px-2 py-0.5 text-sm text-ink-600 ring-1 ring-ink-200"
        >{{ publicUrl }}</code
      >
      <button
        type="button"
        class="text-sm font-medium text-brand-700 hover:text-brand-800"
        @click="copyLink"
      >
        {{ copied ? "Copied!" : "Copy link" }}
      </button>
      <a
        :href="publicUrl"
        target="_blank"
        rel="noopener"
        class="text-sm font-medium text-brand-700 hover:text-brand-800"
        >Open ↗</a
      >
      <button
        type="button"
        class="ml-auto shrink-0 rounded-lg p-1 text-brand-700 transition hover:bg-brand-100 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        aria-label="Dismiss published banner"
        @click="builder.publishStatus = 'idle'"
      >
        <UiIcon name="x-mark" class="text-inherit h-4 w-4" />
      </button>
    </div>
    <p
      v-else-if="builder.publishStatus === 'error'"
      class="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-danger"
    >
      {{ builder.error ?? "Publish failed." }}
    </p>

    <!-- EDIT -->
    <div v-if="mode === 'edit'" class="flex min-h-0 flex-1 flex-col">
      <!-- Mobile toolbar: entry points for the palette/settings sheets. -->
      <div
        class="flex items-center gap-2 border-b border-ink-200 bg-white px-3 py-2 lg:hidden"
      >
        <UiButton
          variant="secondary"
          size="sm"
          class="flex-1"
          @click="paletteOpen = true"
        >
          <span class="text-base leading-none">+</span> Add field
        </UiButton>
        <UiButton variant="ghost" size="sm" @click="settingsOpen = true">
          <UiIcon name="cog-6-tooth" class="text-inherit h-5 w-5" />
          Form settings
        </UiButton>
      </div>

      <div class="flex min-h-0 flex-1">
        <FieldPalette
          class="hidden w-64 shrink-0 border-r border-ink-200 lg:block"
        />
        <main
          class="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6"
          @click.self="builder.select(null)"
        >
          <BuilderCanvas />
        </main>
        <aside
          class="hidden w-80 shrink-0 overflow-y-auto border-l border-ink-200 bg-white p-4 lg:block"
        >
          <FieldConfigPanel
            v-if="builder.selectedField"
            :key="builder.selectedField.id"
            :field="builder.selectedField"
          />
          <FormSettingsPanel v-else />
        </aside>
      </div>
    </div>

    <!-- PREVIEW -->
    <div v-else class="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:p-8">
      <div class="mx-auto max-w-xl">
        <div
          v-if="builder.draft.fields.length === 0"
          class="rounded-2xl border border-ink-200 bg-white p-10 text-center text-ink-500"
        >
          Add some fields to preview the form.
        </div>
        <div
          v-else
          class="rounded-2xl border border-ink-200 bg-white p-8 shadow-card"
        >
          <FormRenderer
            :version="builder.previewVersion"
            :title="builder.draft.title"
            @submit="onPreviewSubmit"
          />
        </div>

        <section v-if="previewSubmission" class="mt-6">
          <h2
            class="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-500"
          >
            Validated submission (preview)
          </h2>
          <pre
            class="overflow-x-auto rounded-xl bg-ink-900 p-4 text-sm leading-relaxed text-brand-200"
            >{{ JSON.stringify(previewSubmission, null, 2) }}</pre
          >
        </section>
      </div>
    </div>

    <!-- Mobile bottom sheets (lg:hidden) — the palette/config columns collapse
         into these below lg so the canvas keeps the full width. -->
    <transition
      enter-active-class="transition-opacity duration-200 ease-soft"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-soft"
      leave-to-class="opacity-0"
    >
      <div
        v-if="
          mode === 'edit' &&
          (paletteOpen || settingsOpen || !!builder.selectedField)
        "
        class="fixed inset-0 z-40 bg-ink-900/40 lg:hidden"
        @click="closeSheets"
      ></div>
    </transition>

    <!-- Add field -->
    <transition
      enter-active-class="transition-transform duration-200 ease-soft"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-150 ease-soft"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="mode === 'edit' && paletteOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Add a field"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-white shadow-pop lg:hidden"
        @keydown.escape="paletteOpen = false"
      >
        <div
          class="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-ink-200"
          aria-hidden="true"
        ></div>
        <div class="flex shrink-0 items-center justify-between px-4 py-2.5">
          <span class="text-sm font-semibold text-ink-900">Add a field</span>
          <button
            type="button"
            class="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Close"
            @click="paletteOpen = false"
          >
            <UiIcon name="x-mark" class="text-inherit h-5 w-5" />
          </button>
        </div>
        <FieldPalette
          class="min-h-0 flex-1 border-t border-ink-100"
          @add="paletteOpen = false"
        />
      </div>
    </transition>

    <!-- Field settings (opens off the canvas selection) -->
    <transition
      enter-active-class="transition-transform duration-200 ease-soft"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-150 ease-soft"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="
          mode === 'edit' &&
          builder.selectedField &&
          !paletteOpen &&
          !settingsOpen
        "
        role="dialog"
        aria-modal="true"
        aria-label="Field settings"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-white shadow-pop lg:hidden"
        @keydown.escape="builder.select(null)"
      >
        <div
          class="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-ink-200"
          aria-hidden="true"
        ></div>
        <div class="flex shrink-0 items-center justify-between px-4 py-2.5">
          <span class="text-sm font-semibold text-ink-900">Field settings</span>
          <button
            type="button"
            class="text-sm font-medium text-brand-700 hover:text-brand-800"
            @click="builder.select(null)"
          >
            Done
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto border-t border-ink-100 p-4">
          <FieldConfigPanel
            :key="builder.selectedField.id"
            :field="builder.selectedField"
          />
        </div>
      </div>
    </transition>

    <!-- Form settings -->
    <transition
      enter-active-class="transition-transform duration-200 ease-soft"
      enter-from-class="translate-y-full"
      leave-active-class="transition-transform duration-150 ease-soft"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="mode === 'edit' && settingsOpen"
        role="dialog"
        aria-modal="true"
        aria-label="Form settings"
        class="fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-2xl bg-white shadow-pop lg:hidden"
        @keydown.escape="settingsOpen = false"
      >
        <div
          class="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-ink-200"
          aria-hidden="true"
        ></div>
        <div class="flex shrink-0 items-center justify-between px-4 py-2.5">
          <span class="text-sm font-semibold text-ink-900">Form settings</span>
          <button
            type="button"
            class="text-sm font-medium text-brand-700 hover:text-brand-800"
            @click="settingsOpen = false"
          >
            Done
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto border-t border-ink-100 p-4">
          <FormSettingsPanel />
        </div>
      </div>
    </transition>

    <UiConfirmDialog
      :open="saveConfirmOpen"
      title="Save form"
      message="This saves your edits and updates the live form — everyone with the link will see the new version. Continue?"
      confirm-label="Save form"
      confirm-variant="primary"
      cancel-label="Keep editing"
      @confirm="confirmSave"
      @cancel="saveConfirmOpen = false"
    />

    <UiConfirmDialog
      :open="leaveTo !== null"
      title="Unsaved changes"
      message="Your edits haven't been saved to the form yet. Are you sure you want to leave without saving?"
      confirm-label="Leave without saving"
      cancel-label="Keep editing"
      @confirm="confirmLeave"
      @cancel="leaveTo = null"
    />
  </div>
</template>
