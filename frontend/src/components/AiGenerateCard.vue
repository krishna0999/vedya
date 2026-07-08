<script setup lang="ts">
// AI form generation entry (ROADMAP Phase 1): describe a form, get a FormDraft,
// land in the builder. Self-contained — calls the API and navigates on success;
// quota/config problems surface as the API's own error message (429/503).
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api, ApiError } from "@/api/client";
import UiButton from "@/components/ui/UiButton.vue";

const router = useRouter();

const prompt = ref("");
const generating = ref(false);
const error = ref<string | null>(null);

const EXAMPLE =
  "e.g. A job application form with contact details, years of experience, portfolio link, and available start date";

async function generate(): Promise<void> {
  const text = prompt.value.trim();
  if (!text || generating.value) return;
  generating.value = true;
  error.value = null;
  try {
    const draft = await api.generateForm(text);
    router.push({ name: "builder", params: { id: draft.id } });
  } catch (err) {
    // The API crafts human messages for the expected failures (quota 429,
    // unusable AI output 502, missing key 503). Anything else — a bare 500,
    // network drop — gets a generic line, never raw server wording.
    error.value =
      err instanceof ApiError && err.status !== 500
        ? err.message
        : "An error occurred while creating your form. Please try again.";
    generating.value = false;
  }
}
</script>

<template>
  <!-- Brand-tinted so it reads as a feature, not another list row -->
  <section
    class="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-white p-4 shadow-card sm:p-5"
    aria-label="Generate a form with AI"
  >
    <div class="flex items-center gap-2">
      <span
        class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"
        aria-hidden="true"
      >
        <svg
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11 3l1.2 3.3L15.5 7.5l-3.3 1.2L11 12l-1.2-3.3L6.5 7.5l3.3-1.2L11 3zM5 12l.8 2.2L8 15l-2.2.8L5 18l-.8-2.2L2 15l2.2-.8L5 12z"
          />
        </svg>
      </span>
      <h2 class="text-sm font-semibold text-ink-900">Generate a form with AI</h2>
    </div>

    <p class="mt-1 text-xs text-ink-500">
      Describe what you need — fields, choices, validation — and get an editable
      draft in seconds.
    </p>

    <form class="mt-3" @submit.prevent="generate">
      <textarea
        v-model="prompt"
        rows="2"
        class="w-full resize-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        :placeholder="EXAMPLE"
        :disabled="generating"
        aria-label="Describe the form you want"
        @keydown.enter.exact.prevent="generate"
      ></textarea>

      <p
        v-if="error"
        role="alert"
        class="mt-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-danger"
      >
        {{ error }}
      </p>

      <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-ink-400">
          You'll be able to edit everything before publishing.
        </p>
        <UiButton
          type="submit"
          size="sm"
          :disabled="generating || prompt.trim().length < 10"
        >
          {{ generating ? "Generating…" : "Generate form" }}
        </UiButton>
      </div>
    </form>
  </section>
</template>
