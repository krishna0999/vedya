<script setup lang="ts">
// Password reset, both halves on one screen: without ?token it asks for the
// email and sends a link; with ?token (the emailed link) it sets a new
// password, which also signs the user in.
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import UiButton from "@/components/ui/UiButton.vue";
import UiLogo from "@/components/ui/UiLogo.vue";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const token = computed(() =>
  typeof route.query.token === "string" ? route.query.token : "",
);

const email = ref("");
const password = ref("");
const confirm = ref("");
const error = ref<string | null>(null);
const busy = ref(false);
const sent = ref(false);

async function requestLink(): Promise<void> {
  error.value = null;
  if (!email.value.trim()) {
    error.value = "Enter your email address.";
    return;
  }
  busy.value = true;
  try {
    await api.forgotPassword(email.value.trim());
    sent.value = true;
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
}

async function setPassword(): Promise<void> {
  error.value = null;
  if (password.value.length < 8) {
    error.value = "Password must be at least 8 characters.";
    return;
  }
  if (password.value !== confirm.value) {
    error.value = "Passwords don't match.";
    return;
  }
  busy.value = true;
  try {
    await auth.resetPassword(token.value, password.value);
    router.replace({ name: "dashboard" });
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-ink-50 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-6 flex justify-center">
        <UiLogo size="lg" />
      </div>

      <div class="rounded-2xl border border-line-200 bg-white p-7 shadow-card">
        <!-- Step 2: from the emailed link -->
        <template v-if="token">
          <h1 class="text-lg font-semibold text-ink-900">Choose a new password</h1>
          <p class="mt-0.5 text-sm text-ink-500">
            This signs you out on every other device.
          </p>
          <form class="mt-5 space-y-4" novalidate @submit.prevent="setPassword">
            <p
              v-if="error"
              role="alert"
              class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger"
            >
              {{ error }}
              <router-link
                v-if="error.includes('link')"
                :to="{ name: 'forgot-password' }"
                class="font-medium underline"
                >Send a new link</router-link
              >
            </p>
            <div>
              <label for="new-password" class="ui-label">New password</label>
              <input
                id="new-password"
                v-model="password"
                type="password"
                autocomplete="new-password"
                class="ui-input"
              />
            </div>
            <div>
              <label for="confirm-password" class="ui-label">Confirm new password</label>
              <input
                id="confirm-password"
                v-model="confirm"
                type="password"
                autocomplete="new-password"
                class="ui-input"
              />
            </div>
            <UiButton type="submit" :disabled="busy" class="w-full">
              {{ busy ? "Please wait…" : "Set password and log in" }}
            </UiButton>
          </form>
        </template>

        <!-- Step 1: ask for the email -->
        <template v-else-if="!sent">
          <h1 class="text-lg font-semibold text-ink-900">Reset your password</h1>
          <p class="mt-0.5 text-sm text-ink-500">
            We'll email you a link to choose a new one.
          </p>
          <form class="mt-5 space-y-4" novalidate @submit.prevent="requestLink">
            <p
              v-if="error"
              role="alert"
              class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger"
            >
              {{ error }}
            </p>
            <div>
              <label for="email" class="ui-label">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="ui-input"
              />
            </div>
            <UiButton type="submit" :disabled="busy" class="w-full">
              {{ busy ? "Please wait…" : "Send reset link" }}
            </UiButton>
          </form>
        </template>

        <template v-else>
          <h1 class="text-lg font-semibold text-ink-900">Check your email</h1>
          <p class="mt-1 text-sm text-ink-500" role="status">
            If an account exists for {{ email.trim() }}, a reset link is on its
            way. It expires in 30 minutes.
          </p>
        </template>
      </div>

      <p class="mt-5 text-center text-sm text-ink-500">
        <router-link
          :to="{ name: 'login' }"
          class="font-medium text-brand-700 hover:text-brand-800"
          >Back to log in</router-link
        >
      </p>
    </div>
  </div>
</template>
