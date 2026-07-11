<script setup lang="ts">
// Shared AI generate input + flow: describe a form, get a FormDraft, land in the
// builder. Used by both the dashboard card and the navbar modal so the API call,
// redirect, and error handling live in exactly one place. Navigation on success
// unmounts whatever hosts this, so there's nothing to clean up here.
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api, ApiError } from "@/api/client";
import UiButton from "@/components/ui/UiButton.vue";

const props = defineProps<{ autofocus?: boolean }>();

const router = useRouter();
const prompt = ref("");
const generating = ref(false);
const error = ref<string | null>(null);
const textarea = ref<HTMLTextAreaElement | null>(null);

const EXAMPLE =
  "e.g. A job application form with contact details, years of experience, portfolio link, and available start date";

onMounted(() => {
  if (props.autofocus) textarea.value?.focus();
});

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
  <form @submit.prevent="generate">
    <textarea
      ref="textarea"
      v-model="prompt"
      rows="5"
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
      <p class="text-sm text-ink-400">
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
</template>
