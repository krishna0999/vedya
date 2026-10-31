<script setup lang="ts">
// "My forms" page: list forms, create, jump to editor / responses, share, delete.
// Accepts ?q= (deep-link from the dashboard search) and ?view=templates.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, type FormSummary } from "@/api/client";
import { useBoard } from "@/lib/board";
import { fuzzyMatchAny } from "@/lib/fuzzy";
import AiGenerateModal from "@/components/AiGenerateModal.vue";
import AppShell from "@/components/AppShell.vue";
import FormCard from "@/components/FormCard.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import TemplateGallery from "@/components/TemplateGallery.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiConfirmDialog from "@/components/ui/UiConfirmDialog.vue";
import UiFilterMenu from "@/components/ui/UiFilterMenu.vue";
import UiSortMenu from "@/components/ui/UiSortMenu.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const router = useRouter();
const route = useRoute();

const forms = ref<FormSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const creating = ref(false);
// Navbar "generate with AI" modal — same flow as the inline card, always reachable.
const aiOpen = ref(false);

// The sidebar switches between two content views in-place — templates render
// inline here, not in a modal. The view lives in the URL (?view=templates) so
// other screens (e.g. the builder's nav menu) can deep-link straight to it.
const activeView = computed<"forms" | "templates">(() =>
  route.query.view === "templates" ? "templates" : "forms",
);
function setView(view: "forms" | "templates"): void {
  router.replace({ query: view === "templates" ? { view } : {} });
}

// Client-side search over the active view. The shared AppShell topbar writes
// ?q= into the route; this page just reads it (switching views drops it).
const query = computed(() =>
  typeof route.query.q === "string" ? route.query.q : "",
);
// Status filter (Published/Draft, multi-select). Empty = show all.
const STATUS_OPTIONS = [
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
];
const statusFilter = ref<string[]>([]);
const filteredForms = computed(() => {
  const q = query.value.trim().toLowerCase();
  return forms.value.filter((f) => {
    if (q && !fuzzyMatchAny([f.title, f.category ?? ""], q)) return false;
    if (
      statusFilter.value.length &&
      !statusFilter.value.includes(f.published ? "published" : "draft")
    )
      return false;
    return true;
  });
});

