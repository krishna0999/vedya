<script setup lang="ts">
// Inline template gallery (ROADMAP Phase 1). Rendered as a view inside the
// dashboard content area (not a modal) — the sidebar switches to it. Filtering is
// driven by the shared topbar search (`query` prop) plus a local category filter.
// Product-chrome only (ink/brand tokens); never touches form theme.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { FormVersion } from "@schema";
import { api, type TemplateSummary } from "@/api/client";
import { useBoard } from "@/lib/board";
import { categoryShort, categoryStyle } from "@/lib/categories";
import { fuzzyMatchAny } from "@/lib/fuzzy";
import { DEFAULT_THEME } from "@/stores/builder";
import FormRenderer from "@/components/FormRenderer.vue";
import TemplateCard from "@/components/TemplateCard.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSearchInput from "@/components/ui/UiSearchInput.vue";
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
// ponytail: ~15s per question, rounded up — same estimate the card shows.
const previewEstMinutes = computed(() =>
  Math.max(1, Math.ceil(((previewTemplate.value?.fieldCount ?? 0) * 15) / 60)),
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

// Local search box. Seeded from the deep-link ?q= (the global palette can land
// you here with a query) and kept in sync with it, but typed into directly —
// on a phone the topbar's ⌘K palette is two taps away from a filter you want
// to nudge one character at a time.
const search = ref(props.query ?? "");
watch(
  () => props.query,
  (q) => (search.value = q ?? ""),
);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
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
    <!-- Search, then the count/sort line, then the category filter. Search sits
         first because "I know what I want" is the common case at 101 templates. -->
    <div v-if="!loading && !error" class="mb-4 sm:mb-5">
      <UiSearchInput
        v-model="search"
        class="mb-3"
        placeholder="Search templates…"
        aria-label="Search templates"
      />

      <div class="mb-2 flex items-center justify-between gap-3">
        <p class="min-w-0 truncate text-sm text-ink-500">
          <span class="font-medium text-ink-800">{{ filtered.length }}</span>
          template{{ filtered.length === 1 ? "" : "s" }}
          <span class="hidden sm:inline">
            ·
            <span class="font-medium text-ink-800">{{ categories.length }}</span>
            categories
          </span>
        </p>
        <UiSortMenu v-model="sortBy" :options="SORT_OPTIONS" class="shrink-0" />
      </div>

      <!-- ONE row of pills. On mobile it scrolls horizontally (bleeding to the
           screen edge so the last pill is visibly cut off — that's the affordance
           saying "keep swiping"); from sm up it wraps like before. Pills are
           monochrome: the category accent is the *cards'* language, and fifteen
           colored pills competing above them is what made this row noisy. -->
      <div
        class="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          :class="[
            'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
            activeCategory === null
              ? 'bg-ink-800 text-white'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
          ]"
          :aria-pressed="activeCategory === null"
          @click="activeCategory = null"
        >
          All
        </button>
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          :class="
            activeCategory === cat
              ? 'bg-ink-800 text-white'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
          "
          :aria-pressed="activeCategory === cat"
          :aria-label="cat"
          @click="activeCategory = cat"
        >
          <UiIcon
            :name="categoryStyle(cat).icon"
            class="text-inherit h-4 w-4 shrink-0"
          />
          {{ categoryShort(cat) }}
        </button>
      </div>
    </div>

    <!-- Skeleton mirror of the pills row + card grid -->
    <div v-if="loading" role="status">
      <span class="sr-only">Loading templates…</span>
      <UiSkeleton class="mb-3 h-[2.375rem] w-full rounded-md" />
      <div class="mb-4 flex gap-1.5 overflow-hidden sm:mb-5 sm:flex-wrap">
        <UiSkeleton
          v-for="n in 5"
          :key="n"
          class="h-8 w-20 shrink-0 rounded-full"
        />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="n in 6"
          :key="n"
          class="flex h-[22rem] flex-col rounded-md border border-t-4 border-line-200 bg-white px-5 py-4"
        >
          <UiSkeleton class="h-9 w-9 rounded-md" />
          <UiSkeleton class="mt-2.5 h-4 w-2/3" />
          <UiSkeleton class="mt-2 h-3.5 w-full" />
          <UiSkeleton class="mt-1.5 h-3.5 w-4/5" />
          <UiSkeleton class="mt-2.5 h-[6.125rem] w-full rounded-md" />
          <UiSkeleton class="mt-2.5 h-3.5 w-40" />
          <div class="mt-2.5 flex gap-2">
            <UiSkeleton class="h-8 w-20 rounded-md" />
            <UiSkeleton class="h-8 w-28 rounded-md" />
          </div>
        </div>
      </div>
    </div>
    <p
      v-else-if="error"
      class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
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
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-t-4 bg-white shadow-xl"
        :style="{ borderTopColor: categoryStyle(previewTemplate.category).accent }"
      >
        <!-- Header: the same identity the card shows — icon chip in the
             category accent, then the facts we actually have. No rating or
             download count: nothing measures those yet, and inventing them
             would be fabricated social proof on our own product. -->
        <header
          class="flex items-start justify-between gap-3 border-b border-line-200 px-5 py-4"
          :style="{
            '--drawer-accent': categoryStyle(previewTemplate.category).accent,
          }"
        >
          <div class="flex min-w-0 gap-3">
            <span
              class="grid h-12 w-12 shrink-0 place-items-center rounded-md text-2xl leading-none"
              style="
                background: color-mix(in srgb, var(--drawer-accent) 12%, white);
              "
              aria-hidden="true"
              >{{ previewTemplate.icon }}</span
            >
            <div class="min-w-0">
              <h2 class="truncate font-semibold text-ink-900">
                {{ previewTemplate.title }}
              </h2>
              <p class="text-sm text-ink-500">
                {{ previewTemplate.description }}
              </p>
              <p
                class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500"
              >
                <span
                  class="inline-flex items-center gap-1 font-medium text-[color:var(--drawer-accent)]"
                >
                  <UiIcon
                    :name="categoryStyle(previewTemplate.category).icon"
                    class="text-inherit h-4 w-4"
                  />
                  {{ previewTemplate.category }}
                </span>
                <span class="text-ink-300">·</span>
                <span>
                  {{ previewTemplate.fieldCount }} question{{
                    previewTemplate.fieldCount === 1 ? "" : "s"
                  }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <UiIcon name="clock" class="h-4 w-4 text-ink-400" />
                  ~{{ previewEstMinutes }} min to fill
                </span>
                <span class="text-ink-300">·</span>
                <span>By Vedya</span>
                <span class="text-ink-300">·</span>
                <router-link
                  :to="{ name: 'template', params: { slug: previewTemplate.id } }"
                  class="font-medium text-brand-700 hover:text-brand-800"
                  >Full page</router-link
                >
              </p>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-md p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
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
            class="rounded-md border border-line-200 bg-white p-5 shadow-card sm:p-6"
          >
            <FormRenderer
              :key="previewVersion.formId"
              :version="previewVersion"
              :title="previewTemplate.title"
            />
          </div>
        </div>

        <!-- Footer: Back on the left (it's where you came from), the commit
             action on the right. No "Preview in new tab" / "Duplicate" — a
             template has no public URL to open, and "use" already is the
             duplicate. -->
        <footer
          class="flex items-center justify-between gap-2 border-t border-line-200 px-5 py-3"
        >
          <UiButton variant="ghost" @click="closePreview">
            <UiIcon name="chevron-left" class="text-inherit h-4 w-4" />
            Back
          </UiButton>
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
