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
  it('falls back to document order when no field is distinctive', () => {
    const w = mount(FormCardPreview, { props: { fields: contactUsFields } });
    expect(w.text()).toContain('Your name');
    expect(w.text()).toContain('Email address');
    // Capped at two so the fixed-height tile never clips a question.
    expect(w.text()).not.toContain('Subject');
  });

  it('surfaces the questions that define the form, not just the first two', () => {
    // A feedback form: generic name/email first, then the rating that gives it
    // its character. The rating should win a preview slot over the email.
    const feedback: Field[] = [
      { id: 'name', type: 'short_text', label: 'Your name', required: false },
      { id: 'email', type: 'email', label: 'Email address', required: false },
      { id: 'stars', type: 'rating', label: 'How was your experience?', required: true },
    ];
    const w = mount(FormCardPreview, { props: { fields: feedback } });
    expect(w.text()).toContain('Your name'); // first defining-less field kept
    expect(w.text()).toContain('How was your experience?'); // distinctive, surfaced
    expect(w.text()).not.toContain('Email address');
  });

  it('shows the empty-state call to action when there are no fields', () => {
    const w = mount(FormCardPreview, { props: { fields: [] } });
    expect(w.text()).toContain('Add your first question');
  });
});
