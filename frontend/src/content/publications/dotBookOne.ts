import type {
  ReaderConceptDefinition,
  ReaderReference,
} from "../../attention-os/reader/readerTypes";

export type BookSectionKind = "preface" | "chapter" | "references";

export interface BookReleaseSection {
  id: string;
  order: number;
  slug: string;
  kind: BookSectionKind;
  number: number | null;
  title: string;
  subtitle: string | null;
  part: string;
  content_path: string;
  word_count: number;
  reading_time_minutes: number;
  related_concepts: string[];
}

export interface DotBookOneManifest {
  schema_version: "publication.release.v2";
  generated_at: string;
  source: {
    format: "docx";
    name?: string;
    sha256: string;
  };
  project: {
    id: string;
    owner_id: string;
    type: "book";
    series_title: string;
    title: string;
    subtitle: string;
    author: string;
    slug: string;
    visibility: "public";
  };
  release: {
    id: string;
    version: number;
    status: string;
    label: string;
    published_at: string | null;
    updated_at: string;
  };
  extent: {
    chapters: number;
    words: number;
    equations: number;
    references: number;
  };
  reader_contract: {
    finite: true;
    autoplay: false;
    claim_levels: string[];
  };
  sections: BookReleaseSection[];
}

export type BookReference = ReaderReference;
export type BookConceptDefinition = ReaderConceptDefinition;

export const DOT_BOOK_ONE_ROUTE = "/book/digital-organism-theory";

/**
 * Book One is also a release in the generic publication reader
 * (`/read/:ownerId/:slug`). It has one public home — this route — and the
 * generic reader redirects here, so a shared link, a search result, and a
 * citation all name the same URL.
 */
export const DOT_BOOK_ONE_OWNER = "henok";
export const DOT_BOOK_ONE_SLUG = "digital-organism-theory";

const DOT_BOOK_ONE_ASSET_ROOT =
  `publications/${DOT_BOOK_ONE_OWNER}/${DOT_BOOK_ONE_SLUG}/v3`;

const publicAssetUrl = (path: string) => {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${DOT_BOOK_ONE_ASSET_ROOT}/${path}`.replace(/\/{2,}/g, "/");
};

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Book release request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchDotBookOneManifest(
  signal?: AbortSignal,
): Promise<DotBookOneManifest> {
  const response = await fetch(publicAssetUrl("manifest.json"), {
    cache: "no-store",
    signal,
  });
  return readResponse<DotBookOneManifest>(response);
}

export async function fetchDotBookOneSection(
  section: BookReleaseSection,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(publicAssetUrl(section.content_path), {
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Book section request failed: ${response.status}`);
  }
  return response.text();
}

/** Split the released notes section without weakening its original citation text. */
export function parseBookReferences(markdown: string): Map<number, BookReference> {
  const headings = Array.from(markdown.matchAll(/^### Reference (\d+)\s*$/gm));
  const references = new Map<number, BookReference>();

  headings.forEach((heading, index) => {
    if (heading.index === undefined) return;
    const number = Number(heading[1]);
    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? markdown.length;
    references.set(number, {
      number,
      markdown: markdown.slice(start, end).trim(),
    });
  });

  return references;
}

export function bookSectionRoute(section: BookReleaseSection): string {
  return `${DOT_BOOK_ONE_ROUTE}/${section.slug}`;
}

export function groupBookSectionsByPart(
  sections: BookReleaseSection[],
): Array<{ part: string; sections: BookReleaseSection[] }> {
  const groups = new Map<string, BookReleaseSection[]>();
  for (const section of sections) {
    const entries = groups.get(section.part) ?? [];
    entries.push(section);
    groups.set(section.part, entries);
  }
  return Array.from(groups, ([part, groupedSections]) => ({
    part,
    sections: groupedSections,
  }));
}
