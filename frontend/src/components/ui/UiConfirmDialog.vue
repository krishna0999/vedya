<script setup lang="ts">
// Product-chrome confirmation dialog for destructive actions (delete form,
// delete account…). Same overlay idiom as the AI modal in FormsView.
// Extra body content (e.g. a type-to-confirm input) goes in the default slot.
import { nextTick, ref, watch } from "vue";
import UiButton from "./UiButton.vue";
import UiIcon from "./UiIcon.vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmDisabled?: boolean;
    confirmVariant?: "danger" | "primary";
  }>(),
  { confirmLabel: "Delete", cancelLabel: "Cancel", confirmVariant: "danger" },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();

// Move focus into the dialog on open so Escape works immediately.
const cancelBtn = ref<InstanceType<typeof UiButton> | null>(null);
watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    await nextTick();
    (cancelBtn.value?.$el as HTMLButtonElement | undefined)?.focus();
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 pt-[20vh]"
      @click.self="emit('cancel')"
      @keydown.esc="emit('cancel')"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        :aria-label="title"
        class="w-full max-w-xl rounded-2xl border border-line-200 bg-white p-6 shadow-pop"
      >
        <div class="flex items-start justify-between gap-3">
          <h2 class="font-semibold text-ink-900">{{ title }}</h2>
          <button
            type="button"
            class="-m-2 shrink-0 rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Close"
            @click="emit('cancel')"
          >
            <UiIcon name="x-mark" class="text-inherit h-5 w-5" />
          </button>
        </div>

        <p v-if="message" class="mt-3 text-sm text-ink-500">{{ message }}</p>
        <slot />

        <div class="mt-6 flex items-center justify-end gap-2">
          <UiButton ref="cancelBtn" variant="ghost" @click="emit('cancel')">
            {{ cancelLabel }}
          </UiButton>
          <UiButton
            :variant="confirmVariant"
            :disabled="confirmDisabled"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