// Sort control. Default "updated" matches the API's own order (updated desc),
// so it's a no-op reorder; the others sort a copy so we never mutate the source.
// "My order" replays the user's own drag arrangement.
const SORT_OPTIONS = [
  { id: "updated", label: "Last edited" },
  { id: "manual", label: "My order" },
  { id: "title", label: "Title (A–Z)" },
  { id: "responses", label: "Most responses" },
  { id: "views", label: "Most views" },
];
const sortBy = ref("updated");
// Pinned forms float to the top of whichever sort is active.
const board = useBoard("forms");
// Pulled out so the template unwraps it (nested refs aren't auto-unwrapped).
const dragId = board.dragId;
const sortedForms = computed(() => {
  const list = [...filteredForms.value];
  switch (sortBy.value) {
    case "title":
      list.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "responses":
      list.sort((a, b) => b.responseCount - a.responseCount);
      break;
    case "views":
      list.sort((a, b) => b.viewCount - a.viewCount);
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

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    forms.value = await api.listForms();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load forms.";
  } finally {
    loading.value = false;
  }
}

// "Create form" split dropdown: blank create vs. AI generate. Same
// outside-mousedown + Escape close idiom as UiActionMenu.
const createOpen = ref(false);
const createRoot = ref<HTMLElement | null>(null);
function onCreateDocPointer(e: MouseEvent): void {
  if (createRoot.value && !createRoot.value.contains(e.target as Node))
    closeCreate();
}
function closeCreate(): void {
  if (!createOpen.value) return;
  createOpen.value = false;
  document.removeEventListener("mousedown", onCreateDocPointer);
}
function toggleCreate(): void {
  if (createOpen.value) return closeCreate();
  createOpen.value = true;
  document.addEventListener("mousedown", onCreateDocPointer);
}
function pickCreate(kind: "blank" | "ai"): void {
  closeCreate();
  if (kind === "ai") aiOpen.value = true;
  else createForm();
}
onBeforeUnmount(() =>
  document.removeEventListener("mousedown", onCreateDocPointer),
);

async function createForm(): Promise<void> {
  creating.value = true;
  try {
    const draft = await api.createForm();
    router.push({ name: "builder", params: { id: draft.id } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to create form.";
    creating.value = false;
  }
}

const creatingFromTemplate = ref(false);

async function useTemplate(templateId: string): Promise<void> {
  creatingFromTemplate.value = true;
  try {
    const draft = await api.createFromTemplate(templateId);
    router.push({ name: "builder", params: { id: draft.id } });
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : "Failed to create form from template.";
    creatingFromTemplate.value = false;
  }
}

const pendingDelete = ref<FormSummary | null>(null);

async function confirmDelete(): Promise<void> {
  const form = pendingDelete.value;
  if (!form) return;
  pendingDelete.value = null;
  try {
    await api.deleteForm(form.id);
    forms.value = forms.value.filter((f) => f.id !== form.id);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to delete form.";
  }
}

const copied = ref<string | null>(null);
async function copyLink(form: FormSummary): Promise<void> {
  const url = `${window.location.origin}/f/${form.id}`;
  await navigator.clipboard.writeText(url);
  copied.value = form.id;
  setTimeout(
    () => (copied.value = copied.value === form.id ? null : copied.value),
    1500,
  );
}

// "Email form" hands off to the user's own mail client via mailto: —
// ponytail: no send-from-server until an email provider exists (§9 workflows).
function emailForm(form: FormSummary): void {
  const url = `${window.location.origin}/f/${form.id}`;
  const subject = encodeURIComponent(form.title);
  const body = encodeURIComponent(
    `Hi,\n\nPlease fill out this form: ${url}\n\nThanks!`,
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function onAction(form: FormSummary, actionId: string): void {
  switch (actionId) {
    case "edit":
      router.push({ name: "builder", params: { id: form.id } });
      break;
    case "responses":
      router.push({ name: "responses", params: { id: form.id } });
      break;
    case "copy":
      copyLink(form);
      break;
    case "email":
      emailForm(form);
      break;
    case "open":
      window.open(`/f/${form.id}`, "_blank", "noopener");
      break;
    case "pin":
      board.togglePin(form.id);
      break;
    case "move-back":
      reorder(() => board.move(form.id, -1, sortedForms.value));
      break;
    case "move-forward":
      reorder(() => board.move(form.id, 1, sortedForms.value));
      break;
    case "delete":
      pendingDelete.value = form;
      break;
  }
}

onMounted(load);
</script>

<template>
  <AppShell>
    <!-- Content — the shared AppShell topbar carries search; page actions
           (AI generate, New form) live in this heading row instead. -->
    <main class="w-full px-6 py-8">
      <!-- Title stacks above the actions on mobile so neither has to squeeze;
           the primary CTA then takes the full width (flex-1) and is an easy
           thumb target. From sm up it's the usual one-line heading row. -->
      <div
        class="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <h1 class="page-title truncate">
            {{ activeView === "templates" ? "Templates" : "Forms" }}
          </h1>
          <p v-if="activeView === 'templates'" class="page-subtitle">
            Pick a starting point — edit everything after. Nothing is locked in.
          </p>
          <p v-else class="page-subtitle">
            Everything you've built. Star the ones you use most.
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <template v-if="activeView === 'forms' && !loading && forms.length">
            <!-- count hidden on mobile so the row fits one line -->
            <span class="hidden text-sm text-ink-500 sm:inline">
              {{ filteredForms.length }} form{{
                filteredForms.length === 1 ? "" : "s"
              }}
            </span>
            <UiFilterMenu v-model="statusFilter" :options="STATUS_OPTIONS" />
            <UiSortMenu v-model="sortBy" :options="SORT_OPTIONS" compact />
          </template>

          <!-- On the templates view, surface AI generation directly: "none of
               these fit" is the most likely reason someone leaves this page. -->
          <UiButton
            v-if="activeView === 'templates'"
            variant="secondary"
            class="hidden sm:inline-flex"
            @click="aiOpen = true"
          >
            <UiIcon name="sparkles" class="text-inherit h-4 w-4" />
            Generate with AI
          </UiButton>

          <!-- Create form split dropdown: blank vs. AI generate -->
          <div
            ref="createRoot"
            class="relative flex-1 sm:flex-none"
            @keydown.escape="closeCreate"
          >
            <UiButton
              class="w-full sm:w-auto"
              :disabled="creating"
              aria-haspopup="menu"
              :aria-expanded="createOpen"
              @click="toggleCreate"
            >
              <UiIcon name="plus" class="text-inherit h-4 w-4" />
              <span>{{ creating ? "Creating…" : "Create form" }}</span>
              <UiIcon name="chevron-down" class="text-inherit h-4 w-4" />
            </UiButton>

            <transition
              enter-active-class="transition duration-150 ease-soft"
              enter-from-class="opacity-0 -translate-y-1"
              leave-active-class="transition duration-100 ease-soft"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-if="createOpen"
                role="menu"
                class="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-line-200 bg-white p-1 shadow-pop"
              >
                <button
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                  @click="pickCreate('blank')"
                >
                  <UiIcon name="plus" class="h-5 w-5 shrink-0 text-ink-500" />
                  Create form
                </button>
                <button
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                  @click="pickCreate('ai')"
                >
                  <UiIcon
                    name="sparkles"
                    class="h-5 w-5 shrink-0 text-ink-500"
                  />
                  Create form with AI
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <p
        v-if="error"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
      >
        {{ error }}
      </p>

      <!-- Templates view: inline, driven by the topbar search -->
      <TemplateGallery
        v-if="activeView === 'templates'"
        :query="query"
        :busy="creatingFromTemplate"
        @use="useTemplate"
      />

      <!-- Dashboard view: the forms list -->
      <template v-else>
        <!-- Skeleton mirror of the form-card grid (3 per row) -->
        <div
          v-if="loading"
          role="status"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          <span class="sr-only">Loading your forms…</span>
          <div
            v-for="n in 6"
            :key="n"
            class="flex h-80 flex-col rounded-xl border border-line-200 bg-white p-5"
          >
            <UiSkeleton class="h-4 w-32 max-w-[70%]" />
            <UiSkeleton class="mt-5 h-3 w-20" />
            <UiSkeleton class="mt-2 h-3 w-3/5" />
            <UiSkeleton class="mt-4 h-3 w-24" />
            <UiSkeleton class="mt-2 h-3 w-3/5" />
            <UiSkeleton class="mt-auto h-3.5 w-40" />
          </div>
        </div>

        <div
          v-else-if="forms.length === 0"
          class="rounded-2xl border border-dashed border-line-300 bg-white p-12 text-center"
        >
          <h2 class="text-lg font-semibold text-ink-900">No forms yet</h2>
          <p class="mx-auto mt-1 max-w-sm text-sm text-ink-500">
            Create your first form, add a few fields, and publish to share a
            link.
          </p>
          <div class="mt-5 flex items-center justify-center gap-2">
            <UiButton :disabled="creating" @click="createForm"
              >Create a form</UiButton
            >
            <UiButton variant="secondary" @click="setView('templates')"
              >Browse templates</UiButton
            >
          </div>
        </div>

        <div
          v-else-if="filteredForms.length === 0"
          class="py-16 text-center text-sm text-ink-500"
        >
          No forms match
          {{ query.trim() ? `“${query}”` : "the selected filters" }}.
        </div>

        <ul
          v-else
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          <FormCard
            v-for="form in sortedForms"
            :key="form.id"
            :form="form"
            :copied="copied === form.id"
            :pinned="board.isPinned(form.id)"
            :class="dragId === form.id ? 'opacity-50' : ''"
            draggable="true"
            @dragstart="board.onDragStart(form.id)"
            @dragover.prevent
            @drop="reorder(() => board.onDrop(form.id, sortedForms))"
            @dragend="board.onDragEnd"
            @action="onAction(form, $event)"
          />
        </ul>
      </template>
    </main>

    <AiGenerateModal v-model:open="aiOpen" />

    <UiConfirmDialog
      :open="pendingDelete !== null"
      title="Delete form"
      :message="`Deleting “${pendingDelete?.title}” also deletes all its responses. This action is permanent and can't be reversed — are you sure you want to continue?`"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </AppShell>
</template>
