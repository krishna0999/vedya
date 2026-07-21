// Subsequence search: "cntus" and "cnt us" both match "Contact us", so a
// half-remembered title still finds the form. Spaces in the query are ignored
// so word order within a term doesn't have to be exact.
// ponytail: no scoring/ranking — the lists are small and sorted by their own
// control. Add ranking when a result set is long enough to need "best first".
export function fuzzyMatch(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = text.toLowerCase();
  let from = 0;
  for (const ch of q) {
    if (ch === " ") continue;
    const at = t.indexOf(ch, from);
    if (at < 0) return false;
    from = at + 1;
  }
  return true;
}

/** True when the query matches any of the given fields. */
export const fuzzyMatchAny = (fields: string[], query: string): boolean =>
  fields.some((f) => fuzzyMatch(f, query));
