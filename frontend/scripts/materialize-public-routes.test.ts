import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AUTHOR,
  AUTHOR_PROFILE,
  DOCTRINE_CONCEPTS,
  RELEASE_MANIFEST,
  SITE_URL,
  publicRoutes,
  renderRoute,
  robotsTxt,
  rootDocument,
  rssXml,
  sitemapXml,
  // The build script is plain ESM so it can run against `dist/` on bare Node.
  // @ts-expect-error -- no declarations; this test is the contract instead.
} from "./materialize-public-routes.mjs";
// @ts-expect-error -- plain ESM, shared with the Vite plugin.
import { parseEssay } from "./essays.mjs";
import { doctrineNodes } from "../src/content/doctrine/doctrineData";
import { siteConfig } from "../src/content/site.config";

interface PublicRoute {
  route: string;
  title: string;
  description: string;
  image?: string;
  ogType?: string;
  noindex?: boolean;
  lastmod?: string;
  prerender?: string;
  structuredData: { "@context": string; "@graph": Record<string, unknown>[] };
}

const manifest = JSON.parse(readFileSync(RELEASE_MANIFEST, "utf8"));
const routes: PublicRoute[] = await publicRoutes(manifest);

const nodeOfType = (route: PublicRoute, type: string) =>
  route.structuredData["@graph"].find((node) => node["@type"] === type);

describe("public route metadata", () => {
  it("carries the concept map's real names, not a copy that has drifted", () => {
    // The script cannot import TypeScript, so it restates the concept map. If
    // a concept is renamed or reworded in the book's data and not here, every
    // shared concept link would keep describing the old idea.
    expect(
      DOCTRINE_CONCEPTS.map((concept: { id: string; name: string; oneLine: string }) => concept),
    ).toEqual(
      doctrineNodes.map((node) => ({
        id: node.id,
        name: node.title,
        oneLine: node.oneLine,
      })),
    );
  });

  it("names the same author profile the site does", () => {
    expect(AUTHOR_PROFILE).toBe(siteConfig.social.linkedin);
  });

  it("gives every concept its own title and description", () => {
    const conceptRoutes = routes.filter((route) => route.route.startsWith("/doctrine/"));
    expect(conceptRoutes).toHaveLength(doctrineNodes.length);
    expect(new Set(conceptRoutes.map((route) => route.title)).size).toBe(
      conceptRoutes.length,
    );
    expect(new Set(conceptRoutes.map((route) => route.description)).size).toBe(
      conceptRoutes.length,
    );
  });

  it("describes every route to a crawler that cannot run the app", () => {
    for (const route of routes) {
      expect(route.structuredData["@context"], route.route).toBe("https://schema.org");
      expect(route.structuredData["@graph"].length, route.route).toBeGreaterThan(0);
    }
  });

  it("describes the Academy as a collection rather than as the book", () => {
    const route = routes.find((candidate) => candidate.route === "/academy");
    expect(route).toBeDefined();
    const academy = nodeOfType(route!, "CollectionPage");
    expect(academy?.name).toBe("DOT Academy");
    expect(route?.structuredData["@graph"].some((node) => node["@type"] === "Book")).toBe(
      false,
    );
  });

  it("gives the Book One landing its own share image", () => {
    const route = routes.find(
      (candidate) => candidate.route === "/book/digital-organism-theory",
    );
    expect(route?.image).toBe("/og/book-one.png");
    expect(existsSync(join("public", route!.image!))).toBe(true);
  });

  it("states each chapter as a chapter of the book at its own URL", () => {
    for (const section of manifest.sections) {
      const route = routes.find(
        (candidate) => candidate.route === `/book/digital-organism-theory/${section.slug}`,
      );
      expect(route, section.slug).toBeDefined();
      const chapter = nodeOfType(route!, "Chapter");
      expect(chapter?.name).toBe(section.title);
      expect(chapter?.url).toBe(`${SITE_URL}/book/digital-organism-theory/${section.slug}`);
      expect((chapter?.isPartOf as Record<string, string>)["@id"]).toBe(
        `${SITE_URL}/book/digital-organism-theory#book`,
      );
    }
  });

  it("gives every chapter its own share card, and the card exists", () => {
    for (const section of manifest.sections) {
      const route = routes.find(
        (candidate) => candidate.route === `/book/digital-organism-theory/${section.slug}`,
      )!;
      expect(route.image, section.slug).toBe(`/og/book/${section.slug}.png`);
      expect(existsSync(join("public", route.image!)), route.image).toBe(true);
    }
  });

  it("states the edition, its author, and the PDF of it on the book page", () => {
    const route = routes.find((candidate) => candidate.route === "/book/digital-organism-theory");
    const book = nodeOfType(route!, "Book") as Record<string, never>;
    expect(book.name).toBe(manifest.project.title);
    expect(book.bookEdition).toContain(String(manifest.release.version));
    expect((book.author as unknown as { name: string }).name).toBe(manifest.project.author);
    expect(book.hasPart).toHaveLength(manifest.sections.length);
  });
});

