<script setup lang="ts">
// Center pane (edit mode): the draft's fields as selectable, reorderable cards.
// Reorder via native drag-and-drop (handle) with up/down buttons as a fallback.
import { computed, ref } from "vue";
import type { Field, FieldType, FormVersion } from "@schema";
import { FIELD_CATEGORIES, FIELD_TYPES, metaFor } from "@/data/fieldTypes";
import { useBuilderStore } from "@/stores/builder";
import FormRenderer from "@/components/FormRenderer.vue";
import UiIcon from "@/components/ui/UiIcon.vue";

const builder = useBuilderStore();

const dragIndex = ref<number | null>(null);
const overIndex = ref<number | null>(null);

function typeLabel(field: Field): string {
  return metaFor(field.type)?.label ?? field.type;
}

// Each card previews its question exactly as respondents will see it: the real
// renderer, in the form's theme, made inert. The label is rendered by the card
// itself (editable in place when selected), so the preview gets it blank.
const previews = computed(
  () =>
    new Map<string, FormVersion>(
      builder.draft.fields.map((f) => [
        f.id,
        { ...builder.previewVersion, fields: [{ ...f, label: "" }] },
      ]),
    ),
);

// The card whose question text is being typed into: not draggable meanwhile,
// so selecting text with the mouse doesn't start a card drag.
const editingId = ref<string | null>(null);

