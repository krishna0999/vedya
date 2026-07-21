<script setup lang="ts">
// Inline template gallery (ROADMAP Phase 1). Rendered as a view inside the
// dashboard content area (not a modal) — the sidebar switches to it. Filtering is
// driven by the shared topbar search (`query` prop) plus a local category filter.
// Product-chrome only (ink/brand tokens); never touches form theme.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { FormVersion } from "@schema";
import { api, type TemplateSummary } from "@/api/client";
import { useBoard } from "@/lib/board";
import { fuzzyMatchAny } from "@/lib/fuzzy";
import { DEFAULT_THEME } from "@/stores/builder";
import FormRenderer from "@/components/FormRenderer.vue";
import TemplateCard from "@/components/TemplateCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSortMenu from "@/components/ui/UiSortMenu.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const props = defineProps<{ query?: string; busy?: boolean }>();
const emit = defineEmits<{ use: [templateId: string] }>();

const templates = ref<TemplateSummary[]>([]);
const categories = ref<string[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const activeCategory = ref<string | null>(null);
// Which card was clicked — shows the busy state on just that card while the
// parent creates the form and navigates away.
const pendingId = ref<string | null>(null);

// Template being reviewed in the preview slideover (null = closed).
const previewId = ref<string | null>(null);
const previewTemplate = computed(
  () => templates.value.find((t) => t.id === previewId.value) ?? null,
);
// The preview is the real thing: <FormRenderer> fed the template's fields as an
// ad-hoc FormVersion (default theme), so what you review is exactly the form a
// respondent would see — not a list of its elements.
const previewVersion = computed<FormVersion | null>(() =>
  previewTemplate.value
    ? {
        versionId: "preview",
        formId: previewTemplate.value.id,
        version: 0,
        fields: previewTemplate.value.fields,
        theme: { ...DEFAULT_THEME },
        publishedAt: new Date().toISOString(),
      }
    : null,
);
function openPreview(id: string): void {
  previewId.value = id;
}
function closePreview(): void {
  previewId.value = null;
}
// Close the preview on Escape while it's open.
function onPreviewKey(e: KeyboardEvent): void {
  if (e.key === "Escape") closePreview();
}
watch(previewId, (id) => {
  if (id) document.addEventListener("keydown", onPreviewKey);
  else document.removeEventListener("keydown", onPreviewKey);
});
onBeforeUnmount(() => document.removeEventListener("keydown", onPreviewKey));

const filtered = computed(() => {
  const q = (props.query ?? "").trim().toLowerCase();
  return templates.value.filter((t) => {
    if (activeCategory.value && t.category !== activeCategory.value)
      return false;
    if (!q) return true;
    return fuzzyMatchAny([t.title, t.description, t.category], q);
  });
});

// Sort control. "Recommended" keeps the catalog's curated order (a no-op copy);
// the others sort a copy so the source order is preserved. "My order" replays
// the user's own drag arrangement.
const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "manual", label: "My order" },
  { id: "title", label: "Title (A–Z)" },
  { id: "most", label: "Most questions" },
  { id: "fewest", label: "Fewest questions" },
];
const sortBy = ref("recommended");
// Pinned templates float to the top of whichever sort is active.
const board = useBoard("templates");
// Pulled out so the template unwraps it (nested refs aren't auto-unwrapped).
const dragId = board.dragId;
const sorted = computed(() => {
  const list = [...filtered.value];
  switch (sortBy.value) {
    case "title":
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "most":
      list.sort((a, b) => b.fieldCount - a.fieldCount);
      break;
    case "fewest":
      list.sort((a, b) => a.fieldCount - b.fieldCount);
      break;
  }
  return board.arrange(list, sortBy.value === "manual");
});

// Reordering is an explicit arrangement, so it switches the view to "My order"
// — otherwise the drop would appear to do nothing under another sort.
function reorder(fn: () => void): void {
  fn();
  sortBy.value = "manual";
}

function onUse(id: string): void {
  pendingId.value = id;
  emit("use", id);
}

