import { expect, it } from "vitest";
import AMM from "../../content/amm.json";
import { AMM_PARTS } from "./ammReading";

const chapters = import.meta.glob<string>("../../content/essays/amm-chapter-*.md", { query: "?raw", import: "default", eager: true });

// The chapter a source line names, as published, without Markdown emphasis.
const chapterText = (source: string) => {
  const part = AMM_PARTS.find(item => source.startsWith(item.label));
  expect(part, source).toBeDefined();
  return chapters[`../../content/essays/${part!.slug}.md`].replace(/\*+/g, "");
};

it("closes every home scene on the author's own sentence, quoted exactly from the chapter it names", () => {
  for (const concept of AMM.home.concepts) expect(chapterText(concept.source)).toContain(concept.argument);
  expect(chapterText(AMM.home.overviewSource)).toContain(AMM.home.overviewArgument);
});
