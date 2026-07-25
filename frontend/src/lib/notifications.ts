// Notification feed for the topbar bell.
//
// There is no notifications table and no event log. Rather than invent one, the
// feed is DERIVED from data we already serve — recent submissions and the
// account's usage against its plan. That keeps it truthful: every item here
// corresponds to something that actually happened and that the user can act on.
//
// It also bounds what can be listed. Team/comment/integration/security events
// have no source of truth in this product yet, so they aren't here; adding them
// means adding the feature first, then an events table, then a row here.
//
// ponytail: module-scoped state, fetched once per session and primed by the
// dashboard (which loads the same data anyway). Swap for a real
// GET /notifications when there are events we can't derive.
import { computed, ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { api, type AccountUsage, type FormSummary } from '@/api/client';
import type { Submission } from '@schema';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string; // ISO
  to?: RouteLocationRaw;
  unread: boolean;
  /** Standing conditions (plan limits) pin to the top and never count as unread. */
  pinned?: boolean;
  tone?: 'warn' | 'danger';
}

// Per-device high-water mark, shared with the dashboard's "N new" badge so the
// two can never disagree about what's been seen. Not a server read receipt.
const SEEN_KEY = 'vedya.responsesSeenAt';

const seenAt = ref<string>(
  typeof localStorage === 'undefined' ? '' : (localStorage.getItem(SEEN_KEY) ?? ''),
);

interface RecentResponse {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
}

const recent = ref<RecentResponse[]>([]);
const usage = ref<AccountUsage | null>(null);
const loaded = ref(false);
let inFlight: Promise<void> | null = null;

/** Newest submissions across the most recently active forms. */
async function fetchRecent(forms: FormSummary[]): Promise<RecentResponse[]> {
  // Same shape as the dashboard's: the 3 most recently active forms cover the
  // recent activity without N requests for N forms.
  const active = [...forms]
    .filter((f) => f.responseCount > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
  const perForm = await Promise.all(
    active.map(async (f) => {
      const subs: Submission[] = await api.listSubmissions(f.id);
      return subs.map((s) => ({
        id: s.id,
        formId: f.id,
        formTitle: f.title,
        submittedAt: s.meta.submittedAt,
      }));
    }),
  );
  return perForm
    .flat()
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 8);
}

/** Hand the feed data a caller already fetched, so it doesn't refetch it. */
export function primeNotifications(
  forms: FormSummary[],
  nextUsage: AccountUsage | null,
  nextRecent?: RecentResponse[],
): void {
  usage.value = nextUsage;
  if (nextRecent) {
    recent.value = nextRecent;
    loaded.value = true;
    return;
  }
  inFlight ??= fetchRecent(forms)
    .then((r) => {
      recent.value = r;
    })
    .catch(() => {
      // A failed feed is not worth an error surface — the bell just stays empty.
    })
    .finally(() => {
      loaded.value = true;
      inFlight = null;
    });
}

/** Load once per session. Safe to call from every mounted consumer. */
export function ensureNotifications(): void {
  if (loaded.value || inFlight) return;
  inFlight = (async () => {
    const [nextUsage, forms] = await Promise.all([api.getUsage(), api.listForms()]);
    usage.value = nextUsage;
    recent.value = await fetchRecent(forms);
  })()
    .catch(() => {})
    .finally(() => {
      loaded.value = true;
      inFlight = null;
    });
}

export function useNotifications() {
  const items = computed<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    // Standing alert: the response cap is the one limit that silently costs the
    // user submissions, so it leads. Pinned rather than "unread" — a condition
    // that can't be dismissed must not hold the badge on forever.
    const u = usage.value;
    const cap = u?.limits.responsesPerMonth ?? null;
    if (u && cap !== null && cap > 0) {
      const used = u.monthSubmissions;
      if (used >= cap) {
        list.push({
          id: 'limit-reached',
          title: 'Monthly response limit reached',
          body: `${used} of ${cap} responses used — new submissions are being turned away.`,
          at: new Date().toISOString(),
          to: { name: 'account' },
          unread: false,
          pinned: true,
          tone: 'danger',
        });
      } else if (used / cap >= 0.8) {
        list.push({
          id: 'limit-near',
          title: 'Approaching your response limit',
          body: `${used} of ${cap} responses used this month.`,
          at: new Date().toISOString(),
          to: { name: 'account' },
          unread: false,
          pinned: true,
          tone: 'warn',
        });
      }
    }

    for (const r of recent.value) {
      list.push({
        id: r.id,
        title: 'New response received',
        body: r.formTitle,
        at: r.submittedAt,
        to: { name: 'responses', params: { id: r.formId } },
        unread: r.submittedAt > seenAt.value,
      });
    }
    return list;
  });

  const unreadCount = computed(() => items.value.filter((n) => n.unread).length);

  function markAllRead(): void {
    seenAt.value = new Date().toISOString();
    if (typeof localStorage !== 'undefined') localStorage.setItem(SEEN_KEY, seenAt.value);
  }

  return { items, unreadCount, markAllRead, loaded, seenAt };
}

/** Today / Yesterday / Earlier buckets, in order, skipping empty ones. */
export function groupByDay(items: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  const buckets: Record<string, AppNotification[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of items) {
    const t = new Date(n.at).getTime();
    if (t >= startOfToday.getTime()) buckets.Today!.push(n);
    else if (t >= startOfYesterday.getTime()) buckets.Yesterday!.push(n);
    else buckets.Earlier!.push(n);
  }
  return ['Today', 'Yesterday', 'Earlier']
    .map((label) => ({ label, items: buckets[label]! }))
    .filter((g) => g.items.length > 0);
}