// If creation fails, the parent flips busy back off — clear the per-card spinner.
watch(
  () => props.busy,
  (b) => {
    if (!b) pendingId.value = null;
  },
);

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const catalog = await api.listTemplates();
    templates.value = catalog.templates;
    categories.value = catalog.categories;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Failed to load templates.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <!-- Category filter (left) + sort (right) -->
    <div
      v-if="!loading && !error"
      class="mb-5 flex items-start justify-between gap-3"
    >
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          :class="[
            'rounded-full px-3 py-1 text-sm font-medium transition',
            activeCategory === null
              ? 'bg-brand-600 text-white'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
          ]"
          @click="activeCategory = null"
        >
          All
        </button>
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          :class="[
            'rounded-full px-3 py-1 text-sm font-medium transition',
            activeCategory === cat
              ? 'bg-brand-600 text-white'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
          ]"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
      <UiSortMenu v-model="sortBy" :options="SORT_OPTIONS" class="shrink-0" />
    </div>

    <!-- Skeleton mirror of the pills row + card grid -->
    <div v-if="loading" role="status">
      <span class="sr-only">Loading templates…</span>
      <div class="mb-5 flex flex-wrap gap-1.5">
        <UiSkeleton v-for="n in 5" :key="n" class="h-7 w-20 rounded-full" />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="n in 6"
          :key="n"
          class="flex h-80 flex-col rounded-xl border border-ink-200 bg-white p-5"
        >
          <UiSkeleton class="h-4 w-2/3" />
          <UiSkeleton class="mt-2 h-3.5 w-full" />
          <UiSkeleton class="mt-1.5 h-3.5 w-4/5" />
          <UiSkeleton class="mt-4 h-3 w-24" />
          <UiSkeleton class="mt-2 h-3 w-3/5" />
          <UiSkeleton class="mt-auto h-3.5 w-40" />
          <div class="mt-3 flex gap-2">
            <UiSkeleton class="h-8 w-20 rounded-lg" />
            <UiSkeleton class="h-8 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
    <p
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>
    <p
      v-else-if="filtered.length === 0"
      class="py-16 text-center text-sm text-ink-500"
    >
      No templates match your search.
    </p>

    <div
      v-else
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <TemplateCard
        v-for="t in sorted"
        :key="t.id"
        :template="t"
        :busy="busy"
        :pending="pendingId === t.id"
        :pinned="board.isPinned(t.id)"
        :class="dragId === t.id ? 'opacity-50' : ''"
        draggable="true"
        @dragstart="board.onDragStart(t.id)"
        @dragover.prevent
        @drop="reorder(() => board.onDrop(t.id, sorted))"
        @dragend="board.onDragEnd"
        @preview="openPreview(t.id)"
        @use="onUse(t.id)"
        @pin="board.togglePin(t.id)"
        @move="reorder(() => board.move(t.id, $event, sorted))"
      />
    </div>

    <!-- Preview slideover: review a template's fields before using it -->
    <transition
      enter-active-class="transition-opacity duration-200 ease-soft"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-soft"
      leave-to-class="opacity-0"
    >
      <div
        v-if="previewTemplate"
        class="fixed inset-0 z-40 bg-ink-900/40"
        @click="closePreview"
      ></div>
    </transition>
    <transition
      enter-active-class="transition-transform duration-200 ease-soft"
      enter-from-class="translate-x-full"
      leave-active-class="transition-transform duration-150 ease-soft"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="previewTemplate"
        role="dialog"
        aria-modal="true"
        :aria-label="`Preview: ${previewTemplate.title}`"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-xl"
      >
        <!-- Header -->
        <header
          class="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-4"
        >
          <div class="min-w-0">
            <div class="text-2xl" aria-hidden="true">
              {{ previewTemplate.icon }}
            </div>
            <h2 class="mt-1 truncate font-semibold text-ink-900">
              {{ previewTemplate.title }}
            </h2>
            <p class="text-sm text-ink-500">
              {{ previewTemplate.description }}
            </p>
            <p
              class="mt-1 text-sm font-medium uppercase tracking-wide text-ink-500"
            >
              {{ previewTemplate.category }} ·
              {{ previewTemplate.fieldCount }} question{{
                previewTemplate.fieldCount === 1 ? "" : "s"
              }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Close preview"
            @click="closePreview"
          >
            <UiIcon name="x-mark" class="text-inherit h-5 w-5" />
          </button>
        </header>

        <!-- Live form preview: what a respondent would actually see -->
        <div class="min-h-0 flex-1 overflow-y-auto bg-ink-50 px-4 py-5 sm:px-5">
          <div
            v-if="previewVersion"
            class="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
          >
            <FormRenderer
              :key="previewVersion.formId"
              :version="previewVersion"
              :title="previewTemplate.title"
            />
          </div>
        </div>

        <!-- Footer -->
        <footer
          class="flex items-center justify-end gap-2 border-t border-ink-200 px-5 py-3"
        >
          <UiButton variant="ghost" @click="closePreview">Close</UiButton>
          <UiButton :disabled="busy" @click="onUse(previewTemplate.id)">
            {{
              pendingId === previewTemplate.id
                ? "Creating…"
                : "Use this template"
            }}
          </UiButton>
        </footer>
      </aside>
    </transition>
  </div>
</template>
