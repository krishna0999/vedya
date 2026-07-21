import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "@/lib/fuzzy";

describe("fuzzyMatch", () => {
  it("matches subsequences, not just substrings", () => {
    expect(fuzzyMatch("Contact us", "cntus")).toBe(true);
    expect(fuzzyMatch("Contact us", "cnt us")).toBe(true);
    expect(fuzzyMatch("Contact us", "contact")).toBe(true);
  });

  it("respects order and rejects missing characters", () => {
    expect(fuzzyMatch("Contact us", "us cnt")).toBe(false); // wrong order
    expect(fuzzyMatch("Contact us", "cntz")).toBe(false);
    expect(fuzzyMatch("Event RSVP", "rsvpp")).toBe(false); // only one p
  });

  it("treats an empty query as match-all", () => {
    expect(fuzzyMatch("anything", "")).toBe(true);
    expect(fuzzyMatch("anything", "   ")).toBe(true);
  });
});
