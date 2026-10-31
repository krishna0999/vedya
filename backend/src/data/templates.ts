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

// Date-field config shorthand (fresh object per field, no shared references).
const dt = (mode: 'single' | 'range' = 'single') => ({ mode, showPresets: false, presets: [] });

// v1 has no file-upload field type — "upload" fields in the catalog are
// short_text link fields until uploads land (CLAUDE.md §8, R2 post-v1).
const link = (id: string, label: string) => f(id, 'short_text', label, { placeholder: 'https://…' });

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

  // — Customer Support —
  {
    id: 'bug-report',
    title: 'Bug report',
    category: 'Customer Support',
    description: 'Collect reproducible bug reports from users.',
    icon: '🐞',
    fields: [
      f('name', 'short_text', 'Name'),
      f('email', 'email', 'Email', { required: true }),
      f('product', 'short_text', 'Product / version'),
      f('description', 'long_text', 'Bug description', { required: true }),
      f('steps', 'long_text', 'Steps to reproduce'),
      f('expected', 'short_text', 'Expected result'),
      f('actual', 'short_text', 'Actual result'),
      link('screenshot', 'Screenshot link'),
    ],
  },
  {
    id: 'feature-request',
    title: 'Feature request',
    category: 'Customer Support',
    description: 'Let users pitch and prioritize new features.',
    icon: '💡',
    fields: [
      f('name', 'short_text', 'Name'),
      f('email', 'email', 'Email', { required: true }),
      f('title', 'short_text', 'Feature title', { required: true }),
      f('description', 'long_text', 'Description'),
      f('priority', 'single_select', 'Priority', {
        options: [opt('low', 'Low'), opt('medium', 'Medium'), opt('high', 'High')],
      }),
    ],
  },
  {
    id: 'help-desk-ticket',
    title: 'Help desk ticket',
    category: 'Customer Support',
    description: 'Route support requests to the right team.',
    icon: '🎫',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('department', 'dropdown', 'Department', {
        options: [opt('sales', 'Sales'), opt('billing', 'Billing'), opt('tech', 'Technical'), opt('general', 'General')],
      }),
      f('issue_type', 'dropdown', 'Issue type', {
        options: [opt('question', 'Question'), opt('incident', 'Incident'), opt('problem', 'Problem'), opt('request', 'Request')],
      }),
      f('priority', 'single_select', 'Priority', {
        options: [opt('low', 'Low'), opt('medium', 'Medium'), opt('high', 'High'), opt('urgent', 'Urgent')],
      }),
      f('description', 'long_text', 'Description', { required: true }),
      link('attachment', 'Attachment link'),
    ],
  },
  {
    id: 'complaint-form',
    title: 'Complaint form',
    category: 'Customer Support',
    description: 'Hear customers out and set expectations for resolution.',
    icon: '📣',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('reference', 'short_text', 'Order / reference ID'),
      f('complaint', 'long_text', 'Complaint', { required: true }),
      f('resolution', 'long_text', 'Resolution expected'),
    ],
  },
  {
    id: 'refund-request',
    title: 'Refund request',
    category: 'Customer Support',
    description: 'Handle refund claims with the details you need.',
    icon: '💸',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('order_id', 'short_text', 'Order ID', { required: true }),
      f('reason', 'dropdown', 'Reason', {
        options: [
          opt('damaged', 'Damaged item'),
          opt('wrong', 'Wrong item'),
          opt('not_described', 'Not as described'),
          opt('changed_mind', 'Changed my mind'),
          opt('other', 'Other'),
        ],
      }),
      f('amount', 'number', 'Amount', { validation: { min: 0 } }),
      link('attachment', 'Attachment link'),
    ],
  },
  {
    id: 'warranty-claim',
    title: 'Warranty claim',
    category: 'Customer Support',
    description: 'Register product issues covered under warranty.',
    icon: '🛠️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('product', 'short_text', 'Product', { required: true }),
      f('serial', 'short_text', 'Serial number'),
      f('purchase_date', 'date', 'Purchase date', { date: dt() }),
      f('issue', 'long_text', 'Issue', { required: true }),
      link('proof', 'Proof of purchase link'),
    ],
  },
  {
    id: 'technical-support',
    title: 'Technical support',
    category: 'Customer Support',
    description: 'Gather the environment details that speed up debugging.',
    icon: '🧰',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('device', 'short_text', 'Device'),
      f('os_browser', 'short_text', 'OS / browser'),
      f('issue', 'long_text', 'Issue', { required: true }),
      link('logs', 'Logs / screenshot link'),
    ],
  },

  // — Marketing —
  {
    id: 'lead-generation',
    title: 'Lead generation',
    category: 'Marketing',
    description: 'Capture qualified leads with their requirements.',
    icon: '🧲',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('company', 'short_text', 'Company'),
      f('phone', 'phone', 'Phone'),
      f('requirements', 'long_text', 'Requirements'),
    ],
  },
  {
    id: 'webinar-registration',
    title: 'Webinar registration',
    category: 'Marketing',
    description: 'Sign attendees up for your next webinar.',
    icon: '🖥️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('company', 'short_text', 'Company'),
      f('job_title', 'short_text', 'Job title'),
    ],
  },
  {
    id: 'giveaway-entry',
    title: 'Giveaway entry',
    category: 'Marketing',
    description: 'Run a giveaway and collect entries.',
    icon: '🎁',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('social', 'short_text', 'Social handle'),
    ],
  },
  {
    id: 'product-launch-interest',
    title: 'Product launch interest',
    category: 'Marketing',
    description: 'Gauge interest before a launch.',
    icon: '📢',
    fields: [
      f('name', 'short_text', 'Name'),
      f('email', 'email', 'Email', { required: true }),
      f('company', 'short_text', 'Company'),
      f('use_case', 'long_text', 'Use case'),
    ],
  },
  {
    id: 'landing-page-lead',
    title: 'Landing page lead',
    category: 'Marketing',
    description: 'A short lead form for landing pages.',
    icon: '📈',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('phone', 'phone', 'Phone'),
      f('company', 'short_text', 'Company'),
    ],
  },
  {
    id: 'market-research',
    title: 'Market research',
    category: 'Marketing',
    description: 'Survey your market segment and gather feedback.',
    icon: '🔍',
    fields: [
      f('age_group', 'dropdown', 'Age group', {
        options: [
          opt('u18', 'Under 18'),
          opt('18_24', '18–24'),
          opt('25_34', '25–34'),
          opt('35_44', '35–44'),
          opt('45_54', '45–54'),
          opt('55p', '55+'),
        ],
      }),
      f('industry', 'short_text', 'Industry'),
      f('feedback', 'long_text', 'Feedback'),
    ],
  },
  {
    id: 'brand-awareness',
    title: 'Brand awareness',
    category: 'Marketing',
    description: 'Measure how well people know your brand.',
    icon: '📊',
    fields: [
      f('heard', 'single_select', 'How did you hear about us?', {
        options: [
          opt('search', 'Search'),
          opt('social', 'Social media'),
          opt('friend', 'Friend or colleague'),
          opt('ads', 'Advertising'),
          opt('other', 'Other'),
        ],
      }),
      f('familiarity', 'single_select', 'How familiar are you with our brand?', {
        options: [
          opt('never', 'Never heard of it'),
          opt('name', 'Heard the name'),
          opt('well', 'Know it well'),
          opt('use', 'I use it'),
        ],
      }),
      f('preference', 'long_text', 'Which brands do you prefer, and why?'),
    ],
  },
  {
    id: 'nps',
    title: 'NPS survey',
    category: 'Marketing',
    description: 'The classic "how likely are you to recommend us?"',
    icon: '🙌',
    fields: [
      f('likelihood', 'rating', 'How likely are you to recommend us?', {
        required: true,
        validation: { max: 10 },
      }),
      f('reason', 'long_text', 'What is the main reason for your score?'),
      f('suggestions', 'long_text', 'Suggestions'),
    ],
  },

  // — HR —
  {
    id: 'employee-feedback',
    title: 'Employee feedback',
    category: 'HR',
    description: 'Give employees a channel to be heard.',
    icon: '🗣️',
    fields: [
      f('department', 'dropdown', 'Department', {
        options: [
          opt('eng', 'Engineering'),
          opt('design', 'Design'),
          opt('sales', 'Sales'),
          opt('support', 'Support'),
          opt('ops', 'Operations'),
          opt('other', 'Other'),
        ],
      }),
      f('rating', 'rating', 'How satisfied are you at work?', { validation: { max: 5 } }),
      f('feedback', 'long_text', 'Feedback', { required: true }),
      f('suggestions', 'long_text', 'Suggestions'),
    ],
  },
  {
    id: 'exit-interview',
    title: 'Exit interview',
    category: 'HR',
    description: 'Learn why people leave and what could improve.',
    icon: '🚪',
    fields: [
      f('department', 'dropdown', 'Department', {
        options: [
          opt('eng', 'Engineering'),
          opt('design', 'Design'),
          opt('sales', 'Sales'),
          opt('support', 'Support'),
          opt('ops', 'Operations'),
          opt('other', 'Other'),
        ],
      }),
      f('reason', 'single_select', 'Reason for leaving', {
        options: [
          opt('opportunity', 'New opportunity'),
          opt('compensation', 'Compensation'),
          opt('relocation', 'Relocation'),
          opt('career', 'Career change'),
          opt('personal', 'Personal'),
          opt('other', 'Other'),
        ],
      }),
      f('manager_feedback', 'long_text', 'Manager feedback'),
      f('suggestions', 'long_text', 'Suggestions'),
    ],
  },
  {
    id: 'leave-request',
    title: 'Leave request',
    category: 'HR',
    description: 'Request time off with dates and reason.',
    icon: '🌴',
    fields: [
      f('employee_id', 'short_text', 'Employee ID', { required: true }),
      f('leave_type', 'dropdown', 'Leave type', {
        options: [
          opt('vacation', 'Vacation'),
          opt('sick', 'Sick'),
          opt('parental', 'Parental'),
          opt('bereavement', 'Bereavement'),
          opt('unpaid', 'Unpaid'),
          opt('other', 'Other'),
        ],
      }),
      f('dates', 'date', 'Leave dates', { required: true, date: dt('range') }),
      f('reason', 'long_text', 'Reason'),
    ],
  },
  {
    id: 'employee-onboarding',
    title: 'New employee onboarding',
    category: 'HR',
    description: 'Collect a new hire’s details before day one.',
    icon: '🧾',
    fields: [
      f('name', 'short_text', 'Full name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('phone', 'phone', 'Phone'),
      f('emergency_contact', 'short_text', 'Emergency contact', { required: true }),
      f('tax_id', 'short_text', 'Tax ID'),
      link('documents', 'Documents link'),
    ],
  },
  {
    id: 'performance-review',
    title: 'Performance review',
    category: 'HR',
    description: 'Structure goals, achievements, and manager input.',
    icon: '📋',
    fields: [
      f('employee', 'short_text', 'Employee', { required: true }),
      f('goals', 'long_text', 'Goals'),
      f('achievements', 'long_text', 'Achievements'),
      f('manager_rating', 'rating', 'Manager rating', { validation: { max: 5 } }),
      f('comments', 'long_text', 'Comments'),
    ],
  },
  {
    id: 'timesheet',
    title: 'Timesheet',
    category: 'HR',
    description: 'Log weekly hours and what they went into.',
    icon: '⏱️',
    fields: [
      f('employee', 'short_text', 'Employee', { required: true }),
      f('week', 'date', 'Week starting', { required: true, date: dt() }),
      f('hours', 'number', 'Hours', { required: true, validation: { min: 0, max: 100 } }),
      f('tasks', 'long_text', 'Tasks'),
    ],
  },
  {
    id: 'employee-referral',
    title: 'Referral',
    category: 'HR',
    description: 'Let employees refer great candidates.',
    icon: '👥',
    fields: [
      f('referrer', 'short_text', 'Your name', { required: true }),
      f('candidate', 'short_text', 'Candidate name', { required: true }),
      link('resume', 'Resume link'),
      f('comments', 'long_text', 'Comments'),
    ],
  },

  // — Startups —
  {
    id: 'beta-tester-signup',
    title: 'Beta tester signup',
    category: 'Startups',
    description: 'Recruit early testers for your beta.',
    icon: '🧪',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('device', 'short_text', 'Device'),
      f('experience', 'long_text', 'Relevant experience'),
    ],
  },
  {
    id: 'startup-waitlist',
    title: 'Waitlist',
    category: 'Startups',
    description: 'Build a waitlist before you launch.',
    icon: '⏳',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('company', 'short_text', 'Company'),
    ],
  },
  {
    id: 'investor-contact',
    title: 'Investor contact',
    category: 'Startups',
    description: 'Field inbound interest from investors.',
    icon: '💰',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('firm', 'short_text', 'Firm', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('focus', 'long_text', 'Investment focus'),
    ],
  },
  {
    id: 'user-interview',
    title: 'User interview',
    category: 'Startups',
    description: 'Schedule research calls with users.',
    icon: '🎤',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('availability', 'short_text', 'Availability'),
    ],
  },
  {
    id: 'customer-discovery',
    title: 'Customer discovery',
    category: 'Startups',
    description: 'Understand pain points and current workarounds.',
    icon: '🧭',
    fields: [
      f('role', 'short_text', 'Your role'),
      f('pain_points', 'long_text', 'Pain points', { required: true }),
      f('current_solution', 'long_text', 'Current solution'),
    ],
  },
  {
    id: 'feature-voting',
    title: 'Feature voting',
    category: 'Startups',
    description: 'Let users vote on what you build next.',
    icon: '🗳️',
    fields: [
      f('feature', 'short_text', 'Feature', { required: true }),
      f('vote', 'single_select', 'Your vote', {
        options: [opt('must', 'Must have'), opt('nice', 'Nice to have'), opt('not', 'Not needed')],
      }),
      f('comments', 'long_text', 'Comments'),
    ],
  },
  {
    id: 'early-access',
    title: 'Early access',
    category: 'Startups',
    description: 'Grant early access to the right users.',
    icon: '🔑',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('company', 'short_text', 'Company'),
      f('use_case', 'long_text', 'Use case'),
    ],
  },

  // — Education —
  {
    id: 'admission-enquiry',
    title: 'Admission enquiry',
    category: 'Education',
    description: 'Capture enquiries from parents and students for your classes.',
    icon: '🏫',
    fields: [
      f('student', 'short_text', 'Student name', { required: true }),
      f('parent', 'short_text', 'Parent or guardian name', { required: true }),
      f('phone', 'phone', 'Phone number (WhatsApp)', { required: true }),
      f('email', 'email', 'Email'),
      f('class', 'dropdown', 'Class', {
        required: true,
        options: [
          opt('6-8', 'Class 6 to 8'),
          opt('9-10', 'Class 9 to 10'),
          opt('11-12', 'Class 11 to 12'),
          opt('other', 'College or other'),
        ],
      }),
      f('course', 'dropdown', 'Interested in', {
        required: true,
        options: [
          opt('tuition', 'School tuition'),
          opt('jee', 'JEE'),
          opt('neet', 'NEET'),
          opt('foundation', 'Foundation / Olympiad'),
          opt('other', 'Other'),
        ],
      }),
      f('mode', 'single_select', 'Preferred mode', {
        options: [opt('offline', 'At the centre'), opt('online', 'Online'), opt('either', 'Either')],
      }),
      f('timing', 'single_select', 'Preferred batch timing', {
        options: [
          opt('morning', 'Morning'),
          opt('afternoon', 'Afternoon'),
          opt('evening', 'Evening'),
          opt('weekend', 'Weekends'),
        ],
      }),
      f('source', 'dropdown', 'How did you hear about us?', {
        options: [
          opt('friend', 'Friend or family'),
          opt('instagram', 'Instagram'),
          opt('google', 'Google'),
          opt('poster', 'Poster or pamphlet'),
          opt('other', 'Other'),
        ],
      }),
      f('questions', 'long_text', 'Any questions for us?'),
    ],
  },
  {
    id: 'demo-class-booking',
    title: 'Demo class booking',
    category: 'Education',
    description: 'Let students book a free trial class at a time that suits them.',
    icon: '🧑‍🏫',
    fields: [
      f('student', 'short_text', 'Student name', { required: true }),
      f('phone', 'phone', 'Parent or student phone (WhatsApp)', { required: true }),
      f('class', 'dropdown', 'Class', {
        required: true,
        options: [
          opt('6-8', 'Class 6 to 8'),
          opt('9-10', 'Class 9 to 10'),
          opt('11-12', 'Class 11 to 12'),
          opt('other', 'College or other'),
        ],
      }),
      f('subjects', 'multi_select', 'Subjects', {
        required: true,
        options: [
          opt('maths', 'Maths'),
          opt('physics', 'Physics'),
          opt('chemistry', 'Chemistry'),
          opt('biology', 'Biology'),
          opt('english', 'English'),
        ],
      }),
      f('date', 'date', 'Preferred date', { required: true, date: dt() }),
      f('slot', 'single_select', 'Preferred time', {
        required: true,
        options: [opt('4pm', '4 to 5 PM'), opt('5pm', '5 to 6 PM'), opt('6pm', '6 to 7 PM')],
      }),
      f('mode', 'single_select', 'Attend', {
        options: [opt('offline', 'At the centre'), opt('online', 'Online')],
      }),
      f('notes', 'long_text', 'Anything the teacher should know?'),
    ],
  },
  {
    id: 'student-feedback',
    title: 'Student feedback',
    category: 'Education',
    description: 'Hear how a course landed with students.',
    icon: '📝',
    fields: [
      f('course', 'short_text', 'Course', { required: true }),
      f('rating', 'rating', 'Rating', { validation: { max: 5 } }),
      f('comments', 'long_text', 'Comments'),
    ],
  },
  {
    id: 'quiz',
    title: 'Quiz',
    category: 'Education',
    description: 'A simple multiple-choice quiz to adapt.',
    icon: '🧠',
    fields: [
      f('student', 'short_text', 'Your name', { required: true }),
      f('q1', 'single_select', 'Question 1', {
        required: true,
        options: [opt('a', 'Option A'), opt('b', 'Option B'), opt('c', 'Option C'), opt('d', 'Option D')],
      }),
      f('q2', 'single_select', 'Question 2', {
        required: true,
        options: [opt('a', 'Option A'), opt('b', 'Option B'), opt('c', 'Option C'), opt('d', 'Option D')],
      }),
      f('q3', 'long_text', 'Question 3 (short answer)'),
    ],
  },
  {
    id: 'assignment-submission',
    title: 'Assignment submission',
    category: 'Education',
    description: 'Collect assignment hand-ins with a link.',
    icon: '📤',
    fields: [
      f('student', 'short_text', 'Student', { required: true }),
      f('course', 'short_text', 'Course', { required: true }),
      f('assignment', 'short_text', 'Assignment title', { required: true }),
      link('file', 'File link'),
    ],
  },
  {
    id: 'parent-feedback',
    title: 'Parent feedback',
    category: 'Education',
    description: 'Give parents a direct feedback channel.',
    icon: '👪',
    fields: [
      f('student', 'short_text', 'Student', { required: true }),
      f('parent', 'short_text', 'Parent name', { required: true }),
      f('feedback', 'long_text', 'Feedback', { required: true }),
    ],
  },
  {
    id: 'teacher-evaluation',
    title: 'Teacher evaluation',
    category: 'Education',
    description: 'Evaluate teaching with ratings and comments.',
    icon: '🍎',
    fields: [
      f('teacher', 'short_text', 'Teacher', { required: true }),
      f('rating', 'rating', 'Rating', { validation: { max: 5 } }),
      f('comments', 'long_text', 'Comments'),
    ],
  },
  {
    id: 'scholarship-application',
    title: 'Scholarship',
    category: 'Education',
    description: 'Take scholarship applications with an essay.',
    icon: '🏅',
    fields: [
      f('student', 'short_text', 'Student', { required: true }),
      f('academics', 'long_text', 'Academic details'),
      f('essay', 'long_text', 'Essay', { required: true }),
      link('documents', 'Documents link'),
    ],
  },
  {
    id: 'school-event-registration',
    title: 'Event registration',
    category: 'Education',
    description: 'Register students for a school event.',
    icon: '🎪',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('class', 'short_text', 'Class / grade'),
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    category: 'Education',
    description: 'Mark daily attendance in seconds.',
    icon: '✅',
    fields: [
      f('student', 'short_text', 'Student', { required: true }),
      f('date', 'date', 'Date', { required: true, date: dt() }),
      f('status', 'single_select', 'Status', {
        options: [opt('present', 'Present'), opt('absent', 'Absent'), opt('late', 'Late')],
      }),
    ],
  },

  // — Restaurants —
  {
    id: 'food-order',
    title: 'Food order',
    category: 'Restaurants',
    description: 'Take delivery orders online.',
    icon: '🥡',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('phone', 'phone', 'Phone', { required: true }),
      f('items', 'long_text', 'Order items', { required: true }),
      f('address', 'long_text', 'Delivery address', { required: true }),
      f('payment', 'single_select', 'Payment method', {
        options: [opt('cod', 'Cash on delivery'), opt('card', 'Card on delivery'), opt('online', 'Online')],
      }),
    ],
  },
  {
    id: 'catering-request',
    title: 'Catering',
    category: 'Restaurants',
    description: 'Quote catering for events of any size.',
    icon: '🍱',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('event_date', 'date', 'Event date', { required: true, date: dt() }),
      f('guests', 'number', 'Guests', { required: true, validation: { min: 1 } }),
      f('menu', 'long_text', 'Menu preferences'),
      f('budget', 'number', 'Budget'),
    ],
  },
  {
    id: 'restaurant-waitlist',
    title: 'Waitlist',
    category: 'Restaurants',
    description: 'Manage walk-ins with a digital waitlist.',
    icon: '🪑',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('phone', 'phone', 'Phone', { required: true }),
      f('party', 'number', 'Party size', { required: true, validation: { min: 1, max: 20 } }),
    ],
  },
  {
    id: 'restaurant-feedback',
    title: 'Customer feedback',
    category: 'Restaurants',
    description: 'Rate the food, the service, and the visit.',
    icon: '🍔',
    fields: [
      f('rating', 'rating', 'Overall rating', { required: true, validation: { max: 5 } }),
      f('food', 'rating', 'Food', { validation: { max: 5 } }),
      f('service', 'rating', 'Service', { validation: { max: 5 } }),
      f('comments', 'long_text', 'Comments'),
    ],
  },
  {
    id: 'restaurant-event-booking',
    title: 'Event booking',
    category: 'Restaurants',
    description: 'Book private events and parties.',
    icon: '🥂',
    fields: [
      f('event_type', 'dropdown', 'Event type', {
        options: [
          opt('birthday', 'Birthday'),
          opt('corporate', 'Corporate'),
          opt('reception', 'Wedding reception'),
          opt('anniversary', 'Anniversary'),
          opt('other', 'Other'),
        ],
      }),
      f('date', 'date', 'Date', { required: true, date: dt() }),
      f('guests', 'number', 'Guests', { required: true, validation: { min: 1 } }),
      f('requirements', 'long_text', 'Requirements'),
    ],
  },
  {
    id: 'birthday-reservation',
    title: 'Birthday reservation',
    category: 'Restaurants',
    description: 'Book birthday tables, cake included.',
    icon: '🎂',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('date', 'date', 'Date', { required: true, date: dt() }),
      f('guests', 'number', 'Guests', { validation: { min: 1 } }),
      f('cake', 'single_select', 'Cake required?', {
        options: [opt('yes', 'Yes'), opt('no', 'No')],
      }),
    ],
  },

  // — Events —
  {
    id: 'conference-registration',
    title: 'Conference registration',
    category: 'Events',
    description: 'Register attendees and ticket tiers.',
    icon: '🎟️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('company', 'short_text', 'Company'),
      f('ticket', 'dropdown', 'Ticket type', {
        options: [opt('general', 'General'), opt('vip', 'VIP'), opt('student', 'Student')],
      }),
    ],
  },
  {
    id: 'workshop-signup',
    title: 'Workshop signup',
    category: 'Events',
    description: 'Sign people up by experience level.',
    icon: '🧑‍🏫',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('experience', 'single_select', 'Experience level', {
        options: [opt('beginner', 'Beginner'), opt('inter', 'Intermediate'), opt('adv', 'Advanced')],
      }),
    ],
  },
  {
    id: 'volunteer-registration',
    title: 'Volunteer registration',
    category: 'Events',
    description: 'Recruit volunteers by availability and skills.',
    icon: '🙋',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('phone', 'phone', 'Phone', { required: true }),
      f('availability', 'multi_select', 'Availability', {
        options: [
          opt('wd_am', 'Weekday mornings'),
          opt('wd_pm', 'Weekday evenings'),
          opt('we', 'Weekends'),
        ],
      }),
      f('skills', 'long_text', 'Skills'),
    ],
  },
  {
    id: 'speaker-application',
    title: 'Speaker application',
    category: 'Events',
    description: 'Take talk proposals for your event.',
    icon: '🎙️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('bio', 'long_text', 'Bio', { required: true }),
      f('topic', 'short_text', 'Topic', { required: true }),
      f('links', 'short_text', 'Links'),
    ],
  },
  {
    id: 'sponsorship-inquiry',
    title: 'Sponsorship',
    category: 'Events',
    description: 'Field sponsorship interest by package.',
    icon: '💎',
    fields: [
      f('company', 'short_text', 'Company', { required: true }),
      f('contact', 'short_text', 'Contact person', { required: true }),
      f('package', 'dropdown', 'Package', {
        options: [opt('gold', 'Gold'), opt('silver', 'Silver'), opt('bronze', 'Bronze')],
      }),
    ],
  },
  {
    id: 'event-feedback',
    title: 'Event feedback',
    category: 'Events',
    description: 'Find out what attendees loved.',
    icon: '💬',
    fields: [
      f('rating', 'rating', 'Rating', { required: true, validation: { max: 5 } }),
      f('favorite', 'short_text', 'Favorite session'),
      f('suggestions', 'long_text', 'Suggestions'),
    ],
  },
  {
    id: 'booth-registration',
    title: 'Booth registration',
    category: 'Events',
    description: 'Sell exhibitor booths by size.',
    icon: '🏪',
    fields: [
      f('company', 'short_text', 'Company', { required: true }),
      f('contact', 'short_text', 'Contact person', { required: true }),
      f('booth', 'single_select', 'Booth size', {
        options: [opt('small', 'Small (3×3)'), opt('medium', 'Medium (3×6)'), opt('large', 'Large (6×6)')],
      }),
    ],
  },

  // — Ecommerce —
  {
    id: 'product-order',
    title: 'Product order',
    category: 'Ecommerce',
    description: 'Take product orders with delivery details.',
    icon: '🛒',
    fields: [
      f('customer', 'short_text', 'Customer', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('products', 'long_text', 'Products', { required: true }),
      f('quantity', 'number', 'Quantity', { validation: { min: 1 } }),
      f('address', 'long_text', 'Address', { required: true }),
      f('payment', 'single_select', 'Payment method', {
        options: [opt('card', 'Card'), opt('online', 'Online'), opt('cod', 'Cash on delivery')],
      }),
    ],
  },
  {
    id: 'return-request',
    title: 'Return request',
    category: 'Ecommerce',
    description: 'Process returns with reason and photos.',
    icon: '📦',
    fields: [
      f('order_id', 'short_text', 'Order ID', { required: true }),
      f('reason', 'dropdown', 'Reason', {
        options: [
          opt('damaged', 'Damaged'),
          opt('wrong', 'Wrong item'),
          opt('not_described', 'Not as described'),
          opt('unneeded', 'No longer needed'),
          opt('other', 'Other'),
        ],
      }),
      link('photos', 'Photos link'),
    ],
  },
  {
    id: 'exchange-request',
    title: 'Exchange request',
    category: 'Ecommerce',
    description: 'Swap sizes without back-and-forth email.',
    icon: '🔁',
    fields: [
      f('order_id', 'short_text', 'Order ID', { required: true }),
      f('old_size', 'short_text', 'Old size', { required: true }),
      f('new_size', 'short_text', 'New size', { required: true }),
    ],
  },
  {
    id: 'custom-product',
    title: 'Custom product',
    category: 'Ecommerce',
    description: 'Take bespoke orders with reference images.',
    icon: '🧵',
    fields: [
      f('requirements', 'long_text', 'Requirements', { required: true }),
      link('references', 'Reference images link'),
    ],
  },
  {
    id: 'wholesale-inquiry',
    title: 'Wholesale inquiry',
    category: 'Ecommerce',
    description: 'Qualify bulk buyers and resellers.',
    icon: '🏭',
    fields: [
      f('business', 'short_text', 'Business', { required: true }),
      f('tax', 'short_text', 'GST / VAT number'),
      f('products', 'long_text', 'Products of interest'),
    ],
  },
  {
    id: 'pre-order',
    title: 'Pre-order',
    category: 'Ecommerce',
    description: 'Collect pre-orders before stock lands.',
    icon: '⏰',
    fields: [
      f('product', 'short_text', 'Product', { required: true }),
      f('quantity', 'number', 'Quantity', { validation: { min: 1 } }),
      f('email', 'email', 'Email', { required: true }),
    ],
  },
  {
    id: 'gift-card',
    title: 'Gift card',
    category: 'Ecommerce',
    description: 'Sell gift cards to a recipient’s inbox.',
    icon: '💳',
    fields: [
      f('recipient', 'short_text', 'Recipient name', { required: true }),
      f('email', 'email', 'Recipient email', { required: true }),
      f('amount', 'number', 'Amount', { required: true, validation: { min: 1 } }),
    ],
  },

  // — Healthcare —
  {
    id: 'appointment-booking',
    title: 'Appointment',
    category: 'Healthcare',
    description: 'Book patients in with symptoms up front.',
    icon: '🩺',
    fields: [
      f('patient', 'short_text', 'Patient', { required: true }),
      f('phone', 'phone', 'Phone', { required: true }),
      f('doctor', 'dropdown', 'Doctor / department', {
        options: [
          opt('gp', 'General physician'),
          opt('dentist', 'Dentist'),
          opt('derm', 'Dermatologist'),
          opt('ped', 'Pediatrician'),
          opt('other', 'Other'),
        ],
      }),
      f('date', 'date', 'Date', { required: true, date: dt() }),
      f('symptoms', 'long_text', 'Symptoms'),
    ],
  },
  {
    id: 'patient-registration',
    title: 'Patient registration',
    category: 'Healthcare',
    description: 'Register new patients with history and insurance.',
    icon: '🏥',
    fields: [
      f('name', 'short_text', 'Full name', { required: true }),
      f('phone', 'phone', 'Phone', { required: true }),
      f('dob', 'date', 'Date of birth', { date: dt() }),
      f('insurance', 'short_text', 'Insurance provider'),
      f('history', 'long_text', 'Medical history'),
    ],
  },
  {
    id: 'medical-history',
    title: 'Medical history',
    category: 'Healthcare',
    description: 'Capture conditions, medications, and allergies.',
    icon: '🧬',
    fields: [
      f('conditions', 'long_text', 'Conditions'),
      f('medications', 'long_text', 'Medications'),
      f('allergies', 'long_text', 'Allergies'),
    ],
  },
  {
    id: 'insurance-claim',
    title: 'Insurance claim',
    category: 'Healthcare',
    description: 'File claims with policy and documents.',
    icon: '📄',
    fields: [
      f('policy', 'short_text', 'Policy number', { required: true }),
      f('hospital', 'short_text', 'Hospital', { required: true }),
      link('documents', 'Documents link'),
    ],
  },
  {
    id: 'vaccination-registration',
    title: 'Vaccination',
    category: 'Healthcare',
    description: 'Schedule vaccinations by type and date.',
    icon: '💉',
    fields: [
      f('patient', 'short_text', 'Patient', { required: true }),
      f('vaccine', 'dropdown', 'Vaccine', {
        options: [
          opt('covid', 'COVID-19'),
          opt('flu', 'Flu'),
          opt('hepb', 'Hepatitis B'),
          opt('tetanus', 'Tetanus'),
          opt('other', 'Other'),
        ],
      }),
      f('date', 'date', 'Date', { date: dt() }),
    ],
  },
  {
    id: 'teleconsultation',
    title: 'Teleconsultation',
    category: 'Healthcare',
    description: 'Book remote consultations by preferred time.',
    icon: '📱',
    fields: [
      f('patient', 'short_text', 'Patient', { required: true }),
      f('time', 'single_select', 'Preferred time', {
        options: [opt('am', 'Morning'), opt('pm', 'Afternoon'), opt('eve', 'Evening')],
      }),
      f('symptoms', 'long_text', 'Symptoms', { required: true }),
    ],
  },

  // — Real Estate —
  {
    id: 'property-inquiry',
    title: 'Property inquiry',
    category: 'Real Estate',
    description: 'Qualify buyer interest with budget.',
    icon: '🏠',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('property', 'short_text', 'Property of interest', { required: true }),
      f('budget', 'number', 'Budget'),
    ],
  },
  {
    id: 'viewing-booking',
    title: 'Viewing booking',
    category: 'Real Estate',
    description: 'Book property viewings by time slot.',
    icon: '🗝️',
    fields: [
      f('property', 'short_text', 'Property', { required: true }),
      f('date', 'date', 'Date', { required: true, date: dt() }),
      f('time', 'single_select', 'Time', {
        options: [opt('am', 'Morning'), opt('pm', 'Afternoon'), opt('eve', 'Evening')],
      }),
    ],
  },
  {
    id: 'rental-application',
    title: 'Rental application',
    category: 'Real Estate',
    description: 'Screen tenants with employment and references.',
    icon: '🏢',
    fields: [
      f('tenant', 'short_text', 'Full name', { required: true }),
      f('employment', 'short_text', 'Employer / role'),
      f('income', 'number', 'Monthly income'),
      f('references', 'long_text', 'References'),
    ],
  },
  {
    id: 'seller-information',
    title: 'Seller information',
    category: 'Real Estate',
    description: 'List a property with the owner’s asking price.',
    icon: '🏷️',
    fields: [
      f('property', 'short_text', 'Property address', { required: true }),
      f('owner', 'short_text', 'Owner', { required: true }),
      f('price', 'number', 'Expected price'),
    ],
  },
  {
    id: 'mortgage-inquiry',
    title: 'Mortgage inquiry',
    category: 'Real Estate',
    description: 'Pre-qualify borrowers in one form.',
    icon: '🏦',
    fields: [
      f('income', 'number', 'Annual income', { required: true }),
      f('loan', 'number', 'Loan amount', { required: true }),
      f('credit', 'dropdown', 'Credit score', {
        options: [
          opt('excellent', 'Excellent (750+)'),
          opt('good', 'Good (700–749)'),
          opt('fair', 'Fair (650–699)'),
          opt('poor', 'Poor (below 650)'),
        ],
      }),
    ],
  },

  // — Finance —
  {
    id: 'loan-application',
    title: 'Loan application',
    category: 'Finance',
    description: 'Take loan applications with purpose and income.',
    icon: '💵',
    fields: [
      f('applicant', 'short_text', 'Applicant', { required: true }),
      f('income', 'number', 'Income', { required: true }),
      f('amount', 'number', 'Loan amount', { required: true }),
      f('purpose', 'long_text', 'Purpose'),
    ],
  },
  {
    id: 'expense-reimbursement',
    title: 'Expense reimbursement',
    category: 'Finance',
    description: 'Reimburse expenses with receipts attached.',
    icon: '🪙',
    fields: [
      f('employee', 'short_text', 'Employee', { required: true }),
      f('expense', 'short_text', 'Expense description', { required: true }),
      f('amount', 'number', 'Amount', { required: true, validation: { min: 0 } }),
      link('receipt', 'Receipt link'),
    ],
  },
  {
    id: 'budget-approval',
    title: 'Budget approval',
    category: 'Finance',
    description: 'Request budget with a justification.',
    icon: '💹',
    fields: [
      f('department', 'short_text', 'Department', { required: true }),
      f('budget', 'number', 'Budget', { required: true }),
      f('justification', 'long_text', 'Justification', { required: true }),
    ],
  },
  {
    id: 'invoice-submission',
    title: 'Invoice submission',
    category: 'Finance',
    description: 'Let vendors submit invoices for payment.',
    icon: '📑',
    fields: [
      f('vendor', 'short_text', 'Vendor', { required: true }),
      f('invoice_no', 'short_text', 'Invoice number', { required: true }),
      f('amount', 'number', 'Amount', { required: true }),
      link('file', 'Invoice link'),
    ],
  },
  {
    id: 'payment-request',
    title: 'Payment request',
    category: 'Finance',
    description: 'Request one-off payments with a reason.',
    icon: '💶',
    fields: [
      f('requester', 'short_text', 'Requester', { required: true }),
      f('amount', 'number', 'Amount', { required: true }),
      f('reason', 'long_text', 'Reason'),
    ],
  },

  // — Fitness —
  {
    id: 'gym-membership',
    title: 'Gym membership',
    category: 'Fitness',
    description: 'Sign up members by plan.',
    icon: '🏋️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('age', 'number', 'Age', { validation: { min: 14 } }),
      f('phone', 'phone', 'Phone', { required: true }),
      f('plan', 'dropdown', 'Plan', {
        options: [opt('monthly', 'Monthly'), opt('quarterly', 'Quarterly'), opt('annual', 'Annual')],
      }),
    ],
  },
  {
    id: 'training-inquiry',
    title: 'Training inquiry',
    category: 'Fitness',
    description: 'Match clients to trainers by goals.',
    icon: '🤸',
    fields: [
      f('goals', 'long_text', 'Goals', { required: true }),
      f('experience', 'single_select', 'Experience', {
        options: [opt('beginner', 'Beginner'), opt('inter', 'Intermediate'), opt('adv', 'Advanced')],
      }),
      f('availability', 'short_text', 'Availability'),
    ],
  },
  {
    id: 'fitness-assessment',
    title: 'Fitness assessment',
    category: 'Fitness',
    description: 'Baseline measurements and goals.',
    icon: '📏',
    fields: [
      f('height', 'number', 'Height (cm)'),
      f('weight', 'number', 'Weight (kg)'),
      f('goals', 'long_text', 'Goals'),
      f('medical', 'long_text', 'Medical conditions'),
    ],
  },
  {
    id: 'nutrition-consultation',
    title: 'Nutrition consultation',
    category: 'Fitness',
    description: 'Plan diets around goals and allergies.',
    icon: '🥗',
    fields: [
      f('diet', 'short_text', 'Current diet'),
      f('goals', 'long_text', 'Goals'),
      f('allergies', 'short_text', 'Allergies'),
    ],
  },

  // — Wedding —
  {
    id: 'wedding-rsvp',
    title: 'Wedding RSVP',
    category: 'Wedding',
    description: 'Confirm guests and meal preferences.',
    icon: '💍',
    fields: [
      f('guest', 'short_text', 'Guest name', { required: true }),
      f('attending', 'single_select', 'Attending?', {
        required: true,
        options: [opt('yes', 'Joyfully accepts'), opt('no', 'Regretfully declines')],
      }),
      f('meal', 'single_select', 'Meal preference', {
        options: [opt('chicken', 'Chicken'), opt('fish', 'Fish'), opt('veg', 'Vegetarian'), opt('vegan', 'Vegan')],
      }),
    ],
  },
  {
    id: 'wedding-guest-information',
    title: 'Guest information',
    category: 'Wedding',
    description: 'Collect addresses for invitations.',
    icon: '📇',
    fields: [
      f('guest', 'short_text', 'Guest name', { required: true }),
      f('address', 'long_text', 'Address'),
      f('phone', 'phone', 'Phone'),
    ],
  },
  {
    id: 'wedding-vendor-inquiry',
    title: 'Vendor inquiry',
    category: 'Wedding',
    description: 'Get quotes from wedding vendors.',
    icon: '💐',
    fields: [
      f('service', 'dropdown', 'Service', {
        options: [
          opt('catering', 'Catering'),
          opt('photo', 'Photography'),
          opt('flowers', 'Flowers'),
          opt('music', 'Music'),
          opt('venue', 'Venue'),
          opt('other', 'Other'),
        ],
      }),
      f('budget', 'number', 'Budget'),
      f('date', 'date', 'Event date', { date: dt() }),
    ],
  },
  {
    id: 'bridal-appointment',
    title: 'Bridal appointment',
    category: 'Wedding',
    description: 'Book fittings and trials.',
    icon: '👰',
    fields: [
      f('bride', 'short_text', 'Name', { required: true }),
      f('date', 'date', 'Preferred date', { date: dt() }),
      f('services', 'multi_select', 'Services', {
        options: [
          opt('fitting', 'Dress fitting'),
          opt('hair_makeup', 'Hair & makeup trial'),
          opt('accessories', 'Accessories'),
        ],
      }),
    ],
  },

  // — Creative —
  {
    id: 'design-brief',
    title: 'Design brief',
    category: 'Creative',
    description: 'Scope design projects before kickoff.',
    icon: '🎨',
    fields: [
      f('client', 'short_text', 'Client', { required: true }),
      f('project', 'short_text', 'Project name', { required: true }),
      f('objectives', 'long_text', 'Objectives', { required: true }),
      f('deadline', 'date', 'Deadline', { date: dt() }),
      f('budget', 'number', 'Budget'),
    ],
  },
  {
    id: 'photography-booking',
    title: 'Photography booking',
    category: 'Creative',
    description: 'Book shoots by event, date, and place.',
    icon: '📸',
    fields: [
      f('event', 'short_text', 'Event type', { required: true }),
      f('date', 'date', 'Date', { required: true, date: dt() }),
      f('location', 'short_text', 'Location'),
    ],
  },
  {
    id: 'video-project',
    title: 'Video project',
    category: 'Creative',
    description: 'Brief video work by type and duration.',
    icon: '🎬',
    fields: [
      f('type', 'dropdown', 'Video type', {
        options: [
          opt('promo', 'Promo'),
          opt('event', 'Event coverage'),
          opt('product', 'Product'),
          opt('social', 'Social media'),
          opt('other', 'Other'),
        ],
      }),
      f('duration', 'short_text', 'Target duration'),
      f('requirements', 'long_text', 'Requirements'),
    ],
  },
  {
    id: 'content-request',
    title: 'Content request',
    category: 'Creative',
    description: 'Queue content with topic and deadline.',
    icon: '✍️',
    fields: [
      f('content_type', 'dropdown', 'Content type', {
        options: [
          opt('blog', 'Blog post'),
          opt('social', 'Social post'),
          opt('email', 'Email'),
          opt('landing', 'Landing page'),
          opt('other', 'Other'),
        ],
      }),
      f('topic', 'short_text', 'Topic', { required: true }),
      f('deadline', 'date', 'Deadline', { date: dt() }),
    ],
  },
  {
    id: 'portfolio-submission',
    title: 'Portfolio submission',
    category: 'Creative',
    description: 'Review portfolios from applicants.',
    icon: '🖼️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      link('portfolio', 'Portfolio link'),
      link('resume', 'Resume link'),
    ],
  },

  // — General Business —
  {
    id: 'meeting-request',
    title: 'Meeting request',
    category: 'General Business',
    description: 'Take meeting requests with purpose and timing.',
    icon: '📅',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('email', 'email', 'Email', { required: true }),
      f('purpose', 'long_text', 'Purpose', { required: true }),
      f('time', 'single_select', 'Preferred time', {
        options: [opt('am', 'Morning'), opt('pm', 'Afternoon'), opt('eve', 'Evening')],
      }),
    ],
  },
  {
    id: 'consultation-booking',
    title: 'Consultation booking',
    category: 'General Business',
    description: 'Book consultations by service and date.',
    icon: '🗓️',
    fields: [
      f('name', 'short_text', 'Name', { required: true }),
      f('service', 'short_text', 'Service', { required: true }),
      f('date', 'date', 'Date', { required: true, date: dt() }),
    ],
  },
  {
    id: 'quote-request',
    title: 'Quote request',
    category: 'General Business',
    description: 'Quote jobs from requirements and budget.',
    icon: '🧮',
    fields: [
      f('company', 'short_text', 'Company', { required: true }),
      f('requirements', 'long_text', 'Requirements', { required: true }),
      f('budget', 'number', 'Budget'),
    ],
  },
  {
    id: 'partnership-inquiry',
    title: 'Partnership inquiry',
    category: 'General Business',
    description: 'Field partnership proposals.',
    icon: '🤝',
    fields: [
      f('company', 'short_text', 'Company', { required: true }),
      f('proposal', 'long_text', 'Proposal', { required: true }),
    ],
  },
  {
    id: 'vendor-registration',
    title: 'Vendor registration',
    category: 'General Business',
    description: 'Onboard vendors with tax details.',
    icon: '🗂️',
    fields: [
      f('company', 'short_text', 'Company', { required: true }),
      f('tax_id', 'short_text', 'Tax ID'),
      f('contact', 'short_text', 'Contact person', { required: true }),
    ],
  },
  {
    id: 'client-intake',
    title: 'Client intake',
    category: 'General Business',
    description: 'Onboard new clients with requirements.',
    icon: '🗃️',
    fields: [
      f('client', 'short_text', 'Client name', { required: true }),
      f('business', 'short_text', 'Business name'),
      f('requirements', 'long_text', 'Requirements', { required: true }),
    ],
  },
  {
    id: 'internal-request',
    title: 'Internal request',
    category: 'General Business',
    description: 'Route internal requests to the right team.',
    icon: '📨',
    fields: [
      f('department', 'dropdown', 'Department', {
        options: [
          opt('eng', 'Engineering'),
          opt('design', 'Design'),
          opt('sales', 'Sales'),
          opt('support', 'Support'),
          opt('ops', 'Operations'),
          opt('hr', 'HR'),
          opt('finance', 'Finance'),
        ],
      }),
      f('request_type', 'dropdown', 'Request type', {
        options: [
          opt('equipment', 'Equipment'),
          opt('access', 'Access'),
          opt('travel', 'Travel'),
          opt('other', 'Other'),
        ],
      }),
      f('details', 'long_text', 'Details', { required: true }),
    ],
  },
];

export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];

export function findTemplate(id: string): FormTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
