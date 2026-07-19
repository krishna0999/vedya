import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import FormCardPreview from './FormCardPreview.vue';
import type { Field } from '@schema';

// The exact shape the /api/templates "Contact us" card sends down.
const contactUsFields: Field[] = [
  { id: 'name', type: 'short_text', label: 'Your name', required: true, placeholder: 'Jane Doe' },
  { id: 'email', type: 'email', label: 'Email address', required: true, placeholder: 'you@example.com' },
  { id: 'subject', type: 'short_text', label: 'Subject', required: false },
  { id: 'message', type: 'long_text', label: 'Message', required: true, placeholder: 'How can we help?' },
];

describe('FormCardPreview', () => {
  it('renders the first two question labels as a teaser', () => {
    const w = mount(FormCardPreview, { props: { fields: contactUsFields } });
    expect(w.text()).toContain('Your name');
    expect(w.text()).toContain('Email address');
    // Capped at two so the fixed-height tile never clips a question.
    expect(w.text()).not.toContain('Subject');
  });

  it('shows the empty state when there are no fields', () => {
    const w = mount(FormCardPreview, { props: { fields: [] } });
    expect(w.text()).toContain('No questions yet');
  });
});
