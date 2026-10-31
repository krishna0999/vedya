import { describe, expect, it } from 'vitest';
import type { Field, Submission } from '@schema';
import { summarize } from './summary';

const sub = (answers: Record<string, unknown>, at = '2026-10-31T10:00:00.000Z'): Submission => ({
  id: crypto.randomUUID(),
  formId: 'f',
  versionId: 'v',
  answers,
  labelSnapshot: {},
  meta: { submittedAt: at },
});

const fields: Field[] = [
  { id: 'intro', type: 'section_break', label: 'About you', required: false },
  { id: 'plan', type: 'single_select', label: 'Plan', required: true, options: [
    { id: 'a', label: 'Free' }, { id: 'b', label: 'Pro', value: 'pro' },
  ] },
  { id: 'tools', type: 'multi_select', label: 'Tools', required: false, options: [
    { id: 'x', label: 'Vue' }, { id: 'y', label: 'React' },
  ] },
  { id: 'stars', type: 'rating', label: 'Rate us', required: false, validation: { max: 3 } },
  { id: 'age', type: 'number', label: 'Age', required: false },
  { id: 'note', type: 'long_text', label: 'Notes', required: false },
];

describe('summarize', () => {
  const subs = [
    sub({ plan: 'pro', tools: ['Vue', 'React'], stars: 3, age: 30, note: 'newest' }, '2026-10-31T12:00:00.000Z'),
    sub({ plan: 'Free', tools: ['Vue'], stars: 2, age: 20, note: '' }),
    sub({ plan: 'legacy', stars: 3 }, '2026-10-30T10:00:00.000Z'),
  ];
  const [plan, tools, stars, age, note] = summarize(fields, subs);

  it('skips section breaks', () => {
    expect(summarize(fields, subs)).toHaveLength(5);
  });

  it('counts choices by value, labels by option, keeps unknown values', () => {
    expect(plan).toMatchObject({ kind: 'choice', answered: 3 });
    if (plan?.kind !== 'choice') throw new Error();
    expect(plan.bars).toEqual([
      { label: 'Free', count: 1, pct: 33 },
      { label: 'Pro', count: 1, pct: 33 },
      { label: 'legacy', count: 1, pct: 33 },
    ]);
  });

  it('multi-select percentages are per respondent', () => {
    if (tools?.kind !== 'choice') throw new Error();
    expect(tools.answered).toBe(2);
    expect(tools.bars).toEqual([
      { label: 'Vue', count: 2, pct: 100 },
      { label: 'React', count: 1, pct: 50 },
    ]);
  });

  it('rating: average and a bar per star, highest first', () => {
    if (stars?.kind !== 'rating') throw new Error();
    expect(stars.average).toBeCloseTo(8 / 3);
    expect(stars.bars.map((b) => b.count)).toEqual([2, 1, 0]);
  });

  it('number: average, min, max', () => {
    expect(age).toMatchObject({ kind: 'number', answered: 2, average: 25, min: 20, max: 30 });
  });

  it('text: empty answers are skipped, newest first', () => {
    expect(note).toMatchObject({ kind: 'list', answered: 1, recent: [{ value: 'newest' }] });
  });

  it('no responses → zeros, never NaN', () => {
    const [p, , s, n] = summarize(fields, []);
    if (p?.kind !== 'choice' || s?.kind !== 'rating' || n?.kind !== 'number') throw new Error();
    expect(p.bars.every((b) => b.pct === 0)).toBe(true);
    expect(s.average).toBeNull();
    expect(n.min).toBeNull();
  });
});
