<script setup lang="ts">
// Owner dashboard: list forms, create, jump to editor / responses, share, delete.
// Owner is the dev stub until auth (step 5); this is the "my forms" surface.
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, type FormSummary } from "@/api/client";
import AiGenerateCard from "@/components/AiGenerateCard.vue";
import DashboardNav from "@/components/DashboardNav.vue";
import TemplateGallery from "@/components/TemplateGallery.vue";
import UiActionMenu, {
  type UiActionItem,
} from "@/components/ui/UiActionMenu.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiLogo from "@/components/ui/UiLogo.vue";
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

// Off-canvas sidebar for small screens (the desktop sidebar is always visible).
const sidebarOpen = ref(false);
function onNavSelect(view: "dashboard" | "templates"): void {
  setView(view);
  sidebarOpen.value = false;
}
// Close the slideover on Escape while it's open (one stable handler so the
// add/remove pair references the same function).
function onSlideoverKey(e: KeyboardEvent): void {
  if (e.key === "Escape") sidebarOpen.value = false;
}
watch(sidebarOpen, (open) => {
  if (open) document.addEventListener("keydown", onSlideoverKey);
  else document.removeEventListener("keydown", onSlideoverKey);
});

// Client-side search over the active view — the topbar search box binds here.
const query = ref("");
const filteredForms = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return forms.value;
  return forms.value.filter((f) => f.title.toLowerCase().includes(q));
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
  <div class="flex min-h-screen bg-ink-50 text-ink-900">
    <!-- Sidebar -->
    <aside
      class="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white md:flex"
    >
      <div class="px-5 py-4">
        <UiLogo />
      </div>
      <DashboardNav :active="activeView" class="px-3 py-2" @select="setView" />
    </aside>

    <!-- Right column: topbar + content -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Topbar — the inner row shares the content's centered max-w-4xl column
           so the search box lines up with the forms/templates below it. New form
           + avatar ride the end of that row until xl, where the content centers
           and a margin opens up — there they break out to the screen's far right
           (see the actions block below). -->
      <header class="relative border-b border-ink-200 bg-white">
        <div
          class="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 sm:px-6"
        >
          <button
            type="button"
            class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 md:hidden"
            aria-label="Open menu"
            @click="sidebarOpen = true"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              class="h-5 w-5"
            >
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
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
          <span
            v-if="activeView === 'dashboard' && !loading && forms.length"
            class="text-xs text-ink-400"
          >
            {{ forms.length }} form{{ forms.length === 1 ? "" : "s" }}
          </span>
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
            No forms match “{{ query }}”.
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
    </div>

    <!-- Mobile slideover: the sidebar off-canvas on small screens -->
    <transition
      enter-active-class="transition-opacity duration-200 ease-soft"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-soft"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-ink-900/40 md:hidden"
        @click="sidebarOpen = false"
      ></div>
    </transition>
    <transition
      enter-active-class="transition-transform duration-200 ease-soft"
      enter-from-class="-translate-x-full"
      leave-active-class="transition-transform duration-150 ease-soft"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="sidebarOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl md:hidden"
      >
        <div class="flex items-center justify-between px-5 py-4">
          <UiLogo />
          <button
            type="button"
            class="rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Close menu"
            @click="sidebarOpen = false"
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
        </div>
        <DashboardNav
          :active="activeView"
          class="px-3 py-2"
          @select="onNavSelect"
        />
      </aside>
    </transition>
  </div>
</template>
