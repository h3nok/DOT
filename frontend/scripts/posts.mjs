import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ESSAYS_DIR, parseEssay, readEssays } from "./essays.mjs";
import { DOCTRINE_CONCEPTS } from "./materialize-public-routes.mjs";

const [command, slug] = process.argv.slice(2);
try {
  if (command === "new") {
    if (!slug) throw new Error("Choose a filename: pnpm post:new my-post");
    const template = readFileSync(path.join(ESSAYS_DIR, "_template.md"), "utf8")
      .replace(/^published: .+$/m, `published: ${new Date().toISOString().slice(0, 10)}`)
      .replaceAll("my-post", slug);
    parseEssay(template, slug);
    writeFileSync(path.join(ESSAYS_DIR, `${slug}.md`), template, { flag: "wx" });
    mkdirSync(path.join(ESSAYS_DIR, slug), { recursive: true });
    console.log(`Created src/content/essays/${slug}.md as a draft.\nPut its images in src/content/essays/${slug}/.\nRun pnpm post:preview, then open /_preview/essays/${slug}.\nGuide: ../docs/PUBLISHING.md`);
  } else if (command === "check") {
    const essays = readEssays({ includeDrafts: true });
    const concepts = new Set(DOCTRINE_CONCEPTS.map((item) => item.id));
    for (const essay of essays) {
      for (const concept of essay.concepts) {
        if (!concepts.has(concept)) throw new Error(`${essay.slug}.md: unknown concept "${concept}".`);
      }
      console.log(`${essay.draft ? "DRAFT" : "RELEASE"}  ${essay.slug} · ${essay.readingMinutes} min · ${essay._assets.length} images${essay.cover ? " · banner ready" : " · text only"}`);
    }
    console.log(`Checked ${essays.length} posts. ${essays.filter((essay) => !essay.draft).length} will publish on the next deployment.\nDrafts stay off the site; committed files remain visible in the public repository.`);
  } else throw new Error("Use pnpm post:new <slug>, pnpm post:check, or pnpm post:preview.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
