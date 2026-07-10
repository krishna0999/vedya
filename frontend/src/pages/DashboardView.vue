<script setup lang="ts">
// Owner dashboard: list forms, create, jump to editor / responses, share, delete.
// Owner is the dev stub until auth (step 5); this is the "my forms" surface.
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, type FormSummary } from "@/api/client";
import AiGenerateCard from "@/components/AiGenerateCard.vue";
import AppShell from "@/components/AppShell.vue";
import TemplateGallery from "@/components/TemplateGallery.vue";
import UiActionMenu, {
  type UiActionItem,
} from "@/components/ui/UiActionMenu.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiFilterMenu from "@/components/ui/UiFilterMenu.vue";
import UiSearchInput from "@/components/ui/UiSearchInput.vue";
import UiUserMenu from "@/components/ui/UiUserMenu.vue";

const router = useRouter();
const route = useRoute();

const forms = ref<FormSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const creating = ref(false);

// The sidebar switches between two content views in-place — templates render
// inline here, not in a modal. The view lives in the URL (?view=templates) so
// other screens (e.g. the builder's nav menu) can deep-link straight to it.
const activeView = computed<"dashboard" | "templates">(() =>
  route.query.view === "templates" ? "templates" : "dashboard",
);
function setView(view: "dashboard" | "templates"): void {
  router.replace({ query: view === "templates" ? { view } : {} });
}
// search is per-view; don't carry a stale query across
watch(activeView, () => (query.value = ""));

// Client-side search over the active view — the topbar search box binds here.
const query = ref("");
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

// Per-card action menu. Link actions need a published form; they stay visible
// but disabled so the affordance is discoverable before first publish.
function actionsFor(form: FormSummary): UiActionItem[] {
  const needsPublish = form.published
    ? undefined
    : "Publish the form to get a link";
  return [
    { id: "edit", label: "Edit form", icon: "pencil" },
    { id: "responses", label: "Responses", icon: "responses" },
    {
      id: "copy",
      label: "Copy link",
      icon: "copy",
      disabled: !form.published,
      title: needsPublish,
    },
    {
      id: "open",
      label: "Open form",
      icon: "external",
      disabled: !form.published,
      title: needsPublish,
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
    case "open":
      window.open(`/f/${form.id}`, "_blank", "noopener");
      break;
    case "delete":
      remove(form);
      break;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

onMounted(load);
</script>

<template>
  <AppShell>
    <!-- Topbar — the inner row shares the content's centered max-w-4xl column
         so the search box lines up with the forms/templates below it. New form
         + avatar ride the end of that row until xl, where the content centers
         and a margin opens up — there they break out to the screen's far right
         (see the actions block below). -->
    <header class="relative border-b border-ink-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 sm:px-6"
      >
        <UiSearchInput
            v-model="query"
            class="min-w-0 w-full max-w-4xl"
            :aria-label="
              activeView === 'templates' ? 'Search templates' : 'Search forms'
            "
            :placeholder="
              activeView === 'templates' ? 'Search templates…' : 'Search forms…'
            "
          />
          <div
            class="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 xl:absolute xl:inset-y-0 xl:right-6 xl:ml-0"
          >
            <UiButton :disabled="creating" @click="createForm">
              <span>{{ creating ? "Creating…" : "New form" }}</span>
            </UiButton>
            <UiUserMenu></UiUserMenu>
          </div>
        </div>
      </header>

      <!-- Content — centered; shares the topbar's max-w-4xl column so the search
           box above lines up with this content's left edge. -->
      <main class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <!-- AI generation rides above the forms list (adoption engine — the
             fastest path from intent to a draft). -->
        <AiGenerateCard v-if="activeView === 'dashboard'" class="mb-6" />

        <div class="mb-5 flex items-baseline justify-between">
          <h1 class="text-lg font-semibold text-ink-900">
            {{ activeView === "templates" ? "Templates" : "My forms" }}
          </h1>
          <div
            v-if="activeView === 'dashboard' && !loading && forms.length"
            class="flex items-center gap-3"
          >
            <span class="text-xs text-ink-400">
              {{ filteredForms.length }} form{{
                filteredForms.length === 1 ? "" : "s"
              }}
            </span>
            <UiFilterMenu v-model="statusFilter" :options="STATUS_OPTIONS" />
          </div>
          <span
            v-else-if="activeView === 'templates'"
            class="text-xs text-ink-400"
          >
            Pick a starting point — edit everything after.
          </span>
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
          <div v-if="loading" class="py-16 text-center text-sm text-ink-400">
            Loading your forms…
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

          <ul v-else class="space-y-3">
            <!-- All card actions live in the kebab menu, so the card stays a
                 single compact row at every width. -->
            <li
              v-for="form in filteredForms"
              :key="form.id"
              class="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card transition hover:border-ink-300"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <router-link
                    :to="{ name: 'builder', params: { id: form.id } }"
                    class="truncate font-semibold text-ink-900 hover:text-brand-700"
                  >
                    {{ form.title }}
                  </router-link>
                  <span
                    v-if="form.published"
                    class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                    >Published</span
                  >
                  <span
                    v-else
                    class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500"
                    >Draft</span
                  >
                </div>
                <p class="mt-0.5 text-xs text-ink-400">
                  {{ form.responseCount }} response{{
                    form.responseCount === 1 ? "" : "s"
                  }}
                  · {{ form.viewCount }} view{{ form.viewCount === 1 ? "" : "s" }}
                  · edited {{ relativeTime(form.updatedAt) }}
                  <!-- Copy feedback lands here since the menu closes on select -->
                  <span
                    v-if="copied === form.id"
                    class="font-medium text-brand-700"
                    >· Link copied!</span
                  >
                </p>
              </div>

              <UiActionMenu
                class="shrink-0"
                :items="actionsFor(form)"
                :label="`Actions for ${form.title}`"
                @select="onAction(form, $event)"
              />
            </li>
          </ul>
        </template>
      </main>
  </AppShell>
</template>
