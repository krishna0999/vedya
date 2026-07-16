// Starter template catalog (ROADMAP Phase 1). A template is just a seeded set of
// schema Fields + a title — the same FormDraft shape the builder emits, so the
// renderer/validator consume it unchanged. Field/option ids here are stable,
// human-readable slugs (valid for preview); services/templates regenerates them
// into fresh UUIDs on instantiation so every created form owns its identity.
//
// This is a small, credible starter set across the categories in the roadmap —
// not the eventual "hundreds." Growing it is a content task, not an eng task:
// add an entry here and it shows up in the gallery.
import type { Field, FieldType, Theme } from '../schema/index';

export interface FormTemplate {
  id: string; // stable slug, e.g. 'contact-us'
  title: string;
  category: string;
  description: string;
  icon: string; // emoji shown on the gallery card
  // Curated gallery merchandising — set by hand, not measured.
  badge?: 'Popular' | 'Trending';
  stat?: string; // e.g. 'Used 12k+ times'
  fields: Field[];
  theme?: Partial<Theme>;
}

// Terse field builder — fills the `required: false` default and keeps template
// authoring readable. Every field still ends up a fully-valid schema Field.
function f(
  id: string,
  type: FieldType,
  label: string,
  extra: Partial<Omit<Field, 'id' | 'type' | 'label'>> = {},
): Field {
  return { id, type, label, required: false, ...extra };
}

const opt = (id: string, label: string) => ({ id, label });

export const TEMPLATES: FormTemplate[] = [
  {
    id: 'contact-us',
    title: 'Contact us',
    category: 'Customer Support',
    description: 'A simple way for visitors to reach you.',
    icon: '✉️',
    badge: 'Popular',
    stat: 'Used 12k+ times',
    fields: [
      f('name', 'short_text', 'Your name', { required: true, placeholder: 'Jane Doe' }),
      f('email', 'email', 'Email address', { required: true, placeholder: 'you@example.com' }),
      f('subject', 'short_text', 'Subject'),
      f('message', 'long_text', 'Message', { required: true, placeholder: 'How can we help?' }),
    ],
  },
  {
    id: 'event-rsvp',
    title: 'Event RSVP',
    category: 'Events',
    description: 'Collect headcount and dietary needs for your event.',
    icon: '🎉',
    stat: 'Used 6k+ times',
    fields: [
      f('name', 'short_text', 'Full name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('attending', 'single_select', 'Will you attend?', {
        required: true,
        options: [opt('yes', 'Joyfully accepts'), opt('no', 'Regretfully declines')],
      }),
      f('guests', 'number', 'Number of guests', { validation: { min: 0, max: 10 } }),
      f('dietary', 'multi_select', 'Dietary restrictions', {
        options: [
          opt('veg', 'Vegetarian'),
          opt('vegan', 'Vegan'),
          opt('gf', 'Gluten-free'),
          opt('none', 'None'),
        ],
      }),
    ],
  },
  {
    id: 'csat-survey',
    title: 'Customer satisfaction survey',
    category: 'Marketing',
    description: 'Measure how happy customers are with your product or service.',
    icon: '⭐',
    fields: [
      f('rating', 'rating', 'How would you rate your experience?', {
        required: true,
        validation: { max: 5 },
      }),
      f('recommend', 'single_select', 'How likely are you to recommend us?', {
        options: [
          opt('very', 'Very likely'),
          opt('somewhat', 'Somewhat likely'),
          opt('not', 'Not likely'),
        ],
      }),
      f('what_liked', 'long_text', 'What did you like most?'),
      f('what_improve', 'long_text', 'What could we improve?'),
    ],
  },
  {
    id: 'job-application',
    title: 'Job application',
    category: 'HR',
    description: 'Take applications for an open role.',
    icon: '💼',
    badge: 'Trending',
    fields: [
      f('name', 'short_text', 'Full name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('phone', 'phone', 'Phone number'),
      f('role', 'dropdown', 'Position applying for', {
        required: true,
        options: [
          opt('eng', 'Engineering'),
          opt('design', 'Design'),
          opt('sales', 'Sales'),
          opt('support', 'Customer Support'),
        ],
      }),
      f('linkedin', 'short_text', 'LinkedIn / portfolio URL'),
      f('cover', 'long_text', 'Why are you a good fit?'),
      f('start', 'date', 'Earliest start date', {
        date: { mode: 'single', showPresets: false, presets: [] },
      }),
    ],
  },
  {
    id: 'newsletter-signup',
    title: 'Newsletter signup',
    category: 'Marketing',
    description: 'Grow your mailing list with a clean signup form.',
    icon: '📬',
    badge: 'Popular',
    stat: 'Used 9k+ times',
    fields: [
      f('email', 'email', 'Email address', { required: true, placeholder: 'you@example.com' }),
      f('name', 'short_text', 'First name'),
      f('interests', 'multi_select', 'What are you interested in?', {
        options: [
          opt('product', 'Product updates'),
          opt('blog', 'Blog posts'),
          opt('events', 'Events'),
          opt('offers', 'Offers'),
        ],
      }),
    ],
  },
  {
    id: 'product-feedback',
    title: 'Product feedback',
    category: 'Startups',
    description: 'Understand what your users want built next.',
    icon: '🚀',
    fields: [
      f('feature', 'long_text', 'What feature would you love to see?', { required: true }),
      f('priority', 'single_select', 'How important is this to you?', {
        options: [
          opt('critical', 'Critical'),
          opt('nice', 'Nice to have'),
          opt('minor', 'Minor'),
        ],
      }),
      f('rating', 'rating', 'How satisfied are you today?', { validation: { max: 5 } }),
      f('email', 'email', 'Email (optional, if we can follow up)'),
    ],
  },
  {
    id: 'course-registration',
    title: 'Course registration',
    category: 'Education',
    description: 'Enroll students in a class or workshop.',
    icon: '🎓',
    fields: [
      f('student', 'short_text', 'Student name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('course', 'dropdown', 'Choose a course', {
        required: true,
        options: [
          opt('intro', 'Intro to Design'),
          opt('web', 'Web Development'),
          opt('data', 'Data Science'),
        ],
      }),
      f('experience', 'single_select', 'Experience level', {
        options: [opt('beginner', 'Beginner'), opt('inter', 'Intermediate'), opt('adv', 'Advanced')],
      }),
      f('notes', 'long_text', 'Anything we should know?'),
    ],
  },
  {
    id: 'restaurant-reservation',
    title: 'Restaurant reservation',
    category: 'Restaurants',
    description: 'Let guests book a table online.',
    icon: '🍽️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('phone', 'phone', 'Phone number', { required: true }),
      f('date', 'date', 'Reservation date', {
        required: true,
        date: {
          mode: 'single',
          showPresets: true,
          presets: [
            { label: 'Today', offsetDays: 0 },
            { label: 'Tomorrow', offsetDays: 1 },
          ],
        },
      }),
      f('party', 'number', 'Party size', { required: true, validation: { min: 1, max: 20 } }),
      f('seating', 'single_select', 'Seating preference', {
        options: [opt('indoor', 'Indoor'), opt('outdoor', 'Outdoor'), opt('any', 'No preference')],
      }),
      f('requests', 'long_text', 'Special requests'),
    ],
  },
];

export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

export function findTemplate(id: string): FormTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