describe("sitemap", () => {
  const xml = sitemapXml(routes, manifest.release.updated_at);

  it("lists the home page and every indexable route once", () => {
    const locations = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
    expect(locations).toEqual([
      `${SITE_URL}/`,
      ...routes.filter((route) => !route.noindex).map((route) => `${SITE_URL}${route.route}`),
    ]);
    expect(new Set(locations).size).toBe(locations.length);
  });

  it("leaves out the page a reader-list message links to", () => {
    expect(xml).not.toContain("/readers/leave");
  });

  it("uses the sitemap namespace and the release date", () => {
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain(`<lastmod>${manifest.release.updated_at}</lastmod>`);
  });

  it("offers no owner tooling and no duplicate of the book for indexing", () => {
    expect(xml).not.toContain("/studio");
    expect(xml).not.toContain("/read/");
  });
});

describe("robots.txt", () => {
  it("opens the reading surface, closes the studio, and names the sitemap", () => {
    const robots = robotsTxt();
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /studio");
    expect(robots).toContain("Disallow: /readers/leave");
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

const shell = readFileSync("index.html", "utf8");
const routeAt = (path: string) => routes.find((candidate) => candidate.route === path)!;

describe("the author", () => {
  it("is one person across the site, stated on the About page", () => {
    const about = routeAt("/about");
    const profile = nodeOfType(about, "ProfilePage") as { mainEntity: Record<string, unknown> };
    expect(profile.mainEntity["@id"]).toBe(`${SITE_URL}/about#person`);
    expect(profile.mainEntity.sameAs).toContain(AUTHOR_PROFILE);

    // The book names the same entity, so a search engine joins the two.
    const book = nodeOfType(routeAt("/book/digital-organism-theory"), "Book") as {
      author: Record<string, unknown>;
    };
    expect(book.author["@id"]).toBe(`${SITE_URL}/about#person`);
    expect(AUTHOR.name).toBe(manifest.project.author);
  });

  it("names where the author studied, and each dissertation as their own work", () => {
    const about = routeAt("/about");
    const person = (nodeOfType(about, "ProfilePage") as { mainEntity: Record<string, unknown> })
      .mainEntity as { alumniOf?: Array<{ name: string }>; honorificSuffix?: string };
    const credentials: Array<{ institution: string; dissertation?: { url: string } }> =
      AUTHOR.credentials;

    expect(person.alumniOf?.map((school) => school.name)).toEqual([
      ...new Set(credentials.map((credential) => credential.institution)),
    ]);
    expect(person.honorificSuffix).toBe(AUTHOR.suffix);

    const theses = about.structuredData["@graph"].filter((node) => node["@type"] === "Thesis");
    expect(theses.map((thesis) => thesis.url)).toEqual(
      credentials.flatMap((credential) => credential.dissertation?.url ?? []),
    );
    for (const thesis of theses) {
      expect((thesis.author as Record<string, string>)["@id"]).toBe(`${SITE_URL}/about#person`);
    }
  });

  it("introduces the author in their own words, even without JavaScript", () => {
    const text = routeAt("/about").prerender!;
    expect(text).toContain(AUTHOR.summary);
    expect(text).toContain("For nearly two decades");
  });
});

describe("page text for readers without JavaScript", () => {
  it("writes every chapter's own text into its page", () => {
    for (const section of manifest.sections) {
      const source = readFileSync(join("public/publications/henok/digital-organism-theory/v3", section.content_path), "utf8");
      // The first line of prose, as a crawler would quote it.
      const firstProse = source.split("\n").find((line: string) => /^[A-Z][a-z]/.test(line))!;
      const route = routeAt(`/book/digital-organism-theory/${section.slug}`);
      expect(route.prerender, section.slug).toContain(firstProse.slice(0, 40));
    }
  });

  it("renders math for a reader, not for a script", () => {
    const withMath = routes.filter((route) => route.prerender?.includes("<math"));
    expect(withMath.length).toBeGreaterThan(0);
    expect(routes.some((route) => route.prerender?.includes("<script"))).toBe(false);
  });

  it("puts that text inside #root, where the app replaces it", () => {
    const html = renderRoute(shell, routeAt("/privacy"));
    expect(html).toMatch(/<div id="root"><article data-prerender><h1>Privacy<\/h1>/);
  });

  it("hides that text from any browser that runs scripts", () => {
    // If this marker ever stopped running before first paint, every visitor
    // would see a page of plain text flash before the app.
    expect(shell).toContain('document.documentElement.classList.add("js")');
    expect(shell).toContain(".js [data-prerender] { display: none; }");
  });

  it("gives the home page the author, the book, and a way into every chapter", () => {
    const html = rootDocument(shell, manifest);
    expect(html).toContain('<article data-prerender><h1>Digital Organism Theory</h1>');
    for (const section of manifest.sections) {
      expect(html).toContain(`href="/book/digital-organism-theory/${section.slug}"`);
    }
    expect(html).toContain('href="/about"');
  });

  it("keeps the leave page out of search engines", () => {
    const leave = routeAt("/readers/leave");
    expect(leave.noindex).toBe(true);
    expect(renderRoute(shell, leave)).toContain('<meta name="robots" content="noindex" />');
    expect(renderRoute(shell, routeAt("/about"))).not.toContain("noindex");
  });

  it("keeps a dollar sign in a title as written", () => {
    const html = renderRoute(shell, { ...routeAt("/privacy"), title: "What $& costs" });
    expect(html).toContain("<title>What $&amp; costs</title>");
  });
});

describe("essays", () => {
  const essayFile = (front: string, body: string) => `---\n${front}\n---\n\n${body}\n`;
  const older = parseEssay(
    essayFile(
      [
        "title: Fear narrows",
        "summary: Why fear shrinks what feels possible.",
        "published: 2026-10-01",
        "levels: [observation, model]",
        "concepts: [fear-gating]",
      ].join("\n"),
      "See [the concept map](/doctrine/fear-gating). A CDATA end ]]> stays text.",
    ),
    "fear-narrows",
  );
  const newer = parseEssay(
    essayFile(
      [
        "title: Is a language model a Digital Organism? Q&A",
        "summary: What DOT's definition says about machines.",
        "published: 2026-10-14",
        "updated: 2026-10-20",
        "levels: [model, hypothesis]",
      ].join("\n"),
      "The text.",
    ),
    "language-models",
  );
  const essays = [newer, older];

  it("are not listed anywhere until one is published", async () => {
    expect(routes.some((route) => route.route.startsWith("/essays"))).toBe(false);
    expect(rootDocument(shell, manifest)).not.toContain('href="/essays"');
  });

  it("each state their author, dates, and the concepts they build on", async () => {
    const withEssays: PublicRoute[] = await publicRoutes(manifest, { essays });
    const route = withEssays.find((candidate) => candidate.route === "/essays/fear-narrows")!;
    expect(route.ogType).toBe("article");
    expect(route.lastmod).toBe("2026-10-01");
    const article = nodeOfType(route, "Article") as Record<string, unknown>;
    expect((article.author as Record<string, unknown>)["@id"]).toBe(`${SITE_URL}/about#person`);
    expect(article.datePublished).toBe("2026-10-01");
    expect((article.about as Array<{ name: string }>)[0].name).toBe("The Fear-Gating Principle");

    const revised = withEssays.find((candidate) => candidate.route === "/essays/language-models")!;
    expect((nodeOfType(revised, "Article") as Record<string, unknown>).dateModified).toBe("2026-10-20");
  });

  it("refuse to link a concept the map does not have", async () => {
    const stray = { ...older, concepts: ["not-a-concept"] };
    await expect(publicRoutes(manifest, { essays: [stray] })).rejects.toThrow(/not a concept/);
  });

  it("are carried whole by a feed a reader's own software can pull", () => {
    const xml = rssXml(essays);
    const feed = new DOMParser().parseFromString(xml, "application/xml");
    expect(feed.querySelector("parsererror")).toBeNull();

    const items = Array.from(feed.querySelectorAll("item"));
    expect(items.map((item) => item.querySelector("link")?.textContent)).toEqual([
      `${SITE_URL}/essays/language-models`,
      `${SITE_URL}/essays/fear-narrows`,
    ]);
    expect(items[0].querySelector("title")?.textContent).toBe(
      "Is a language model a Digital Organism? Q&A",
    );
    // Root-relative links would point nowhere from inside a feed reader.
    expect(xml).toContain(`href="${SITE_URL}/doctrine/fear-gating"`);
    // A "]]>" in the prose must not end the CDATA block and break the feed.
    const encoded = items[1].getElementsByTagNameNS(
      "http://purl.org/rss/1.0/modules/content/",
      "encoded",
    )[0];
    expect(encoded.textContent).toContain("A CDATA end ]]&gt; stays text.");
  });
});
