<script setup lang="ts">
// Settings: security for now (change password, sign out). App/workspace
// preferences land here when the product grows some — until then this page
// holds everything that isn't identity (that's /account).
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api, ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/AppShell.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiUserMenu from "@/components/ui/UiUserMenu.vue";

const router = useRouter();
const auth = useAuthStore();

// Profile (display name; email is read-only until we have verification email infra).
const name = ref(auth.user?.name ?? "");
const savingName = ref(false);
const nameError = ref<string | null>(null);
const nameSaved = ref(false);

async function saveName(): Promise<void> {
  nameError.value = null;
  nameSaved.value = false;
  savingName.value = true;
  try {
    await auth.updateProfile(name.value.trim());
    nameSaved.value = true;
  } catch (err) {
    nameError.value =
      err instanceof ApiError ? err.message : "Failed to save your name.";
  } finally {
    savingName.value = false;
  }
}

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const saving = ref(false);
const error = ref<string | null>(null);
const saved = ref(false);

async function changePassword(): Promise<void> {
  error.value = null;
  saved.value = false;
  if (newPassword.value.length < 8) {
    error.value = "New password must be at least 8 characters.";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = "New passwords don't match.";
    return;
  }
  saving.value = true;
  try {
    await api.changePassword(currentPassword.value, newPassword.value);
    currentPassword.value = newPassword.value = confirmPassword.value = "";
    saved.value = true;
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : "Failed to change password.";
  } finally {
    saving.value = false;
  }
}

async function logout(): Promise<void> {
  await auth.logout();
  router.replace({ name: "login" });
}
</script>

<template>
  <AppShell>
    <header class="sticky top-0 z-20 border-b border-ink-200 bg-white">
      <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <h1 class="text-base font-semibold">Settings</h1>
        <UiUserMenu />
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <!-- Profile -->
      <section
        class="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
        aria-label="Profile"
      >
        <div class="flex items-center gap-2">
          <UiIcon name="user-circle" class="h-5 w-5 text-ink-400" />
          <h2 class="font-semibold text-ink-900">Profile</h2>
        </div>

        <form class="mt-4 max-w-sm space-y-3" @submit.prevent="saveName">
          <div>
            <label class="mb-1 block text-sm text-ink-500" for="name">Name</label>
            <input
              id="name"
              v-model="name"
              type="text"
              maxlength="80"
              autocomplete="name"
              placeholder="Your name"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-ink-500" for="email">Email</label>
            <input
              id="email"
              :value="auth.user?.email"
              type="email"
              readonly
              class="w-full cursor-not-allowed rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-500"
            />
            <p class="mt-1 text-sm text-ink-400">Contact support to change your email.</p>
          </div>

          <p
            v-if="nameError"
            role="alert"
            class="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-danger"
          >
            {{ nameError }}
          </p>
          <p v-else-if="nameSaved" role="status" class="text-sm font-medium text-success">
            Profile saved.
          </p>

          <UiButton type="submit" :disabled="savingName">
            {{ savingName ? "Saving…" : "Save" }}
          </UiButton>
        </form>
      </section>

      <!-- Security -->
      <section
        class="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
        aria-label="Security"
      >
        <div class="flex items-center gap-2">
          <UiIcon name="key" class="h-5 w-5 text-ink-400" />
          <h2 class="font-semibold text-ink-900">Password</h2>
        </div>
        <p class="mt-1 text-sm text-ink-500">
          Changing your password signs you out everywhere else.
        </p>

        <form class="mt-4 max-w-sm space-y-3" @submit.prevent="changePassword">
          <div>
            <label class="mb-1 block text-sm text-ink-500" for="current-password">Current password</label>
            <input
              id="current-password"
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              required
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-ink-500" for="new-password">New password</label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-ink-500" for="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              minlength="8"
              class="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <p
            v-if="error"
            role="alert"
            class="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-danger"
          >
            {{ error }}
          </p>
          <p v-else-if="saved" role="status" class="text-sm font-medium text-success">
            Password updated.
          </p>

          <UiButton type="submit" :disabled="saving">
            {{ saving ? "Saving…" : "Change password" }}
          </UiButton>
        </form>
      </section>

      <!-- Data export -->
      <section
        class="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
        aria-label="Data export"
      >
        <div class="flex items-center gap-2">
          <UiIcon name="arrow-down-tray" class="h-5 w-5 text-ink-400" />
          <h2 class="font-semibold text-ink-900">Your data</h2>
        </div>
        <p class="mt-1 text-sm text-ink-500">
          Download everything — every form, its published versions, and all
          responses — as a single JSON file.
        </p>
        <a :href="api.exportUrl()" download class="mt-4 inline-block">
          <UiButton variant="secondary">Export all my data</UiButton>
        </a>
      </section>

      <!-- Session -->
      <section
        class="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
        aria-label="Session"
      >
        <div class="flex items-center gap-2">
          <UiIcon name="arrow-left-start-on-rectangle" class="h-5 w-5 text-ink-400" />
          <h2 class="font-semibold text-ink-900">Session</h2>
        </div>
        <p class="mt-1 text-sm text-ink-500">
          Signed in as {{ auth.user?.email }}.
        </p>
        <UiButton variant="secondary" class="mt-4" @click="logout">Log out</UiButton>
      </section>
    </main>
  </AppShell>
</template>
