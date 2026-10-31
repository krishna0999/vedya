<script setup lang="ts">
// Login + signup share one screen (mode prop). Product chrome — uses .ui-input /
// brand tokens, never the form theme. On success, return to the intended route
// (?redirect) or the dashboard.
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ApiError } from "@/api/client";
import UiButton from "@/components/ui/UiButton.vue";
import UiPasswordInput from "@/components/ui/UiPasswordInput.vue";
import UiLogo from "@/components/ui/UiLogo.vue";

const props = defineProps<{ mode: "login" | "signup" }>();

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const busy = ref(false);

const isSignup = computed(() => props.mode === "signup");
const heading = computed(() =>
  isSignup.value ? "Create your account" : "Welcome back",
);
const cta = computed(() => (isSignup.value ? "Sign up" : "Log in"));

async function submit(): Promise<void> {
  error.value = null;
  if (!email.value.trim() || !password.value) {
    error.value = "Enter your email and password.";
    return;
  }
  if (isSignup.value && password.value.length < 8) {
    error.value = "Password must be at least 8 characters.";
    return;
  }
  busy.value = true;
  try {
    if (isSignup.value) await auth.signup(email.value.trim(), password.value);
    else await auth.login(email.value.trim(), password.value);
    const redirect =
      typeof route.query.redirect === "string"
        ? route.query.redirect
        : "/dashboard";
    router.replace(redirect);
  } catch (err) {
    error.value =
      err instanceof ApiError
        ? err.message
        : "Something went wrong. Please try again.";
    console.error(err);
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

      <div class="rounded-md border border-line-200 bg-white p-7 shadow-card">
        <h1 class="text-lg font-semibold text-ink-900">{{ heading }}</h1>
        <p class="mt-0.5 text-sm text-ink-500">
          {{
            isSignup
              ? "Start building forms in seconds."
              : "Log in to your forms."
          }}
        </p>

        <form class="mt-5 space-y-4" novalidate @submit.prevent="submit">
          <p
            v-if="error"
            class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger"
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

          <div>
            <div class="flex items-baseline justify-between">
              <label for="password" class="ui-label">Password</label>
              <router-link
                v-if="!isSignup"
                :to="{ name: 'forgot-password' }"
                class="text-sm font-medium text-brand-700 hover:text-brand-800"
                >Forgot password?</router-link
              >
            </div>
            <UiPasswordInput
              id="password"
              v-model="password"
              :autocomplete="isSignup ? 'new-password' : 'current-password'"
              placeholder="••••••••"
              class="ui-input"
            />
          </div>

          <UiButton type="submit" :disabled="busy" class="w-full">
            {{ busy ? "Please wait…" : cta }}
          </UiButton>
          <!-- <p v-if="isSignup" class="text-center text-sm text-ink-500">
            By signing up you agree to our
            <router-link :to="{ name: 'terms' }" class="font-medium text-brand-700 hover:text-brand-800">Terms</router-link>
            and
            <router-link :to="{ name: 'privacy' }" class="font-medium text-brand-700 hover:text-brand-800">Privacy Policy</router-link>.
          </p> -->
        </form>
      </div>

      <p class="mt-5 text-center text-sm text-ink-500">
        <template v-if="isSignup">
          Already have an account?
          <router-link
            :to="{ name: 'login', query: route.query }"
            class="font-medium text-brand-700 hover:text-brand-800"
            >Log in</router-link
          >
        </template>
        <template v-else>
          New here?
          <router-link
            :to="{ name: 'signup', query: route.query }"
            class="font-medium text-brand-700 hover:text-brand-800"
            >Create an account</router-link
          >
        </template>
      </p>
    </div>
  </div>
</template>
