<script setup lang="ts">
// Loads the routed form into the builder store, then hands off to BuilderApp
// (which reads the store). Keeps route/data concerns out of the builder UI.
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBuilderStore } from "@/stores/builder";
import AppShell from "@/components/AppShell.vue";
import BuilderApp from "@/components/builder/BuilderApp.vue";
import UiButton from "@/components/ui/UiButton.vue";

const route = useRoute();
const router = useRouter();
const builder = useBuilderStore();

function load(): void {
  void builder.loadForm(route.params.id as string);
}

onMounted(load);
watch(() => route.params.id, load);
</script>

<template>
  <AppShell :topbar="false">
    <BuilderApp v-if="builder.loaded" />
    <div
      v-else-if="builder.error"
      class="grid flex-1 place-items-center px-6 text-center"
    >
      <div>
        <h1 class="text-lg font-semibold text-ink-900">
          Couldn’t open this form
        </h1>
        <p class="mt-1 text-sm text-ink-500">{{ builder.error }}</p>
        <div class="mt-4 flex justify-center gap-2">
          <UiButton variant="secondary" @click="load">Retry</UiButton>
          <UiButton @click="router.push({ name: 'forms' })"
            >Back to forms</UiButton
          >
        </div>
      </div>
    </div>
    <div v-else class="grid flex-1 place-items-center text-sm text-ink-500">
      Loading form…
    </div>
  </AppShell>
</template>
