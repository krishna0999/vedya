<script setup lang="ts">
// The "generate a form with AI" dialog — identical on the dashboard and /forms,
// so it lives here rather than being pasted into both. <AiGenerateForm> owns the
// prompt + request and redirects to the builder on success.
import AiGenerateForm from "@/components/AiGenerateForm.vue";
import UiIcon from "@/components/ui/UiIcon.vue";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [value: boolean] }>();
const close = (): void => emit("update:open", false);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 pt-[10vh]"
      @click.self="close"
      @keydown.esc="close"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Generate a form with AI"
        class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <span
              class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"
              aria-hidden="true"
            >
              <UiIcon name="sparkles" class="text-inherit h-5 w-5" />
            </span>
            <h2 class="font-semibold text-ink-900">Generate a form with AI</h2>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Close"
            @click="close"
          >
            <UiIcon name="x-mark" class="text-inherit h-5 w-5" />
          </button>
        </div>

        <p class="mt-1 text-sm text-ink-500">
          Describe what you need - fields, choices, validation and get an
          editable draft in seconds.
        </p>

        <AiGenerateForm autofocus class="mt-3" />
      </div>
    </div>
  </Teleport>
</template>
