import { test, expect } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

const post = {
  slug: "layout-check", title: "A place for the work, and the thinking behind it.",
  summary: "Publication design preview: a banner, clear typography, and figures that belong to the argument.",
  published: "2026-10-14", updated: null, levels: ["observation"], concepts: [], words: 440, readingMinutes: 2,
  format: "case-study", series: "Architecture notes",
  cover: { src: "/og/henok-writing.png", alt: "Writing and ideas title card", caption: "Existing site artwork, used for this layout test.", width: 1200, height: 630 },
  images: { "/work/4us/mesob.webp": { width: 1024, height: 1536 } },
};
const body = `This is a layout fixture, not an article by the author. It checks how a complete post carries a banner, readable text, an inline image, and a clear ending.\n\n## The shape of the piece\n\nA post can be an essay, case study, or letter. Its images belong beside the text that gives them meaning.\n\n![Woven Mesob artwork](/work/4us/mesob.webp "Existing 4Us artwork. A caption remains visible below the image.")\n\n## Sources and details\n\n| Element | Purpose |\n| --- | --- |\n| Banner | Introduce the subject |\n| Figure | Explain a detail |\n\n\`\`\`ts\nconst publish = (post: Draft) => validate(post);\n\`\`\`\n\nThe piece ends here.`;

test("a Markdown post reads on mobile and desktop with its images, captions, and ending", async ({ page }) => {
  await page.route("**/essays/index.json", (route) => route.fulfill({ json: { schema: "dot.essays.v1", essays: [post] } }));
  await page.route("**/essays/layout-check.md", (route) => route.fulfill({ contentType: "text/markdown", body }));
  await page.goto("/essays/layout-check");
  await expect(page.getByRole("heading", { level: 1, name: post.title })).toBeVisible();
  const banner = page.getByRole("img", { name: post.cover.alt });
  await expect.poll(() => banner.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.getByText(post.cover.caption)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  const figure = page.locator("figure").filter({ has: page.getByRole("img", { name: "Woven Mesob artwork" }) });
  await figure.scrollIntoViewIfNeeded();
  await expect(figure.locator("figcaption")).toHaveText("Existing 4Us artwork. A caption remains visible below the image.");
  await expect(figure.locator("img")).toHaveAttribute("width", "1024");
  await expectNoHorizontalOverflow(page);
  await page.getByText("End of case study", { exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("link", { name: "All writing", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "All writing", exact: true }).click();
  await expect(page).toHaveURL("/blog");
  await expect(page.locator('.blog-post img[src="/og/henok-writing.png"]')).toBeVisible();
});
