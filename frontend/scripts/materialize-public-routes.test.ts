import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AUTHOR_PROFILE,
  DOCTRINE_CONCEPTS,
  RELEASE_MANIFEST,
  SITE_URL,
  publicRoutes,
  robotsTxt,
  sitemapXml,
  // The build script is plain ESM so it can run against `dist/` on bare Node.
  // @ts-expect-error -- no declarations; this test is the contract instead.
} from "./materialize-public-routes.mjs";
import { doctrineNodes } from "../src/content/doctrine/doctrineData";
import { siteConfig } from "../src/content/site.config";

interface PublicRoute {
  route: string;
  title: string;
  description: string;
  image?: string;
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

  it("lists the home page and every materialized route once", () => {
    const locations = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
    expect(locations).toEqual([
      `${SITE_URL}/`,
      ...routes.map((route) => `${SITE_URL}${route.route}`),
    ]);
    expect(new Set(locations).size).toBe(locations.length);
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
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});
