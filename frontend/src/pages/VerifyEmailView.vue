<script setup lang="ts">
// Landing page for the emailed confirmation link: consumes ?token once and
// says how it went. Works signed in or out.
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api, ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import UiLogo from "@/components/ui/UiLogo.vue";

const route = useRoute();
const auth = useAuthStore();
const state = ref<"working" | "done" | "failed">("working");
const message = ref("");

onMounted(async () => {
  const token = typeof route.query.token === "string" ? route.query.token : "";
  try {
    if (!token) throw new ApiError(400, "This confirmation link is incomplete.");
    await api.verifyEmail(token);
    // Re-read the session rather than assume: the link may be for another account.
    if (auth.user) await auth.init();
    state.value = "done";
  } catch (err) {
    message.value =
      err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
    state.value = "failed";
  }
});
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-ink-50 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-6 flex justify-center">
        <UiLogo size="lg" />
      </div>
      <div
        class="rounded-2xl border border-line-200 bg-white p-7 text-center shadow-card"
        role="status"
      >
        <template v-if="state === 'working'">
          <p class="text-sm text-ink-500">Confirming your email…</p>
        </template>
        <template v-else-if="state === 'done'">
          <h1 class="text-lg font-semibold text-ink-900">Email confirmed</h1>
          <p class="mt-1 text-sm text-ink-500">
            You'll now get an email whenever one of your forms gets a response.
          </p>
        </template>
        <template v-else>
          <h1 class="text-lg font-semibold text-ink-900">Couldn't confirm</h1>
          <p class="mt-1 text-sm text-ink-500">
            {{ message }} You can send a new link from Settings.
          </p>
        </template>
      </div>
      <p class="mt-5 text-center text-sm text-ink-500">
        <router-link
          :to="auth.user ? { name: 'settings' } : { name: 'login' }"
          class="font-medium text-brand-700 hover:text-brand-800"
          >{{ auth.user ? "Go to settings" : "Log in" }}</router-link
        >
      </p>
    </div>
  </div>
</template>
