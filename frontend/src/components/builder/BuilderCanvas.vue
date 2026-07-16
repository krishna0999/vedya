<script setup lang="ts">
// Center pane (edit mode): the draft's fields as selectable, reorderable cards.
// Reorder via native drag-and-drop (handle) with up/down buttons as a fallback.
import { ref } from "vue";
import type { Field } from "@schema";
import { metaFor } from "@/data/fieldTypes";
import { useBuilderStore } from "@/stores/builder";
import UiIcon from "@/components/ui/UiIcon.vue";

const builder = useBuilderStore();

const dragIndex = ref<number | null>(null);
const overIndex = ref<number | null>(null);

function typeLabel(field: Field): string {
  return metaFor(field.type)?.label ?? field.type;
}

function onDragStart(index: number, e: DragEvent): void {
  dragIndex.value = index;
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}
function onDragOver(index: number): void {
  overIndex.value = index;
}
function onDrop(index: number): void {
  if (dragIndex.value !== null) builder.moveField(dragIndex.value, index);
  dragIndex.value = null;
  overIndex.value = null;
}
function onDragEnd(): void {
  dragIndex.value = null;
  overIndex.value = null;
}
</script>

<template>
  <div class="mx-auto w-full max-w-2xl">
    <!-- empty state -->
    <div
      v-if="builder.draft.fields.length === 0"
      class="rounded-2xl border-2 border-dashed border-ink-200 bg-white/60 p-12 text-center"
    >
      <p class="text-ink-600">No fields yet.</p>
      <p class="mt-1 text-sm text-ink-500">
        Add fields from the palette on the left to start building.
      </p>
    </div>

    <ul v-else class="space-y-2.5">
      <li
        v-for="(field, i) in builder.draft.fields"
        :key="field.id"
        draggable="true"
        class="group rounded-xl border bg-white transition-colors duration-150"
        :class="[
          builder.selectedId === field.id
            ? 'border-brand-400 ring-2 ring-brand-100'
            : 'border-ink-200 hover:border-ink-300',
          overIndex === i && dragIndex !== null && dragIndex !== i
            ? 'border-brand-400'
            : '',
          dragIndex === i ? 'opacity-50' : '',
        ]"
        @dragstart="onDragStart(i, $event)"
        @dragover.prevent="onDragOver(i)"
        @drop="onDrop(i)"
        @dragend="onDragEnd"
        @click="builder.select(field.id)"
      >
        <div class="flex items-center gap-3 px-3 py-3">
          <span
            class="cursor-grab text-ink-300 transition-colors group-hover:text-ink-500"
            aria-hidden="true"
            title="Drag to reorder"
          >
            <UiIcon
              name="drag-dots"
              type="solid"
              viewBox="0 0 20 20"
              class="text-inherit h-5 w-5"
            />
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate font-medium text-ink-900">{{
                field.label || "(untitled)"
              }}</span>
              <span v-if="field.required" class="text-danger" title="Required"
                >*</span
              >
            </div>
            <div class="mt-0.5 flex items-center gap-2 text-sm text-ink-500">
              <span class="rounded bg-ink-100 px-1.5 py-0.5 text-ink-500">{{
                typeLabel(field)
              }}</span>
              <span v-if="field.options?.length"
                >{{ field.options.length }} options</span
              >
            </div>
          </div>

          <!-- Hover-reveal is desktop-only; touch screens have no hover, so the
               actions stay visible below lg. -->
          <div
            class="flex items-center gap-0.5 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
          >
            <button
              type="button"
              class="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40"
              title="Move up"
              :disabled="i === 0"
              @click.stop="builder.moveField(i, i - 1)"
            >
              <UiIcon name="chevron-up" class="text-inherit h-5 w-5" />
            </button>
            <button
              type="button"
              class="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40"
              title="Move down"
              :disabled="i === builder.draft.fields.length - 1"
              @click.stop="builder.moveField(i, i + 1)"
            >
              <UiIcon name="chevron-down" class="text-inherit h-5 w-5" />
            </button>
            <button
              type="button"
              class="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-700"
              title="Duplicate"
              @click.stop="builder.duplicateField(field.id)"
            >
              <UiIcon name="document-duplicate" class="text-inherit h-5 w-5" />
            </button>
            <button
              type="button"
              class="grid h-7 w-7 place-items-center rounded-md text-ink-500 hover:bg-red-50 hover:text-danger"
              title="Delete"
              @click.stop="builder.removeField(field.id)"
            >
              <UiIcon name="trash" class="text-inherit h-5 w-5" />
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
