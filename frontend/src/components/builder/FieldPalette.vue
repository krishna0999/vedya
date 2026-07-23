<script setup lang="ts">
// Left pane: searchable grid of field-type cards; click one to append a field
// to the draft.
import { computed, ref } from "vue";
import type { FieldType } from "@schema";
import { FIELD_CATEGORIES, FIELD_TYPES } from "@/data/fieldTypes";
import { useBuilderStore } from "@/stores/builder";
import UiIcon from "@/components/ui/UiIcon.vue";
import UiSearchInput from "@/components/ui/UiSearchInput.vue";

const builder = useBuilderStore();

// Parents listen so mobile presentations (bottom sheet) can close after an add.
const emit = defineEmits<{ add: [type: FieldType] }>();

const query = ref("");
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return FIELD_TYPES;
  return FIELD_TYPES.filter((t) => t.label.toLowerCase().includes(q));
});

// Grouped for display; a category disappears entirely when search empties it.
const groups = computed(() =>
  FIELD_CATEGORIES.map((category) => ({
    category,
    types: filtered.value.filter((t) => t.category === category),
  })).filter((g) => g.types.length > 0),
);

function add(type: FieldType): void {
  builder.addField(type);
  emit("add", type);
}
</script>

<template>
  <!-- Layout-agnostic: the parent sets width/borders (sidebar on lg+, bottom
       sheet below — the sheet brings its own header, so ours hides there). -->
  <aside class="overflow-y-auto bg-white p-4">
    <h2 class="mb-2.5 hidden text-sm font-semibold text-ink-900 lg:block">
      Fields
    </h2>
    <UiSearchInput
      v-model="query"
      placeholder="Search fields"
      aria-label="Search fields"
    />

    <div v-for="g in groups" :key="g.category" class="mt-4 first:mt-3">
      <h3
        class="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-500"
      >
        {{ g.category }}
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="t in g.types"
          :key="t.type"
          type="button"
          class="flex flex-col items-center justify-center gap-2.5 rounded-xl bg-ink-50 px-2 py-5 text-center text-sm font-medium text-ink-700 transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          @click="add(t.type)"
        >
          <UiIcon :name="t.icon" class="text-inherit h-5 w-5" />
          {{ t.label }}
        </button>
      </div>
    </div>

    <p
      v-if="filtered.length === 0"
      class="mt-4 text-center text-sm text-ink-500"
    >
      No fields match “{{ query }}”.
    </p>
  </aside>
</template>
