// Feature: website-content-expansion, Property 1: Gallery sort is an ascending permutation
//
// For any list of manifest image entries, sortImages returns a list that is a
// permutation of the input and is ordered non-decreasing by `file` under
// ascending alphanumeric comparison.
//
// Validates: Requirements 1.1
//
// Dev-only test (fast-check + Vitest). Never shipped to the site.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import gallery from "./gallery.js";

const { sortImages } = gallery;

// Random manifest entry: arbitrary filename in `file`, optional alt, and a ref.
const entryArb = fc.record(
  {
    file: fc.string(),
    alt: fc.string(),
    ref: fc.string(),
  },
  { requiredKeys: ["file", "ref"] }
);

// Multiset of whole entries (keyed by JSON) so permutation is asserted on the
// full objects, not just the `file` sort key. Catches dropped/duplicated/mutated
// entries even when several share the same `file`.
function entryCounts(entries) {
  const counts = new Map();
  for (const e of entries) {
    const key = JSON.stringify(e);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function sameMultiset(a, b) {
  const ca = entryCounts(a);
  const cb = entryCounts(b);
  if (ca.size !== cb.size) return false;
  for (const [k, v] of ca) {
    if (cb.get(k) !== v) return false;
  }
  return true;
}

describe("Property 1: Gallery sort is an ascending permutation", () => {
  it("returns a permutation of the input, ordered non-decreasing by file", () => {
    fc.assert(
      fc.property(fc.array(entryArb), (entries) => {
        const sorted = sortImages(entries);

        // Same length.
        expect(sorted).toHaveLength(entries.length);

        // Permutation: identical multiset of whole entries.
        expect(sameMultiset(sorted, entries)).toBe(true);

        // Ordered non-decreasing by `file`.
        for (let i = 1; i < sorted.length; i++) {
          const prev = String(sorted[i - 1].file);
          const cur = String(sorted[i].file);
          expect(prev <= cur).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
