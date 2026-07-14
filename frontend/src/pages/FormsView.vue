<script setup lang="ts">
// "My forms" page: list forms, create, jump to editor / responses, share, delete.
// Accepts ?q= (deep-link from the dashboard search) and ?view=templates.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, type FormSummary } from "@/api/client";
import { relativeTime } from "@/lib/time";
import AiGenerateForm from "@/components/AiGenerateForm.vue";
import AppShell from "@/components/AppShell.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import TemplateGallery from "@/components/TemplateGallery.vue";
import UiActionMenu, {
  type UiActionItem,
} from "@/components/ui/UiActionMenu.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiFilterMenu from "@/components/ui/UiFilterMenu.vue";
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
    if (q && !f.title.toLowerCase().includes(q)) return false;
    if (
      statusFilter.value.length &&
      !statusFilter.value.includes(f.published ? "published" : "draft")
    )
      return false;
    return true;
  });
});

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

async function remove(form: FormSummary): Promise<void> {
  if (
    !confirm(
      `Delete “${form.title}” and all its responses? This cannot be undone.`,
    )
  )
    return;
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

// Why a form can't be shared until it's published — reused by the hover quick
// actions and the "more" menu so the affordance is discoverable pre-publish.
function needsPublishTitle(form: FormSummary): string | undefined {
  return form.published ? undefined : "Publish the form to get a link";
}

// Edit / Open / Email surface as hover quick actions on the card; everything
// else lives in the kebab "more options" menu.
function moreActionsFor(form: FormSummary): UiActionItem[] {
  return [
    { id: "responses", label: "Responses", icon: "responses" },
    {
      id: "copy",
      label: "Copy link",
      icon: "copy",
      disabled: !form.published,
      title: needsPublishTitle(form),
    },
    { id: "delete", label: "Delete form", icon: "trash", danger: true },
  ];
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
    case "delete":
      remove(form);
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
      <div class="mb-5 flex flex-nowrap items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-lg font-semibold text-ink-900">
            {{ activeView === "templates" ? "Templates" : "My forms" }}
          </h1>
          <p v-if="activeView === 'templates'" class="text-sm text-ink-400">
            Pick a starting point — edit everything after.
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2 sm:gap-3">
          <template v-if="activeView === 'forms' && !loading && forms.length">
            <!-- count hidden on mobile so the row fits one line -->
            <span class="hidden text-sm text-ink-400 sm:inline">
              {{ filteredForms.length }} form{{
                filteredForms.length === 1 ? "" : "s"
              }}
            </span>
            <UiFilterMenu v-model="statusFilter" :options="STATUS_OPTIONS" />
          </template>

          <!-- Create form split dropdown: blank vs. AI generate -->
          <div
            ref="createRoot"
            class="relative"
            @keydown.escape="closeCreate"
          >
            <UiButton
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
                class="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white p-1 shadow-pop"
              >
                <button
                  type="button"
                  role="menuitem"
                  class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                  @click="pickCreate('blank')"
                >
                  <UiIcon name="plus" class="h-5 w-5 shrink-0 text-ink-400" />
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
                    class="h-5 w-5 shrink-0 text-ink-400"
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
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <span class="sr-only">Loading your forms…</span>
          <div
            v-for="n in 6"
            :key="n"
            class="rounded-xl border border-ink-200 border-l-[3px] bg-white p-4"
          >
            <UiSkeleton class="h-4 w-32 max-w-[70%]" />
            <UiSkeleton class="mt-2 h-5 w-20 rounded-full" />
            <UiSkeleton class="mt-4 h-7 w-28" />
            <UiSkeleton class="mt-4 h-3.5 w-24" />
          </div>
        </div>

        <div
          v-else-if="forms.length === 0"
          class="rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center"
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
          class="py-16 text-center text-sm text-ink-400"
        >
          No forms match
          {{ query.trim() ? `“${query}”` : "the selected filters" }}.
        </div>

        <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="form in filteredForms"
            :key="form.id"
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
                    @click="onAction(form, 'edit')"
                  >
                    <UiIcon name="pencil-square" class="text-inherit h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Open form"
                    :title="needsPublishTitle(form) ?? 'Open form'"
                    :disabled="!form.published"
                    @click="onAction(form, 'open')"
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
                    :title="needsPublishTitle(form) ?? 'Email form'"
                    :disabled="!form.published"
                    @click="onAction(form, 'email')"
                  >
                    <UiIcon name="envelope" class="text-inherit h-5 w-5" />
                  </button>
                </div>
                <UiActionMenu
                  class="-mr-1 shrink-0"
                  :items="moreActionsFor(form)"
                  :label="`More actions for ${form.title}`"
                  @select="onAction(form, $event)"
                />
              </div>
            </div>

            <!-- Prominent inline metrics -->
            <div class="flex items-center gap-5">
              <div class="flex items-baseline gap-1.5">
                <span
                  class="text-2xl font-semibold tabular-nums text-ink-900"
                  >{{ form.responseCount }}</span
                >
                <span class="text-sm text-ink-500"
                  >response{{ form.responseCount === 1 ? "" : "s" }}</span
                >
              </div>
              <div class="flex items-baseline gap-1.5">
                <span
                  class="text-2xl font-semibold tabular-nums text-ink-900"
                  >{{ form.viewCount }}</span
                >
                <span class="text-sm text-ink-500"
                  >view{{ form.viewCount === 1 ? "" : "s" }}</span
                >
              </div>
            </div>

            <p class="flex items-center gap-1.5 text-sm text-ink-500">
              <UiIcon name="calendar" class="h-5 w-5" />
              Edited {{ relativeTime(form.updatedAt) }}
              <!-- Copy feedback lands here since the menu closes on select -->
              <span v-if="copied === form.id" class="font-medium text-brand-700"
                >· Link copied!</span
              >
            </p>
          </li>
        </ul>
      </template>
    </main>

    <!-- AI generate modal — opened from the navbar sparkles button. Hosts the
         same <AiGenerateForm>, which redirects to the builder on success. -->
    <Teleport to="body">
      <div
        v-if="aiOpen"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 pt-[10vh]"
        @click.self="aiOpen = false"
        @keydown.esc="aiOpen = false"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Generate a form with AI"
          class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <span
                class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"
                aria-hidden="true"
              >
                <UiIcon name="sparkles" class="text-inherit h-5 w-5" />
              </span>
              <h2 class="font-semibold text-ink-900">
                Generate a form with AI
              </h2>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              aria-label="Close"
              @click="aiOpen = false"
            >
              <UiIcon name="x-mark" class="text-inherit h-5 w-5" />
            </button>
          </div>

          <p class="mt-1 text-sm text-ink-500">
            Describe what you need — fields, choices, validation — and get an
            editable draft in seconds.
          </p>

          <AiGenerateForm autofocus class="mt-3" />
        </div>
      </div>
    </Teleport>
  </AppShell>
</template>
