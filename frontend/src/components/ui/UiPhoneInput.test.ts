import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import UiPhoneInput from './UiPhoneInput.vue';

describe('UiPhoneInput', () => {
  it('emits a canonical E.164 value for the selected country', async () => {
    const wrapper = mount(UiPhoneInput, { props: { modelValue: '' } });
    await wrapper.find('input[type="tel"]').setValue('2015550123');
    const events = wrapper.emitted('update:modelValue');
    expect(events).toBeTruthy();
    expect(events!.at(-1)![0]).toBe('+12015550123');
  });

  it('emits empty string when the number is blank (so required validation fires)', async () => {
    const wrapper = mount(UiPhoneInput, { props: { modelValue: '' } });
    await wrapper.find('input[type="tel"]').setValue('7');
    await wrapper.find('input[type="tel"]').setValue('');
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe('');
  });

  it('shows a validation message for an invalid number after blur', async () => {
    const wrapper = mount(UiPhoneInput, { props: { modelValue: '' } });
    const input = wrapper.find('input[type="tel"]');
    await input.setValue('12');
    expect(wrapper.text()).not.toContain('valid phone');
    await input.trigger('blur');
    expect(wrapper.text()).toContain('Enter a valid phone number');
  });

  it('parses an existing E.164 value into country + national number', () => {
    const wrapper = mount(UiPhoneInput, { props: { modelValue: '+442079460958' } });
    const input = wrapper.find('input[type="tel"]').element as HTMLInputElement;
    expect(input.value).toContain('7946');
    expect(wrapper.text()).toContain('+44');
  });
});
