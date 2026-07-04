import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderStore } from './builder';

describe('builder store', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('adds a field, selects it, and gives selects default options', () => {
    const b = useBuilderStore();
    b.addField('single_select');
    expect(b.draft.fields).toHaveLength(1);
    expect(b.selectedId).toBe(b.draft.fields[0]!.id);
    expect(b.draft.fields[0]!.options).toHaveLength(2);
  });

  it('reorders fields with moveField', () => {
    const b = useBuilderStore();
    b.addField('short_text');
    b.addField('email');
    const [a, c] = b.draft.fields;
    b.moveField(0, 1);
    expect(b.draft.fields.map((f) => f.id)).toEqual([c!.id, a!.id]);
  });

  it('duplicates a field with a fresh id and fresh option ids', () => {
    const b = useBuilderStore();
    b.addField('multi_select');
    const original = b.draft.fields[0]!;
    b.duplicateField(original.id);
    expect(b.draft.fields).toHaveLength(2);
    const copy = b.draft.fields[1]!;
    expect(copy.id).not.toBe(original.id);
    expect(copy.options![0]!.id).not.toBe(original.options![0]!.id);
    expect(copy.options![0]!.label).toBe(original.options![0]!.label);
  });

  it('removes a field and clears selection', () => {
    const b = useBuilderStore();
    b.addField('number');
    const id = b.draft.fields[0]!.id;
    b.removeField(id);
    expect(b.draft.fields).toHaveLength(0);
    expect(b.selectedId).toBeNull();
  });

  it('exposes the draft as a preview FormVersion', () => {
    const b = useBuilderStore();
    b.addField('short_text');
    const v = b.previewVersion;
    expect(v.versionId).toBe('preview');
    expect(v.fields).toBe(b.draft.fields);
    expect(v.theme).toEqual(b.draft.theme);
  });
});