// Compact chips for rules the preview can't show (lengths, ranges).
function ruleChips(field: Field): string[] {
  const chips: string[] = [];
  if (field.type === "rating") return chips; // the stars already show the max
  const v = field.validation;
  if (v) {
    if (v.min !== undefined) chips.push(`min ${v.min}`);
    if (v.max !== undefined) chips.push(`max ${v.max}`);
    if (v.minLength !== undefined) chips.push(`min ${v.minLength} chars`);
    if (v.maxLength !== undefined) chips.push(`max ${v.maxLength} chars`);
    if (v.pattern) chips.push("pattern");
  }
  return chips;
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

// Between-fields "+" — which gap's type menu is open (insert index), if any.
// ponytail: inline menu, no popover positioning; grouped same as the palette.
const addAt = ref<number | null>(null);
const addGroups = FIELD_CATEGORIES.map((category) => ({
  category,
  types: FIELD_TYPES.filter((t) => t.category === category),
}));
function insertField(type: FieldType): void {
  if (addAt.value !== null) builder.addField(type, addAt.value);
  addAt.value = null;
}

const dragging = computed(() => dragIndex.value !== null);
</script>

<template>
  <div class="mx-auto w-full max-w-3xl">
    <!-- empty state -->
    <div
      v-if="builder.draft.fields.length === 0"
      class="rounded-md border-2 border-dashed border-line-200 bg-white/60 p-12 text-center"
    >
      <p class="text-ink-600">No fields yet.</p>
      <p class="mt-1 text-sm text-ink-500">
        Add fields from the palette on the left to start building.
      </p>
    </div>

    <TransitionGroup
      v-else
      tag="ul"
      class="relative space-y-2.5"
      move-class="transition-transform duration-200 ease-soft"
      enter-active-class="transition duration-200 ease-soft"
      enter-from-class="opacity-0 translate-y-1.5"
      leave-active-class="absolute w-full transition duration-150 ease-soft"
      leave-to-class="opacity-0 scale-[0.98]"
    >
      <li
        v-for="(field, i) in builder.draft.fields"
        :key="field.id"
        :draggable="editingId !== field.id"
        class="group relative rounded-md border bg-white transition-[border-color,box-shadow,opacity] duration-150 ease-soft"
        :class="[
          builder.selectedId === field.id
            ? 'border-brand-400 shadow-card ring-2 ring-brand-100'
            : 'border-line-200 hover:border-line-300 hover:shadow-card',
          overIndex === i && dragIndex !== null && dragIndex !== i
            ? 'border-brand-400 ring-2 ring-brand-200'
            : '',
          dragIndex === i ? 'opacity-40' : '',
        ]"
        @dragstart="onDragStart(i, $event)"
        @dragover.prevent="onDragOver(i)"
        @drop="onDrop(i)"
        @dragend="onDragEnd"
        @click="builder.select(field.id)"
      >
        <!-- Selected: left accent strip -->
        <span
          v-if="builder.selectedId === field.id"
          class="absolute bottom-2 left-0 top-2 w-1 rounded-r-md bg-brand-500"
          aria-hidden="true"
        ></span>

        <!-- Between-fields add: hover-reveal "+" in the gap above this card.
             Hidden while dragging so it doesn't fight the drop targets;
             desktop-only (touch has no hover — mobile adds via the sheet). -->
        <div
          v-if="i > 0 && !dragging"
          class="absolute inset-x-0 -top-3 z-10 hidden h-3.5 items-center justify-center opacity-0 transition-opacity duration-150 focus-within:opacity-100 hover:opacity-100 lg:flex"
        >
          <button
            type="button"
            class="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            :aria-label="`Insert field at position ${i + 1}`"
            @click.stop="addAt = addAt === i ? null : i"
          >
            <UiIcon name="plus" class="text-inherit h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Click-outside catcher for the insert menu -->
        <div
          v-if="addAt === i"
          class="fixed inset-0 z-10 cursor-default"
          @click.stop="addAt = null"
        ></div>

        <!-- Insert-type menu for this gap -->
        <div
          v-if="addAt === i"
          class="absolute inset-x-0 top-0 z-20 -translate-y-2 rounded-md border border-line-200 bg-white p-3 shadow-pop"
          @click.stop
          @keydown.escape="addAt = null"
        >
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs font-medium uppercase tracking-wide text-ink-500"
              >Insert field</span
            >
            <button
              type="button"
              class="rounded-md p-0.5 text-ink-400 hover:text-ink-600"
              aria-label="Close"
              @click="addAt = null"
            >
              <UiIcon name="x-mark" class="text-inherit h-4 w-4" />
            </button>
          </div>
          <div
            v-for="g in addGroups"
            :key="g.category"
            class="mt-1.5 flex flex-wrap gap-1"
          >
            <button
              v-for="t in g.types"
              :key="t.type"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md bg-ink-50 px-2 py-1 text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              @click="insertField(t.type)"
            >
              <UiIcon :name="t.icon" class="text-inherit h-4 w-4" />
              {{ t.label }}
            </button>
          </div>
        </div>

        <div class="flex items-start gap-3 py-3.5 pl-4 pr-3">
          <!-- Drag handle: hover-reveal on desktop; always visible on touch. -->
          <span
            class="cursor-grab text-ink-300 transition-opacity duration-150 active:cursor-grabbing group-hover:text-ink-500 lg:opacity-0 lg:group-hover:opacity-100"
            :class="builder.selectedId === field.id ? 'lg:opacity-100' : ''"
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
            <div class="flex items-start gap-1">
              <input
                v-if="builder.selectedId === field.id"
                :value="field.label"
                type="text"
                placeholder="Question"
                :aria-label="`Question ${i + 1}`"
                class="w-full rounded-md border-0 bg-transparent px-1 py-0.5 -mx-1 font-medium text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                @click.stop
                @focus="editingId = field.id"
                @blur="editingId = null"
                @input="
                  builder.updateField(field.id, {
                    label: ($event.target as HTMLInputElement).value,
                  })
                "
              />
              <span
                v-else
                class="line-clamp-2 break-words py-0.5 font-medium text-ink-900"
                :class="field.type === 'section_break' && 'text-lg'"
                >{{ field.label || "(untitled)" }}</span
              >
              <span
                v-if="field.required"
                class="py-0.5 text-danger"
                aria-label="Required"
                >*</span
              >
            </div>

            <!-- What respondents see (section breaks are just the heading) -->
            <div
              v-if="field.type !== 'section_break'"
              inert
              class="pointer-events-none mt-2 [&_.mb-7]:mb-0"
            >
              <FormRenderer :version="previews.get(field.id)!" hide-submit />
            </div>
            <p
              v-else-if="field.description"
              class="mt-0.5 text-sm text-ink-500"
            >
              {{ field.description }}
            </p>

            <div
              class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-500"
            >
              <span class="rounded-md bg-ink-100 px-1.5 py-0.5">{{
                typeLabel(field)
              }}</span>
              <span
                v-for="chip in ruleChips(field)"
                :key="chip"
                class="rounded-md bg-ink-100 px-1.5 py-0.5"
                >{{ chip }}</span
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
    </TransitionGroup>
  </div>
</template>
