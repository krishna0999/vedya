import { describe, expect, it } from 'vitest';
import type { Submission } from '../schema/index';
import { toCsv, type CsvColumn } from './csv';

function sub(id: string, submittedAt: string, answers: Record<string, unknown>): Submission {
  return {
    id,
    formId: 'form_1',
    versionId: 'ver_1',
    answers,
    labelSnapshot: {},
    meta: { submittedAt },
  };
}

const cols: CsvColumn[] = [
  { id: 'name', header: 'Full name' },
  { id: 'tools', header: 'Tools' },
  { id: 'stay', header: 'Dates of stay' },
  { id: 'rating', header: 'Rating' },
];

describe('toCsv', () => {
  it('emits a header row plus meta columns and one row per submission', () => {
    const csv = toCsv(cols, [
      sub('s1', '2026-07-04T10:00:00.000Z', { name: 'Ada', tools: ['Vue', 'Node'], rating: 5 }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Submission ID,Submitted at,Full name,Tools,Dates of stay,Rating');
    expect(lines[1]).toBe('s1,2026-07-04T10:00:00.000Z,Ada,Vue; Node,,5');
  });

  it('formats date-range answers and leaves missing answers blank', () => {
    const csv = toCsv(cols, [sub('s1', 't', { stay: { start: '2026-08-01', end: '2026-08-05' } })]);
    expect(csv.split('\r\n')[1]).toBe('s1,t,,,2026-08-01 – 2026-08-05,');
  });

  it('escapes commas, quotes and newlines per RFC 4180', () => {
    const csv = toCsv([{ id: 'name', header: 'Full name' }], [
      sub('s1', 't', { name: 'Smith, "Bob"\nJr' }),
    ]);
    expect(csv.split('\r\n')[1]).toBe('s1,t,"Smith, ""Bob""\nJr"');
  });

  it('neutralises spreadsheet formula injection with a leading apostrophe', () => {
    const csv = toCsv([{ id: 'name', header: 'Full name' }], [
      sub('s1', 't', { name: '=HYPERLINK("http://evil")' }),
    ]);
    // Leading '=' -> apostrophe-guarded, then quoted because it contains quotes.
    expect(csv.split('\r\n')[1]).toBe(`s1,t,"'=HYPERLINK(""http://evil"")"`);
  });
});
