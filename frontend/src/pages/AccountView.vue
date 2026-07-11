<script setup lang="ts">
// Account: identity — who you are, what plan you're on, and the danger zone.
// Security (password) lives in /settings; usage numbers in /usage.
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { api, ApiError } from "@/api/client";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/AppShell.vue";
import UiButton from "@/components/ui/UiButton.vue";
import UiUserMenu from "@/components/ui/UiUserMenu.vue";

const router = useRouter();
const auth = useAuthStore();

// Two initials — from the name if set, else the email local part.
const initials = computed(() => {
  const source = auth.user?.name?.trim() || (auth.user?.email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._+-]+/).filter(Boolean);
  const s =
    parts.length >= 2
      ? (parts[0]![0] ?? "") + (parts[1]![0] ?? "")
      : source.slice(0, 2);
  return (s || "?").toUpperCase();
});

const deleting = ref(false);
const error = ref<string | null>(null);

async function deleteAccount(): Promise<void> {
  const email = auth.user?.email ?? "";
  const typed = prompt(
    `This permanently deletes your account, all your forms, and every response.\n\nType your email (${email}) to confirm:`,
  );
  if (typed === null) return;
  if (typed.trim().toLowerCase() !== email.toLowerCase()) {
    error.value = "Email didn't match — account not deleted.";
    return;
  }
  deleting.value = true;
  error.value = null;
  try {
    await api.deleteAccount();
    auth.user = null;
    router.replace({ name: "landing" });
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : "Failed to delete account.";
    deleting.value = false;
  }
}
</script>

<template>
  <AppShell>
    <header class="sticky top-0 z-20 border-b border-ink-200 bg-white">
      <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <h1 class="text-base font-semibold">Account</h1>
        <UiUserMenu />
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <!-- Profile -->
      <section
        class="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
        aria-label="Profile"
      >
        <div class="flex items-center gap-4">
          <span
            class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700"
            aria-hidden="true"
          >
            {{ initials }}
          </span>
          <div class="min-w-0">
            <p v-if="auth.user?.name" class="truncate font-semibold text-ink-900">{{ auth.user.name }}</p>
            <p class="truncate text-ink-500" :class="auth.user?.name ? 'text-sm' : 'font-semibold text-ink-900'">
              {{ auth.user?.email }}
            </p>
            <span
              class="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-sm font-medium capitalize text-brand-700"
            >
              {{ auth.user?.plan ?? "free" }} plan
            </span>
          </div>
        </div>
      </section>

      <!-- Plan -->
      <section
        class="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6"
        aria-label="Plan"
      >
        <h2 class="font-semibold text-ink-900">Plan</h2>
        <p class="mt-1 text-sm text-ink-500">
          You're on the <span class="capitalize">{{ auth.user?.plan ?? "free" }}</span> plan.
          See what you've used this month on the
          <router-link :to="{ name: 'usage' }" class="font-medium text-brand-700 hover:underline">usage page</router-link>.
        </p>
        <!-- ponytail: upgrade CTA is copy-only until billing (MoR) lands. -->
        <p v-if="(auth.user?.plan ?? 'free') === 'free'" class="mt-2 text-sm text-ink-500">
          Upgrading removes the "Made with" badge and lifts response limits — coming soon.
        </p>
      </section>

      <!-- Danger zone -->
      <section
        class="mt-6 rounded-2xl border border-red-200 bg-white p-5 shadow-card sm:p-6"
        aria-label="Danger zone"
      >
        <h2 class="font-semibold text-danger">Danger zone</h2>
        <p class="mt-1 text-sm text-ink-500">
          Deleting your account removes all your forms and every response,
          permanently. There is no undo.
        </p>
        <p
          v-if="error"
          role="alert"
          class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-danger"
        >
          {{ error }}
        </p>
        <UiButton variant="danger" class="mt-4" :disabled="deleting" @click="deleteAccount">
          {{ deleting ? "Deleting…" : "Delete account" }}
        </UiButton>
      </section>
    </main>
  </AppShell>
</template>
