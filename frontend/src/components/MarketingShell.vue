<script setup lang="ts">
// Header + footer for public, signed-out-friendly pages (the template gallery
// and template pages). The session is resolved lazily so these pages never wait
// on the API; a signed-in visitor sees "Dashboard" instead of the auth buttons.
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import UiButton from "@/components/ui/UiButton.vue";
import UiLogo from "@/components/ui/UiLogo.vue";

const auth = useAuthStore();
onMounted(() => {
  if (!auth.ready) void auth.init();
});
</script>

<template>
  <div class="min-h-screen bg-ink-50 text-ink-900">
    <header
      class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
    >
      <router-link to="/" aria-label="Vedya home"><UiLogo /></router-link>
      <nav class="flex items-center gap-2">
        <router-link
          :to="{ name: 'templates' }"
          class="hidden px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 sm:inline"
          >Templates</router-link
        >
        <router-link v-if="auth.user" :to="{ name: 'dashboard' }">
          <UiButton size="sm">Dashboard</UiButton>
        </router-link>
        <template v-else>
          <router-link :to="{ name: 'login' }">
            <UiButton variant="ghost" size="sm">Log in</UiButton>
          </router-link>
          <router-link :to="{ name: 'signup' }">
            <UiButton size="sm">Sign up</UiButton>
          </router-link>
        </template>
      </nav>
    </header>

    <main class="mx-auto max-w-6xl px-6 pb-12">
      <slot />
    </main>

    <footer
      class="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-ink-500"
    >
      © 2026 Vedya
      <nav class="mt-2 flex justify-center gap-4" aria-label="Footer">
        <router-link :to="{ name: 'templates' }" class="hover:text-ink-700"
          >Templates</router-link
        >
        <!-- <router-link :to="{ name: 'privacy' }" class="hover:text-ink-700"
          >Privacy</router-link
        >
        <router-link :to="{ name: 'terms' }" class="hover:text-ink-700"
          >Terms</router-link
        > -->
        <a href="mailto:support@vedya.app" class="hover:text-ink-700"
          >Contact</a
        >
      </nav>
    </footer>
  </div>
</template>
