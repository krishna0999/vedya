<script setup lang="ts">
// Password field with a show/hide toggle. Everything passed to it (id, class,
// autocomplete, placeholder…) lands on the <input>, so it drops in wherever a
// plain password input was. The toggle is a real button: keyboard-reachable,
// labelled, and reports its state via aria-pressed.
import { ref } from "vue";
import UiIcon from "./UiIcon.vue";

defineOptions({ inheritAttrs: false });
const model = defineModel<string>({ required: true });
const visible = ref(false);
</script>

<template>
  <div class="relative">
    <input
      v-bind="$attrs"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      class="pr-10"
      autocapitalize="off"
      spellcheck="false"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-ink-500 transition-colors hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <UiIcon :name="visible ? 'eye-slash' : 'eye'" class="h-5 w-5 text-inherit" />
    </button>
  </div>
</template>
