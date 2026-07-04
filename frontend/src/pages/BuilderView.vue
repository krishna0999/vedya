<script setup lang="ts">
// Loads the routed form into the builder store, then hands off to BuilderApp
// (which reads the store). Keeps route/data concerns out of the builder UI.
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBuilderStore } from '@/stores/builder';
import BuilderApp from '@/components/builder/BuilderApp.vue';
import UiButton from '@/components/ui/UiButton.vue';

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
  <div v-if="builder.loaded" class="h-screen">
    <BuilderApp />
  </div>
  <div v-else-if="builder.error" class="grid min-h-screen place-items-center bg-ink-50 px-6 text-center">
    <div>
      <h1 class="text-lg font-semibold text-ink-900">Couldn’t open this form</h1>
      <p class="mt-1 text-sm text-ink-500">{{ builder.error }}</p>
      <div class="mt-4 flex justify-center gap-2">
        <UiButton variant="secondary" @click="load">Retry</UiButton>
        <UiButton @click="router.push({ name: 'dashboard' })">Back to forms</UiButton>
      </div>
    </div>
  </div>
  <div v-else class="grid min-h-screen place-items-center bg-ink-50 text-sm text-ink-400">Loading form…</div>
</template>
