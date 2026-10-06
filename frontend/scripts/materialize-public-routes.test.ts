import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AUTHOR,
  AUTHOR_PROFILE,
  DOCTRINE_CONCEPTS,
  RELEASE_MANIFEST,
  SITE_URL,
  fetchNativeWriting,
  publicRoutes,
  renderMarkdown,
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
  canonicalRoute?: string;
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

  it("describes the PDF as free and makes the download work without JavaScript", () => {
    const route = routes.find((candidate) => candidate.route === "/book/digital-organism-theory/copy")!;
    const book = nodeOfType(route, "Book");
    const editions = book?.workExample as Array<{ isAccessibleForFree: boolean; offers: { price: string } }>;
    expect(editions[0].isAccessibleForFree).toBe(true);
    expect(editions[0].offers.price).toBe("0.00");
    expect(route.description).not.toMatch(/purchase|authenticated/);
    const html = new DOMParser().parseFromString(route.prerender!, "text/html");
    const download = html.querySelector("a[download]");
    expect(download?.textContent).toBe("Download the free PDF");
    expect(download?.getAttribute("href")).toBe(
      `/publications/henok/digital-organism-theory/v${manifest.release.version}/digital-organism-theory-book-one.pdf`,
    );
    expect(download?.getAttribute("download")).toBe(
      "Digital-Organism-Theory-Book-One-Digital-Edition.pdf",
    );
    expect(route.prerender).not.toContain(".docx");
  });
});

