import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import FormRenderer from './FormRenderer.vue';
import type { FormVersion } from '@schema';

function versionOf(): FormVersion {
  return {
    versionId: 'v1',
    formId: 'f1',
    version: 1,
    publishedAt: '2026-07-04T00:00:00.000Z',
    theme: { primaryColor: '#4f46e5', fontFamily: 'Inter', borderRadius: 8 },
    fields: [
      { id: 'name', type: 'short_text', label: 'Name', required: true },
      { id: 'age', type: 'number', label: 'Age', required: true, validation: { min: 1 } },
    ],
  };
}

describe('FormRenderer', () => {
  it('blocks submit and shows errors when a required field is empty', async () => {
    const wrapper = mount(FormRenderer, { props: { version: versionOf() } });
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain('required');
  });

  it('emits typed answers on a valid submit (number coerced from input string)', async () => {
    const wrapper = mount(FormRenderer, { props: { version: versionOf() } });
    await wrapper.find('#name').setValue('Ada');
    await wrapper.find('#age').setValue('42');
    await wrapper.find('form').trigger('submit');

    const events = wrapper.emitted('submit');
    expect(events).toBeTruthy();
    const payload = events![0]![0] as Record<string, unknown>;
    expect(payload.name).toBe('Ada');
    expect(payload.age).toBe(42);
    expect(typeof payload.age).toBe('number');
  });

  it('does not emit until validation passes, then does after fixing the error', async () => {
    const wrapper = mount(FormRenderer, { props: { version: versionOf() } });
    await wrapper.find('#name').setValue('Ada');
    await wrapper.find('#age').setValue('0'); // below min
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain('at least 1');

    await wrapper.find('#age').setValue('3');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeTruthy();
  });
});
