// Per-grid card arrangement shared by the forms and template grids: pinned
// cards float to the top, and a manual drag order can override the active sort.
// ponytail: both live in localStorage — this is a per-device *view* preference,
// not form data. Move `pinned` to a `forms.pinned` column if it ever needs to
// follow the user across devices (and to key it per account rather than per
// browser profile).
import { ref } from "vue";

interface HasId {
  id: string;
}

// Rank for "not pinned" / "not in the manual order" — a number, not Infinity,
// so the subtraction in the comparator stays a number when both sides miss.
const LAST = 1e9;

export function useBoard(key: string) {
  const storeKey = `vedya.board.${key}`;
  let saved: { pinned?: unknown; order?: unknown } = {};
  try {
    saved = JSON.parse(localStorage.getItem(storeKey) ?? "{}");
  } catch {
    // Corrupt entry — start fresh rather than break the grid.
  }
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

  const pinned = ref<string[]>(strings(saved.pinned));
  const order = ref<string[]>(strings(saved.order));
  /** The card currently being dragged (null when idle) — drives the drag cue. */
  const dragId = ref<string | null>(null);

  const save = (): void =>
    localStorage.setItem(
      storeKey,
      JSON.stringify({ pinned: pinned.value, order: order.value }),
    );

  const isPinned = (id: string): boolean => pinned.value.includes(id);

  function togglePin(id: string): void {
    pinned.value = isPinned(id)
      ? pinned.value.filter((p) => p !== id)
      : [...pinned.value, id];
    save();
  }

  /**
   * Pinned first (in pin order), then — when `useOrder` — the manual drag
   * order. Ties keep the caller's order, since Array#sort is stable.
   */
  function arrange<T extends HasId>(list: T[], useOrder = true): T[] {
    const rank = (id: string): number => {
      const i = pinned.value.indexOf(id);
      return i < 0 ? LAST : i;
    };
    const seat = (id: string): number => {
      if (!useOrder) return LAST;
      const i = order.value.indexOf(id);
      return i < 0 ? LAST : i;
    };
    return [...list].sort(
      (a, b) => rank(a.id) - rank(b.id) || seat(a.id) - seat(b.id),
    );
  }

  function onDragStart(id: string): void {
    dragId.value = id;
  }
  function onDragEnd(): void {
    dragId.value = null;
  }
  /** Drop the dragged card onto `targetId`. `visible` is the grid as rendered. */
  function onDrop(targetId: string, visible: HasId[]): void {
    const from = dragId.value;
    dragId.value = null;
    if (from && from !== targetId) reseat(from, targetId, visible);
  }
  /** Keyboard equivalent of a drag: nudge a card one slot back/forward. */
  function move(id: string, delta: number, visible: HasId[]): void {
    const target = visible[visible.findIndex((v) => v.id === id) + delta];
    if (target) reseat(id, target.id, visible);
  }

  function reseat(id: string, targetId: string, visible: HasId[]): void {
    const ids = visible.map((v) => v.id);
    const forward = ids.indexOf(id) < ids.indexOf(targetId);
    const next = ids.filter((i) => i !== id);
    next.splice(next.indexOf(targetId) + (forward ? 1 : 0), 0, id);
    // ponytail: seeded from the *visible* cards, so anything hidden by a search
    // or filter keeps its relative order but sinks below them.
    order.value = next.concat(order.value.filter((i) => !next.includes(i)));
    save();
  }

  return {
    pinned,
    order,
    dragId,
    isPinned,
    togglePin,
    arrange,
    onDragStart,
    onDragEnd,
    onDrop,
    move,
  };
}
