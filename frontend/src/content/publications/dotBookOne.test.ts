import { describe, expect, it } from "vitest";

import { parseBookReferences } from "./dotBookOne";

describe("parseBookReferences", () => {
  it("preserves complete numbered reference entries", () => {
    const references = parseBookReferences(`Introductory note.

### Reference 1

First source. [Open](https://example.com/one)

### Reference 2

Second source, with another line.
`);

    expect(references.size).toBe(2);
    expect(references.get(1)?.markdown).toContain("First source");
    expect(references.get(1)?.markdown).toContain("https://example.com/one");
    expect(references.get(2)?.markdown).toBe("Second source, with another line.");
  });
});
