<script setup lang="ts">
// Public page for one template at /templates/:slug: what the form asks, a live
// preview (the real <FormRenderer>), and "Use this template". Built for search:
// the crawlable static version is prerendered at build (scripts/prerender.ts)
// with the same facts, and this page takes over once the app loads.
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormVersion } from "@schema";
import { api, type TemplateSummary } from "@/api/client";
import { categoryStyle } from "@/lib/categories";
import { useTemplateAction } from "@/lib/useTemplate";
import { DEFAULT_THEME } from "@/stores/builder";
import FormRenderer from "@/components/FormRenderer.vue";
import MarketingShell from "@/components/MarketingShell.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const route = useRoute();
const router = useRouter();
const { busy, error: useError, use } = useTemplateAction();

const all = ref<TemplateSummary[]>([]);
const loading = ref(true);
const loadError = ref<string | null>(null);

const slug = computed(() => route.params.slug as string);
const template = computed(() => all.value.find((t) => t.id === slug.value) ?? null);
const related = computed(() =>
  all.value
    .filter((t) => t.category === template.value?.category && t.id !== slug.value)
    .slice(0, 6),
);
const questions = computed(
  () => template.value?.fields.filter((f) => f.type !== "section_break") ?? [],
);
// ponytail: ~15s per question, the same estimate the gallery shows.
const minutes = computed(() => Math.max(1, Math.ceil((questions.value.length * 15) / 60)));

const preview = computed<FormVersion | null>(() =>
  template.value
    ? {
        versionId: "preview",
        formId: template.value.id,
        version: 0,
        fields: template.value.fields,
        theme: { ...DEFAULT_THEME, primaryColor: template.value.primaryColor },
        publishedAt: new Date().toISOString(),
      }
    : null,
);

// The router sets generic meta on every navigation (even a query change);
// this page knows the real title, so re-apply after each one.
watch([template, () => route.fullPath], ([t]) => {
  if (!t) return;
  document.title = `${t.title} template | Vedya`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", `${t.description} Free ${t.title.toLowerCase()} form template.`);
});

onMounted(async () => {
  try {
    all.value = (await api.listTemplates()).templates;
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : "Failed to load template.";
  } finally {
    loading.value = false;
  }
  // Back from sign-up with ?use=1: finish what they started.
  if (route.query.use === "1" && template.value) {
    await router.replace({ query: {} });
    void use(template.value.id);
  }
});
</script>

<template>
  <MarketingShell>
    <nav class="mt-2 text-sm text-ink-500" aria-label="Breadcrumb">
      <router-link :to="{ name: 'templates' }" class="hover:text-ink-700"
        >Templates</router-link
      >
      <template v-if="template">
        <span class="mx-1.5 text-ink-300">/</span>{{ template.category }}
      </template>
    </nav>

    <div v-if="loading" role="status" class="mt-6 grid gap-8 lg:grid-cols-2">
      <span class="sr-only">Loading template…</span>
      <div>
        <UiSkeleton class="h-8 w-2/3" />
        <UiSkeleton class="mt-3 h-4 w-full" />
        <UiSkeleton class="mt-6 h-10 w-44 rounded-md" />
      </div>
      <UiSkeleton class="h-96 w-full rounded-md" />
    </div>

    <div
      v-else-if="loadError || !template"
      class="mt-6 rounded-md border border-line-200 bg-white p-10 text-center"
    >
      <h1 class="text-lg font-semibold text-ink-900">Template not found</h1>
      <p class="mt-1 text-sm text-ink-500">
        {{ loadError ?? "It may have been renamed or removed." }}
      </p>
      <router-link
        :to="{ name: 'templates' }"
        class="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
        >Browse all templates</router-link
      >
    </div>

    <template v-else>
      <div class="mt-6 grid items-start gap-8 lg:grid-cols-2">
        <div>
          <span
            class="grid h-12 w-12 place-items-center rounded-md text-2xl leading-none"
            :style="{
              background: `color-mix(in srgb, ${categoryStyle(template.category).accent} 12%, white)`,
            }"
            aria-hidden="true"
            >{{ template.icon }}</span
          >
          <h1 class="mt-4 text-3xl font-semibold tracking-tight text-ink-900">
            {{ template.title }} template
          </h1>
          <p class="mt-2 text-ink-600">{{ template.description }}</p>
          <p class="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-ink-500">
            <span>{{ questions.length }} question{{ questions.length === 1 ? "" : "s" }}</span>
            <span class="text-ink-300">·</span>
            <span>~{{ minutes }} min to fill</span>
            <span class="text-ink-300">·</span>
            <span>Free</span>
          </p>
          <UiButton class="mt-6" :disabled="busy" @click="use(template.id)">
            {{ busy ? "Creating…" : "Use this template" }}
          </UiButton>
          <p v-if="useError" role="alert" class="mt-2 text-sm text-danger">
            {{ useError }}
          </p>

          <h2 class="mt-10 font-semibold text-ink-900">What it asks</h2>
          <ol class="mt-3 space-y-2">
            <li
              v-for="(q, i) in questions"
              :key="q.id"
              class="flex gap-3 text-sm text-ink-700"
            >
              <span class="w-5 shrink-0 text-right tabular-nums text-ink-400">{{ i + 1 }}.</span>
              <span>
                {{ q.label }}
                <span v-if="q.required" class="text-ink-500">(required)</span>
              </span>
            </li>
          </ol>
          <p class="mt-4 text-sm text-ink-500">
            Every question can be edited, removed or reordered after you start.
          </p>
        </div>

        <div class="rounded-md border border-line-200 bg-white p-5 sm:p-6">
          <p class="mb-4 flex items-center gap-1.5 text-sm text-ink-500">
            <UiIcon name="eye" class="h-4 w-4" /> Live preview
          </p>
          <FormRenderer
            v-if="preview"
            :key="preview.formId"
            :version="preview"
            :title="template.title"
            hide-submit
          />
        </div>
      </div>

      <section v-if="related.length" class="mt-14">
        <h2 class="font-semibold text-ink-900">
          More {{ template.category }} templates
        </h2>
        <ul class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="t in related" :key="t.id">
            <router-link
              :to="{ name: 'template', params: { slug: t.id } }"
              class="block rounded-md border border-line-200 bg-white p-4 transition-colors hover:border-line-300"
            >
              <span class="font-medium text-ink-900">{{ t.icon }} {{ t.title }}</span>
              <span class="mt-1 block text-sm text-ink-500">{{ t.description }}</span>
            </router-link>
          </li>
        </ul>
      </section>
    </template>
  </MarketingShell>
</template>
