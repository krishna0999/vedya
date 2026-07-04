import type { FormVersion } from '@schema';

// A hand-authored FormVersion exercising every field type — the §4.2 way to
// prove the renderer end to end before any builder exists.
export const sampleForm: FormVersion = {
  versionId: 'ver_demo_1',
  formId: 'form_demo',
  version: 1,
  publishedAt: '2026-07-04T00:00:00.000Z',
  theme: { primaryColor: '#4f46e5', fontFamily: 'Inter, system-ui, sans-serif', borderRadius: 10 },
  fields: [
    { id: 'full_name', type: 'short_text', label: 'Full name', required: true, placeholder: 'Ada Lovelace' },
    { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'you@example.com' },
    { id: 'phone', type: 'phone', label: 'Phone', required: false, placeholder: '+1 555 0100' },
    {
      id: 'bio',
      type: 'long_text',
      label: 'Short bio',
      required: false,
      description: 'A sentence or two about yourself.',
      validation: { maxLength: 280 },
    },
    { id: 'party_size', type: 'number', label: 'Party size', required: true, validation: { min: 1, max: 12 } },
    {
      id: 'event_date',
      type: 'date',
      label: 'Preferred date',
      required: true,
      date: { mode: 'single', showPresets: true, presets: [{ label: 'Today', offsetDays: 0 }, { label: 'Tomorrow', offsetDays: 1 }] },
    },
    {
      id: 'stay_dates',
      type: 'date',
      label: 'Dates of stay',
      required: false,
      description: 'Pick a check-in and check-out date.',
      date: { mode: 'range', showPresets: false, presets: [] },
    },
    {
      id: 'plan',
      type: 'single_select',
      label: 'Plan',
      required: true,
      options: [
        { id: 'opt_free', label: 'Free', value: 'free', description: 'For trying things out — 100 responses/mo.' },
        { id: 'opt_pro', label: 'Pro', value: 'pro', description: 'For individuals — unlimited responses, no badge.' },
        { id: 'opt_team', label: 'Team', value: 'team', description: 'For teams — shared workspace and roles.' },
      ],
    },
    {
      id: 'stack',
      type: 'multi_dropdown',
      label: 'Which tools do you use?',
      required: false,
      placeholder: 'Search and select…',
      options: [
        { id: 's_vue', label: 'Vue' },
        { id: 's_react', label: 'React' },
        { id: 's_svelte', label: 'Svelte' },
        { id: 's_node', label: 'Node' },
        { id: 's_postgres', label: 'Postgres' },
        { id: 's_figma', label: 'Figma' },
      ],
    },
    {
      id: 'interests',
      type: 'multi_select',
      label: 'Interests',
      required: false,
      description: 'Pick up to two.',
      validation: { max: 2 },
      options: [
        { id: 'i_design', label: 'Design' },
        { id: 'i_code', label: 'Code' },
        { id: 'i_data', label: 'Data' },
      ],
    },
    {
      id: 'referral',
      type: 'dropdown',
      label: 'How did you hear about us?',
      required: false,
      options: [
        { id: 'r_search', label: 'Search', value: 'search' },
        { id: 'r_friend', label: 'A friend', value: 'friend' },
        { id: 'r_social', label: 'Social media', value: 'social' },
      ],
    },
    { id: 'sec_feedback', type: 'section_break', label: 'Feedback', required: false, description: 'Optional — help us improve.' },
    { id: 'satisfaction', type: 'rating', label: 'How satisfied are you?', required: false, validation: { min: 1, max: 5 } },
  ],
};
