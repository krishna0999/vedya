<script setup lang="ts">
// The public renderer a stranger loads at /f/:formId. Fetches the PUBLISHED
// FormVersion and feeds it to <FormRenderer>. The server re-validates on submit
// (authoritative); this page just relays the answers and shows the outcome.
// Form theme is scoped inside FormRenderer — no product brand leaks into it.
import { nextTick, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import type { FormVersion } from "@schema";
import { api, ApiError } from "@/api/client";
import FormRenderer from "@/components/FormRenderer.vue";
import UiSkeleton from "@/components/ui/UiSkeleton.vue";

const route = useRoute();
const formId = route.params.formId as string;

const version = ref<FormVersion | null>(null);
const branding = ref(true);
const loading = ref(true);
const loadError = ref<string | null>(null);

const submitting = ref(false);
const submitError = ref<string | null>(null);
const done = ref(false);

// Bot check (Cloudflare Turnstile), only when a site key is configured. The
// server verifies the token; "interaction-only" keeps the widget invisible
// unless Cloudflare actually needs the respondent to click. The VITE_ prefix is
// required: Vite only exposes VITE_* vars to browser code, anything else is
// undefined at build time and the whole widget is tree-shaken out.
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const turnstileEl = ref<HTMLElement | null>(null);
const challengeVisible = ref(false);
let widgetId: string | undefined;
let turnstileToken: string | undefined;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(s);
  });
}

async function mountTurnstile(): Promise<void> {
  if (!siteKey) return;
  await nextTick(); // the container renders with the form
  try {
    await loadTurnstileScript();
    if (!turnstileEl.value || !window.turnstile) return;
    widgetId = window.turnstile.render(turnstileEl.value, {
      sitekey: siteKey,
      appearance: "interaction-only",
      callback: (token: string) => (turnstileToken = token),
      "expired-callback": () => (turnstileToken = undefined),
      // Interaction-only widgets show/hide themselves; space them only while shown.
      "before-interactive-callback": () => (challengeVisible.value = true),
      "after-interactive-callback": () => (challengeVisible.value = false),
    });
  } catch {
    submitError.value =
      "Couldn’t load the spam check. Disable content blockers for this page and reload.";
  }
}

async function load(): Promise<void> {
  loading.value = true;
  loadError.value = null;
  try {
    const form = await api.getPublicForm(formId);
    version.value = form.version;
    branding.value = form.branding;
    trackView();
    void mountTurnstile();
  } catch (err) {
    loadError.value =
      err instanceof ApiError && err.status === 404
        ? "This form isn’t available. It may be unpublished or the link is wrong."
        : err instanceof Error
          ? err.message
          : "Failed to load form.";
  } finally {
    loading.value = false;
  }
}

// Analytics view ping — once per tab session (refreshes don't inflate counts),
// fire-and-forget: analytics must never affect the respondent's experience.
function trackView(): void {
  const key = `vedya-viewed:${formId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // storage unavailable (private mode etc.) — still count the view
  }
  api.recordView(formId).catch(() => {});
}

async function onSubmit(answers: Record<string, unknown>): Promise<void> {
  if (siteKey && !turnstileToken) {
    submitError.value = "Still checking you’re human — try again in a moment.";
    return;
  }
  submitting.value = true;
  submitError.value = null;
  try {
    await api.submit(formId, answers, turnstileToken);
    done.value = true;
  } catch (err) {
    submitError.value =
      err instanceof ApiError && err.status === 429
        ? "Too many submissions. Please wait a moment and try again."
        : err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
    // Tokens are single-use: get a fresh one for the retry.
    turnstileToken = undefined;
    if (widgetId) window.turnstile?.reset(widgetId);
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="min-h-screen bg-ink-50 px-4 py-10">
    <div class="mx-auto max-w-xl">
      <!-- Skeleton mirror of the form card: title + a few label/input pairs -->
      <div
        v-if="loading"
        role="status"
        class="rounded-2xl border border-line-200 bg-white p-6 shadow-card sm:p-8"
      >
        <span class="sr-only">Loading…</span>
        <UiSkeleton class="h-6 w-2/3" />
        <div v-for="n in 3" :key="n" class="mt-7 space-y-2">
          <UiSkeleton class="h-3.5 w-40" />
          <UiSkeleton class="h-10 w-full rounded-lg" />
        </div>
        <UiSkeleton class="mt-8 h-10 w-28 rounded-lg" />
      </div>

      <div
        v-else-if="loadError"
        class="rounded-2xl border border-line-200 bg-white p-10 text-center"
      >
        <h1 class="text-lg font-semibold text-ink-900">Form unavailable</h1>
        <p class="mt-1 text-sm text-ink-500">{{ loadError }}</p>
      </div>

      <div
        v-else-if="done"
        class="rounded-2xl border border-line-200 bg-white p-10 text-center shadow-card"
      >
        <div
          class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-2xl text-brand-600"
        >
          ✓
        </div>
        <h1 class="text-lg font-semibold text-ink-900">
          Thanks — your response was recorded.
        </h1>
        <p class="mt-1 text-sm text-ink-500">You can close this tab now.</p>
        <!-- Growth loop, free-tier forms only: paid removes our branding (§8),
             so the CTA rides the same flag as the "Made with" badge. -->
        <template v-if="branding">
          <router-link
            :to="{ name: 'signup' }"
            class="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            Create your own form
          </router-link>
          <p class="mt-2 text-sm text-ink-500">
            Free with Vedya — no card needed.
          </p>
        </template>
      </div>

      <div v-else-if="version">
        <div
          class="rounded-2xl border border-line-200 bg-white p-6 shadow-card sm:p-8"
        >
          <p
            v-if="submitError"
            class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
          >
            {{ submitError }}
          </p>
          <FormRenderer
            :version="version"
            :submitting="submitting"
            @submit="onSubmit"
          >
            <template #before-submit>
              <div v-if="siteKey" ref="turnstileEl" :class="{ 'mb-5': challengeVisible }" />
            </template>
          </FormRenderer>
        </div>
        <p v-if="branding" class="mt-6 text-center text-sm text-ink-500">
          Made with Vedya
        </p>
      </div>
    </div>
  </div>
</template>
