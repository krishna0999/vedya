<script setup lang="ts">
// Global search, command-palette style: a bare input that grows into a result
// sheet as you type. Searches the two things that exist today — your forms and
// the template catalog — and navigates rather than acting, so nothing is
// created or changed from in here.
// Data is fetched once on first open and reused; the catalog is static and the
// form list is small (see the dashboard's own note on /submissions/recent).
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { api, type FormSummary, type TemplateSummary } from "@/api/client";
import { fuzzyMatchAny } from "@/lib/fuzzy";
import { relativeTime } from "@/lib/time";
import UiBadge from "@/components/ui/UiBadge.vue";
import UiIcon from "@/components/ui/UiIcon.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();

const router = useRouter();
const query = ref("");
const input = ref<HTMLInputElement | null>(null);

const forms = ref<FormSummary[]>([]);
const templates = ref<TemplateSummary[]>([]);
const loading = ref(false);
let loaded = false;

async function load(): Promise<void> {
  if (loaded) return;
  loading.value = true;
  try {
    const [f, catalog] = await Promise.all([
      api.listForms(),
      api.listTemplates(),
    ]);
    forms.value = f;
    templates.value = catalog.templates;
    loaded = true;
  } catch {
    // A failed search shows "no matches" rather than an error sheet — the page
    // behind it is still usable and will surface its own load failure.
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    query.value = "";
    load();
    await nextTick();
    input.value?.focus();
  },
);

const formHits = computed(() =>
  query.value.trim()
    ? forms.value
        .filter((f) => fuzzyMatchAny([f.title, f.category ?? ""], query.value))
        .slice(0, 6)
    : [],
);
const templateHits = computed(() =>
  query.value.trim()
    ? templates.value
        .filter((t) =>
          fuzzyMatchAny([t.title, t.description, t.category], query.value),
        )
        .slice(0, 6)
    : [],
);

// The sheet grows the moment there's a query — including while loading and on
// "no matches", so the box never resizes twice for one keystroke.
const expanded = computed(() => query.value.trim().length > 0);
const empty = computed(
  () => !loading.value && !formHits.value.length && !templateHits.value.length,
);

function close(): void {
  emit("update:open", false);
}
function openForm(form: FormSummary): void {
  close();
  router.push({ name: "builder", params: { id: form.id } });
}
// Templates land in the gallery pre-filtered rather than creating a form on
// the spot — a search result should never be a mutation.
function openTemplate(template: TemplateSummary): void {
  close();
  router.push({
    name: "forms",
    query: { view: "templates", q: template.title },
  });
}
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-150 ease-soft"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-soft"
      leave-to-class="opacity-0"
    >
      <!-- Backdrop doubles as the click-outside target -->
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/40 sm:p-4 sm:pt-[12vh]"
        @click.self="close"
        @keydown.esc="close"
      >
        <!-- Full screen on mobile; a sheet that grows on sm+. -->
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search forms and templates"
          class="flex h-full w-full flex-col overflow-hidden bg-white shadow-pop transition-[max-width,height] duration-200 ease-soft sm:h-20 sm:max-w-md sm:rounded-2xl"
          :class="expanded ? 'sm:h-[560px] sm:max-w-3xl' : ''"
        >
          <!-- Search row: bottom rule only, so the input reads as a line -->
          <div class="flex h-20 shrink-0 items-center gap-3 px-4 sm:px-5">
            <UiIcon
              name="magnifying-glass"
              class="h-5 w-5 shrink-0 text-ink-400"
            />
            <input
              ref="input"
              v-model="query"
              type="text"
              aria-label="Search forms and templates"
              placeholder="Search forms and templates…"
              class="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-0"
            />
            <button
              type="button"
              class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              aria-label="Close search"
              @click="close"
            >
              <UiIcon name="x-mark" class="text-inherit h-5 w-5" />
            </button>
          </div>

          <!-- Results: simple cards, no previews -->
          <div
            v-if="expanded"
            class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5"
          >
            <p v-if="loading" class="py-6 text-center text-sm text-ink-500">
              Searching…
            </p>
            <p v-else-if="empty" class="py-6 text-center text-sm text-ink-500">
              No forms or templates match “{{ query.trim() }}”.
            </p>

            <template v-else>
              <section v-if="formHits.length">
                <h2
                  class="pb-2 text-xs font-semibold uppercase tracking-wide text-ink-400"
                >
                  Forms
                </h2>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    v-for="f in formHits"
                    :key="f.id"
                    type="button"
                    class="rounded-xl border border-ink-200 bg-white p-3 text-left transition duration-150 ease-soft hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    @click="openForm(f)"
                  >
                    <p class="truncate text-sm font-semibold text-ink-900">
                      {{ f.title }}
                    </p>
                    <div
                      class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-500"
                    >
                      <UiBadge :variant="f.published ? 'green' : 'amber'" dot>
                        {{ f.published ? "Published" : "Draft" }}
                      </UiBadge>
                      <span
                        >{{ f.responseCount }} response{{
                          f.responseCount === 1 ? "" : "s"
                        }}</span
                      >
                      <span class="text-ink-300">·</span>
                      <span>{{ relativeTime(f.updatedAt) }}</span>
                    </div>
                  </button>
                </div>
              </section>

              <section
                v-if="templateHits.length"
                :class="formHits.length ? 'mt-4' : ''"
              >
                <h2
                  class="pb-2 text-xs font-semibold uppercase tracking-wide text-ink-400"
                >
                  Templates
                </h2>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    v-for="t in templateHits"
                    :key="t.id"
                    type="button"
                    class="rounded-xl border border-ink-200 bg-white p-3 text-left transition duration-150 ease-soft hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    @click="openTemplate(t)"
                  >
                    <p
                      class="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900"
                    >
                      <span aria-hidden="true">{{ t.icon }}</span>
                      <span class="truncate">{{ t.title }}</span>
                    </p>
                    <div
                      class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-500"
                    >
                      <UiBadge variant="gray">{{ t.category }}</UiBadge>
                      <span
                        >{{ t.fieldCount }} question{{
                          t.fieldCount === 1 ? "" : "s"
                        }}</span
                      >
                    </div>
                  </button>
                </div>
              </section>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