describe("sitemap", () => {
  const xml = sitemapXml(routes, manifest.release.updated_at);

  it("lists the home page and every canonical indexable route once", () => {
    const locations = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
    expect(locations).toEqual([
      `${SITE_URL}/`,
      ...routes.filter((route) => !route.noindex && !route.canonicalRoute).map((route) => `${SITE_URL}${route.route}`),
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
      const source = readFileSync(join("public/publications/henok/digital-organism-theory/v4", section.content_path), "utf8");
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

  it("folds depth passages into native disclosures that work without JavaScript", () => {
    const html = renderMarkdown(
      "Core argument.\n\n::: depth Formal notation\n\nThe detail stays in the page.\n\n:::\n\nThe argument continues.\n",
    );
    expect(html).toMatch(/<details class="book-depth"[^>]*><summary class="book-depth__summary"[^>]*>Formal notation<\/summary>/);
    expect(html).toContain("The detail stays in the page.");
    expect(html).not.toContain(":::");
  });

  it("puts that text inside #root, where the app replaces it", () => {
    const html = renderRoute(shell, routeAt("/privacy"));
    expect(html).toMatch(/<div id="root"><article data-prerender><h1>Privacy<\/h1>/);
    const terms = renderRoute(shell, routeAt("/terms"));
    expect(terms).toMatch(/<div id="root"><article data-prerender><h1>Terms and refunds<\/h1>/);
    expect(renderRoute(shell, routeAt("/support"))).toContain('<a href="/terms">Terms and refunds</a>');
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
    expect(html).toContain(
      '<a href="/book/digital-organism-theory/preface?path=start-where-you-live">Begin with lived experience</a>',
    );
  });

  it("carries the hero proposition into metadata and the script-free home", () => {
    const description = /name="description"\s+content="([^"]+)"/.exec(shell)?.[1];
    expect(description).toContain("What shapes the life you live?");
    expect(description).toContain("consciousness-first theory of everything");
    expect(description).toContain("a construction, not a revelation.");
    expect(description).not.toContain("greater awareness can support");
    for (const field of ["og:description", "twitter:description"]) {
      const content = new RegExp(`(?:name|property)="${field}"\\s+content="([^"]+)"`)
        .exec(shell)?.[1];
      expect(content).toBe(description);
    }
    expect(rootDocument(shell, manifest)).toContain(`<p>${description}</p>`);
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

  it("keeps the old archive address as a canonical alias and preserves external letters in the blog", () => {
    const alias = routes.find((route) => route.route === "/essays")!;
    expect(alias.canonicalRoute).toBe("/blog");
    expect(alias.prerender).toContain('href="/blog">All writing</a>');
    expect(renderRoute(shell, alias)).toContain('<link rel="canonical" href="https://dotheory.org/blog" />');
    expect(renderRoute(shell, alias)).not.toContain('name="robots" content="noindex"');
    const sitemap = sitemapXml(routes, "2026-10-06");
    expect(sitemap).toContain("<loc>https://dotheory.org/blog</loc>");
    expect(sitemap).not.toContain("<loc>https://dotheory.org/essays</loc>");
    const blog = routes.find((route) => route.route === "/blog")!;
    expect(blog.prerender).toContain("AI will not kill you. The one saying that it will, will");
    expect(blog.prerender).toContain("Read on LinkedIn");
    expect(routes.some((route) => route.route.startsWith("/essays/"))).toBe(false);
    const home = rootDocument(shell, manifest);
    expect(home).toContain('href="/blog"');
    expect(home).not.toContain('href="/essays"');
    expect(home).not.toContain('href="/feed.xml"');
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
    expect(route.prerender).toContain('href="/blog">All writing</a>');
    expect(route.prerender).toContain("End of essay");

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

  it("lets readers subscribe before the first piece without inventing an item or date", () => {
    const feed = new DOMParser().parseFromString(rssXml([]), "application/xml");
    expect(feed.querySelector("parsererror")).toBeNull();
    expect(feed.querySelector("channel > link")?.textContent).toBe(`${SITE_URL}/blog`);
    expect(feed.querySelectorAll("item")).toHaveLength(0);
    expect(feed.querySelector("lastBuildDate")).toBeNull();
    expect(feed.getElementsByTagNameNS("http://www.w3.org/2005/Atom", "link")[0].getAttribute("href")).toBe(`${SITE_URL}/feed.xml`);
  });
});

describe("native writing", () => {
  const api = "https://api.example.org";
  const manifestFor = (title: string) => ({
    title,
    summary: "An analysis of the world through DOT.",
    release: { number: 2 },
    revision: { content_hash: "hash" },
    claims: [{ statement: "The author's claim", epistemic_level: "Hypothesis", origin: "sourced" }],
    sources: [{ external_uri: "https://example.org/report", locator: null, relation: "cites" }],
  });
  const responses: Record<string, unknown> = {
    "/v1/academy/delivery/catalog?space=dot-academy": [
      { work_id: "awork_abc123", work_slug: "ai", title: "AI letter", summary: "An analysis.", kind: "essay", release_number: 2, released_at: "2026-10-05T12:00:00Z", withdrawn_at: null },
      { work_id: "awork_gone", work_slug: "gone", title: "Gone", summary: null, kind: "essay", release_number: 1, released_at: "2026-10-01T12:00:00Z", withdrawn_at: "2026-10-02T00:00:00Z" },
      { work_id: "awork_def", work_slug: "def", title: "A definition", summary: null, kind: "definition", release_number: 1, released_at: "2026-10-01T12:00:00Z", withdrawn_at: null },
    ],
    "/v1/academy/delivery/works/awork_abc123/releases/1": { withdrawn: true, title: "AI letter", reason: "Corrected" },
    "/v1/academy/delivery/works/awork_abc123/releases/2": { manifest: manifestFor("AI letter"), body_ref: "academy/space/releases/2.md" },
    "/v1/academy/delivery/body/academy/space/releases/2.md": "The **whole** text.\n\n<script>alert(1)</script>",
  };
  const fetchImpl = async (url: string) => {
    const key = url.slice(api.length);
    if (!(key in responses)) return new Response("missing", { status: 404 });
    const value = responses[key];
    return new Response(typeof value === "string" ? value : JSON.stringify(value));
  };

  it("is not fetched by local builds", async () => {
    expect(await fetchNativeWriting("http://127.0.0.1:8000", { fetchImpl: () => { throw new Error("no network"); } })).toEqual([]);
    expect(await fetchNativeWriting(undefined)).toEqual([]);
  });

  it("gives every live release its own shareable page with whole text, claims and sources", async () => {
    const writing = await fetchNativeWriting(api, { fetchImpl });
    expect(writing.map((item: { id: string }) => item.id)).toEqual(["awork_abc123"]);
    const withWriting: PublicRoute[] = await publicRoutes(manifest, { essays: [], writing });
    const paths = withWriting.map((route) => route.route);
    expect(paths).toContain("/writing/awork_abc123");
    expect(paths).toContain("/writing/awork_abc123/releases/2");
    expect(paths).not.toContain("/writing/awork_abc123/releases/1");

    const page = withWriting.find((route) => route.route === "/writing/awork_abc123/releases/2")!;
    expect(page.ogType).toBe("article");
    expect(page.title).toBe(`AI letter — ${AUTHOR.name}`);
    expect(page.prerender).toContain("<strong>whole</strong>");
    expect(page.prerender).not.toContain("<script>");
    expect(page.prerender).toMatch(/The author(&#39;|&#039;|')s claim \(Hypothesis\)/);
    expect(page.prerender).toContain('href="https://example.org/report"');
    expect(page.prerender).toContain('href="/blog">All writing</a>');
    expect(page.prerender).toContain("End of piece");
    const html = renderRoute(shell, page);
    expect(html).toContain(`<meta property="og:url" content="${SITE_URL}/writing/awork_abc123/releases/2" />`);
    expect(html).toContain('<meta property="og:title" content="AI letter — ');

    const publications = withWriting.find((route) => route.route === "/publications")!;
    expect(publications.prerender).toContain('href="/blog">Letters and essays</a>');
  });

  it("fails the build rather than silently dropping published work", async () => {
    const broken = async () => new Response("down", { status: 503 });
    await expect(fetchNativeWriting(api, { fetchImpl: broken })).rejects.toThrow(/503/);
  });
});
