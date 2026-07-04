// Builder state: the editable FormDraft + selection. Thin store — no business
// logic beyond mutating the draft (validation lives in the shared schema).
import { defineStore } from 'pinia';
import type { Field, FieldType, FormDraft, FormVersion, Theme } from '@schema';
import { makeField } from '@/data/fieldTypes';

const DEFAULT_THEME: Theme = {
  primaryColor: '#4f46e5',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 10,
};

function uuid(): string {
  return crypto.randomUUID();
}

function emptyDraft(): FormDraft {
  return {
    id: uuid(),
    ownerId: 'local', // real owner arrives with auth (step 5)
    title: 'Untitled form',
    fields: [],
    theme: { ...DEFAULT_THEME },
    updatedAt: new Date().toISOString(),
  };
}

export const useBuilderStore = defineStore('builder', {
  state: () => ({
    draft: emptyDraft(),
    selectedId: null as string | null,
  }),
  getters: {
    selectedField(state): Field | null {
      return state.draft.fields.find((f) => f.id === state.selectedId) ?? null;
    },
    // The draft rendered as a FormVersion so <FormRenderer> can preview it.
    previewVersion(state): FormVersion {
      return {
        versionId: 'preview',
        formId: state.draft.id,
        version: 0,
        fields: state.draft.fields,
        theme: state.draft.theme,
        publishedAt: new Date().toISOString(),
      };
    },
  },
  actions: {
    touch() {
      this.draft.updatedAt = new Date().toISOString();
    },
    setTitle(title: string) {
      this.draft.title = title;
      this.touch();
    },
    setTheme(patch: Partial<Theme>) {
      this.draft.theme = { ...this.draft.theme, ...patch };
      this.touch();
    },
    addField(type: FieldType) {
      const field = makeField(type);
      this.draft.fields.push(field);
      this.selectedId = field.id;
      this.touch();
    },
    updateField(id: string, patch: Partial<Field>) {
      const field = this.draft.fields.find((f) => f.id === id);
      if (!field) return;
      Object.assign(field, patch);
      this.touch();
    },
    removeField(id: string) {
      const at = this.draft.fields.findIndex((f) => f.id === id);
      if (at < 0) return;
      this.draft.fields.splice(at, 1);
      if (this.selectedId === id) this.selectedId = null;
      this.touch();
    },
    duplicateField(id: string) {
      const at = this.draft.fields.findIndex((f) => f.id === id);
      if (at < 0) return;
      const source = this.draft.fields[at]!;
      const copy: Field = JSON.parse(JSON.stringify(source));
      copy.id = uuid();
      if (copy.options) copy.options = copy.options.map((o) => ({ ...o, id: uuid() }));
      this.draft.fields.splice(at + 1, 0, copy);
      this.selectedId = copy.id;
      this.touch();
    },
    moveField(from: number, to: number) {
      const { fields } = this.draft;
      if (from < 0 || from >= fields.length || to < 0 || to >= fields.length || from === to) return;
      const [moved] = fields.splice(from, 1);
      fields.splice(to, 0, moved!);
      this.touch();
    },
    select(id: string | null) {
      this.selectedId = id;
    },
  },
});
