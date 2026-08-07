import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const releaseRoot = join(
  process.cwd(),
  "public/publications/henok/digital-organism-theory/v2",
);
const manuscriptPath = join(
  process.cwd(),
  "../docs/blueprint/DOT-Book-One-Version-2-Line-Edited.docx",
);
const manifest = JSON.parse(
  readFileSync(join(releaseRoot, "manifest.json"), "utf8"),
) as {
  source: { name: string; sha256: string };
  project: { subtitle: string };
  release: { version: number; label: string };
  extent: { equations: number; references: number };
  sections: Array<{ content_path: string }>;
};

describe("Book One edition v2", () => {
  it("is generated from the current line-edited manuscript", () => {
    const digest = createHash("sha256")
      .update(readFileSync(manuscriptPath))
      .digest("hex");

    expect(manifest.source.sha256).toBe(digest);
    expect(manifest.source.name).toBe(
      "DOT-Book-One-Version-2-Line-Edited.docx",
    );
    expect(manifest.release.version).toBe(2);
    expect(manifest.release.label).toBe("Line-edited edition");
  });

  it("carries the current title language and complete apparatus", () => {
    expect(manifest.project.subtitle).toBe(
      "A Framework for Consciousness, Conditioning, and Conscious Authorship",
    );
    expect(manifest.extent.equations).toBe(14);
    expect(manifest.extent.references).toBe(25);
    expect(
      manifest.sections.every((section) =>
        existsSync(join(releaseRoot, section.content_path)),
      ),
    ).toBe(true);
  });
});
