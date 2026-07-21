import { beforeEach, describe, expect, it } from "vitest";
import { useBoard } from "@/lib/board";

const cards = (...ids: string[]) => ids.map((id) => ({ id }));
const ids = (list: { id: string }[]) => list.map((c) => c.id);

describe("useBoard", () => {
  beforeEach(() => localStorage.clear());

  it("floats pinned cards to the top in pin order, keeping the rest stable", () => {
    const b = useBoard("t");
    b.togglePin("c");
    b.togglePin("a");
    expect(ids(b.arrange(cards("a", "b", "c", "d")))).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
    b.togglePin("c");
    expect(ids(b.arrange(cards("a", "b", "c", "d")))).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("applies the drag order only when asked, and pins still win", () => {
    const b = useBoard("t");
    const list = cards("a", "b", "c");
    b.onDragStart("c");
    b.onDrop("a", list); // c dropped onto a -> lands before it
    expect(ids(b.arrange(list))).toEqual(["c", "a", "b"]);
    expect(ids(b.arrange(list, false))).toEqual(["a", "b", "c"]);
    b.togglePin("b");
    expect(ids(b.arrange(list))).toEqual(["b", "c", "a"]);
  });

  it("moves forward past the target, and clamps at the ends", () => {
    const b = useBoard("t");
    const list = cards("a", "b", "c");
    b.move("a", 1, list);
    expect(ids(b.arrange(list))).toEqual(["b", "a", "c"]);
    b.move("b", -1, b.arrange(list)); // already first — no-op
    expect(ids(b.arrange(list))).toEqual(["b", "a", "c"]);
  });

  it("persists across instances", () => {
    const b = useBoard("t");
    b.togglePin("a");
    expect(useBoard("t").isPinned("a")).toBe(true);
    expect(useBoard("other").isPinned("a")).toBe(false);
  });
});
