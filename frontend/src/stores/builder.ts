// Builder state: the editable FormDraft + selection, now backed by the API.
// Mutations stay thin; persistence is a debounced autosave triggered from
// touch(), so every existing action transparently saves. Validation still lives
// only in the shared schema.
import { defineStore } from 'pinia';
import type { Field, FieldType, FormDraft, FormVersion, Theme } from '@schema';
import { makeField } from '@/data/fieldTypes';
import { api } from '@/api/client';

// Exported so other surfaces that render an ad-hoc preview FormVersion (e.g.
// the template gallery) use the same defaults as a fresh draft.
export const DEFAULT_THEME: Theme = {
  primaryColor: '#047857',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 10,
};

function uuid(): string {
  return crypto.randomUUID();
}

function emptyDraft(): FormDraft {
  return {
    id: uuid(),
    ownerId: 'local',
    title: 'Untitled form',
    fields: [],
    theme: { ...DEFAULT_THEME },
    updatedAt: new Date().toISOString(),
  };
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type PublishStatus = 'idle' | 'publishing' | 'published' | 'error';

// Debounce handle kept at module scope so it survives across action calls.
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const SAVE_DEBOUNCE_MS = 600;

export const useBuilderStore = defineStore('builder', {
  state: () => ({
    draft: emptyDraft(),
    selectedId: null as string | null,
    loaded: false, // true once a real form is loaded from the API
    saveStatus: 'idle' as SaveStatus,
    // Edits since the last publish. Autosave keeps the draft persisted
    // regardless; this only tracks the published snapshot.
    dirty: false,
    published: false, // a version is live at /f/:id
    publishStatus: 'idle' as PublishStatus,
    lastPublished: null as FormVersion | null,
    error: null as string | null,
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
    // Load an existing form from the API into the builder.
    async loadForm(id: string) {
      this.loaded = false;
      this.error = null;
      this.publishStatus = 'idle';
      this.lastPublished = null;
      try {
        const { published, ...draft } = await api.getForm(id);
        this.draft = draft;
        this.published = published;
        this.selectedId = null;
        this.saveStatus = 'saved';
        this.dirty = false;
        this.loaded = true;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load form.';
      }
    },

    // Debounced autosave. Called from touch(); a no-op until a form is loaded.
    scheduleSave() {
      if (!this.loaded) return;
      this.saveStatus = 'saving';
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        void this.persistNow();
      }, SAVE_DEBOUNCE_MS);
    },

    // Flush the draft to the server immediately (used before publish + on demand).
    async persistNow() {
      if (!this.loaded) return;
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
      }
      try {
        await api.updateForm(this.draft.id, {
          title: this.draft.title,
          category: this.draft.category,
          fields: this.draft.fields,
          theme: this.draft.theme,
        });
        this.saveStatus = 'saved';
      } catch (err) {
        this.saveStatus = 'error';
        this.error = err instanceof Error ? err.message : 'Failed to save.';
      }
    },

    // Snapshot the current draft into a new immutable published version. Flushes
    // any pending edits first so the published version is never stale.
    async publish() {
      this.publishStatus = 'publishing';
      this.error = null;
      try {
        await this.persistNow();
        this.lastPublished = await api.publishForm(this.draft.id);
        this.publishStatus = 'published';
        this.published = true;
        this.dirty = false;
      } catch (err) {
        this.publishStatus = 'error';
        this.error = err instanceof Error ? err.message : 'Failed to publish.';
      }
    },

    touch() {
      this.draft.updatedAt = new Date().toISOString();
      this.dirty = true;
      this.scheduleSave();
    },
    setTitle(title: string) {
      this.draft.title = title;
      this.touch();
    },
    setCategory(category: string) {
      // Empty string clears the type back to none.
      this.draft.category = category || undefined;
      this.touch();
    },
    setTheme(patch: Partial<Theme>) {
      this.draft.theme = { ...this.draft.theme, ...patch };
      this.touch();
    },
    // Append by default; `at` inserts at a position (the between-fields "+").
    addField(type: FieldType, at?: number) {
      const field = makeField(type);
      if (at === undefined) this.draft.fields.push(field);
      else this.draft.fields.splice(at, 0, field);
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
