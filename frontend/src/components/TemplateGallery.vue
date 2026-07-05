<script setup lang="ts">
// Inline template gallery (ROADMAP Phase 1). Rendered as a view inside the
// dashboard content area (not a modal) — the sidebar switches to it. Filtering is
// driven by the shared topbar search (`query` prop) plus a local category filter.
// Product-chrome only (ink/brand tokens); never touches form theme.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { api, type TemplateSummary } from "@/api/client";
import { metaFor } from "@/data/fieldTypes";
import UiButton from "@/components/ui/UiButton.vue";

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
function openPreview(id: string): void {
  previewId.value = id;
}
function closePreview(): void {
  previewId.value = null;
}
function fieldTypeLabel(type: string): string {
  return metaFor(type as never)?.label ?? type;
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
    if (activeCategory.value && t.category !== activeCategory.value) return false;
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });
});

function questionSummary(t: TemplateSummary): string {
  const types = [...new Set(t.fields.map((f) => metaFor(f.type)?.label ?? f.type))];
  return types.slice(0, 3).join(" · ");
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
    error.value = err instanceof Error ? err.message : "Failed to load templates.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <!-- Category filter -->
    <div v-if="!loading && !error" class="mb-5 flex flex-wrap gap-1.5">
      <button
        type="button"
        :class="[
          'rounded-full px-3 py-1 text-xs font-medium transition',
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
          'rounded-full px-3 py-1 text-xs font-medium transition',
          activeCategory === cat
            ? 'bg-brand-600 text-white'
            : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
        ]"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <p v-if="loading" class="py-16 text-center text-sm text-ink-400">
      Loading templates…
    </p>
    <p
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>
    <p
      v-else-if="filtered.length === 0"
      class="py-16 text-center text-sm text-ink-400"
    >
      No templates match your search.
    </p>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="t in filtered"
        :key="t.id"
        class="flex flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition hover:border-ink-300"
      >
        <div class="text-2xl" aria-hidden="true">{{ t.icon }}</div>
        <h3 class="mt-2 font-semibold text-ink-900">{{ t.title }}</h3>
        <p class="mt-1 flex-1 text-sm text-ink-500">{{ t.description }}</p>
        <p class="mt-3 text-[11px] font-medium uppercase tracking-wide text-ink-400">
          {{ t.category }} · {{ t.fieldCount }} question{{ t.fieldCount === 1 ? "" : "s" }}
        </p>
        <p class="mt-1 truncate text-xs text-ink-400">{{ questionSummary(t) }}</p>
        <div class="mt-4 flex items-center gap-2">
          <UiButton
            variant="secondary"
            size="sm"
            @click="openPreview(t.id)"
          >
            Preview
          </UiButton>
          <UiButton size="sm" :disabled="busy" @click="onUse(t.id)">
            {{ pendingId === t.id ? "Creating…" : "Use template" }}
          </UiButton>
        </div>
      </div>
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
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl"
      >
        <!-- Header -->
        <header
          class="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-4"
        >
          <div class="min-w-0">
            <div class="text-2xl" aria-hidden="true">{{ previewTemplate.icon }}</div>
            <h2 class="mt-1 truncate font-semibold text-ink-900">
              {{ previewTemplate.title }}
            </h2>
            <p class="text-xs text-ink-500">{{ previewTemplate.description }}</p>
            <p
              class="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-400"
            >
              {{ previewTemplate.category }} ·
              {{ previewTemplate.fieldCount }} question{{
                previewTemplate.fieldCount === 1 ? "" : "s"
              }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Close preview"
            @click="closePreview"
          >
            <svg viewBox="0 0 20 20" fill="none" class="h-5 w-5">
              <path
                d="M6 6l8 8M14 6l-8 8"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>

        <!-- Field review -->
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ol class="space-y-3">
            <li
              v-for="(field, i) in previewTemplate.fields"
              :key="field.id"
              class="rounded-xl border border-ink-100 bg-ink-50 p-3"
            >
              <div class="flex items-baseline justify-between gap-2">
                <span class="text-sm font-medium text-ink-900">
                  <span class="text-ink-400">{{ i + 1 }}.</span>
                  {{ field.label }}
                  <span v-if="field.required" class="text-danger">*</span>
                </span>
                <span
                  class="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500"
                >
                  {{ fieldTypeLabel(field.type) }}
                </span>
              </div>
              <p v-if="field.description" class="mt-1 text-xs text-ink-500">
                {{ field.description }}
              </p>
              <ul
                v-if="field.options && field.options.length"
                class="mt-2 flex flex-wrap gap-1"
              >
                <li
                  v-for="o in field.options"
                  :key="o.id"
                  class="rounded-md bg-white px-2 py-0.5 text-xs text-ink-600 ring-1 ring-ink-200"
                >
                  {{ o.label }}
                </li>
              </ul>
            </li>
          </ol>
        </div>

        <!-- Footer -->
        <footer
          class="flex items-center justify-end gap-2 border-t border-ink-200 px-5 py-3"
        >
          <UiButton variant="ghost" @click="closePreview">Close</UiButton>
          <UiButton :disabled="busy" @click="onUse(previewTemplate.id)">
            {{ pendingId === previewTemplate.id ? "Creating…" : "Use this template" }}
          </UiButton>
        </footer>
      </aside>
    </transition>
  </div>
</template>
