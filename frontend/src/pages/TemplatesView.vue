<script setup lang="ts">
// Public template gallery at /templates: the same gallery owners see in the
// app, open to everyone so search engines and visitors can browse it. The
// static, crawlable version of this page is prerendered at build time
// (scripts/prerender.ts); this is what takes over once the app loads.
import { useTemplateAction } from "@/lib/useTemplate";
import MarketingShell from "@/components/MarketingShell.vue";
import TemplateGallery from "@/components/TemplateGallery.vue";

const { busy, error, use } = useTemplateAction();
</script>

<template>
  <MarketingShell>
    <div class="mb-6 mt-4">
      <h1 class="page-title">Free form templates</h1>
      <p class="page-subtitle">
        Start from a ready-made form, then change anything. Free to use, no card
        needed.
      </p>
    </div>
    <p
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>
    <TemplateGallery :busy="busy" @use="use" />
  </MarketingShell>
</template>
