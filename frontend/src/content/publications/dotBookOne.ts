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

export const DOT_BOOK_ONE_ROUTE = "/book/digital-organism-theory";

const DOT_BOOK_ONE_ASSET_ROOT =
  "publications/henok/digital-organism-theory/v2";

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
