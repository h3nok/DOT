import {
  DOT_BOOK_ONE_ROUTE,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "./dotBookOne";

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://dotheory.org";

/**
 * A citation for a book that ships new versions.
 *
 * The reader is regenerated from the manuscript on every release, so a
 * reference that names only the title points at prose that can move under the
 * person who quoted it. Every citation this module produces carries the
 * edition and version it was taken from, and a URL that resolves to the same
 * passage in that edition.
 */

/** "Henok Ghebrechristos" -> { family: "Ghebrechristos", given: ["Henok"] } */
function parseName(author: string): { family: string; given: string[] } {
  const parts = author.trim().split(/\s+/);
  const family = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  return { family, given: parts.slice(0, -1) };
}

function initials(given: string[]): string {
  return given.map((name) => `${name.charAt(0).toUpperCase()}.`).join(" ");
}

function releaseYear(manifest: DotBookOneManifest): string {
  const date = manifest.release.published_at ?? manifest.release.updated_at;
  return date.slice(0, 4);
}

function editionLabel(manifest: DotBookOneManifest): string {
  return `${manifest.release.label}, version ${manifest.release.version}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function citationUrl(section: BookReleaseSection | null): string {
  return section
    ? `${SITE_URL}${DOT_BOOK_ONE_ROUTE}/${section.slug}`
    : `${SITE_URL}${DOT_BOOK_ONE_ROUTE}`;
}

/** An author–date reference, for pasting into prose or a bibliography. */
export function formatReference(
  manifest: DotBookOneManifest,
  section: BookReleaseSection | null,
): string {
  const { family, given } = parseName(manifest.project.author);
  const author = given.length > 0 ? `${family}, ${initials(given)}` : family;
  const work = section
    ? `${section.title}. In ${manifest.project.title}`
    : manifest.project.title;

  return [
    `${author} (${releaseYear(manifest)}).`,
    `${work} (${editionLabel(manifest)}).`,
    `${manifest.project.series_title}.`,
    citationUrl(section),
  ].join(" ");
}

export function formatBibTeX(
  manifest: DotBookOneManifest,
  section: BookReleaseSection | null,
  accessed: Date = new Date(),
): string {
  const { family, given } = parseName(manifest.project.author);
  const year = releaseYear(manifest);
  const key = `${family.toLowerCase()}${year}${section ? section.slug.replaceAll("-", "") : "dot"}`;
  const fields: Array<[string, string]> = [
    ["author", given.length > 0 ? `${family}, ${given.join(" ")}` : family],
    ["title", section ? section.title : manifest.project.title],
  ];
  if (section) fields.push(["booktitle", manifest.project.title]);
  fields.push(
    ["series", manifest.project.series_title],
    ["edition", editionLabel(manifest)],
    ["year", year],
    ["url", citationUrl(section)],
    ["urldate", isoDate(accessed)],
  );

  const width = Math.max(...fields.map(([name]) => name.length));
  const body = fields
    .map(([name, value]) => `  ${name.padEnd(width)} = {${value}},`)
    .join("\n");

  return `@${section ? "inbook" : "book"}{${key},\n${body}\n}`;
}
