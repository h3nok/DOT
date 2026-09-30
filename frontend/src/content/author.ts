import authorData from "./author.json";

/**
 * Who writes here — one record, read by the About page, the site colophon, and
 * (as JSON) the build script that states the author to search engines.
 *
 * Optional fields render only when filled, so the site never shows a
 * placeholder:
 * - `email`: a public contact address. Until it is set, contact goes through
 *   LinkedIn.
 * - `credentials`: one entry per degree, with its dissertation or thesis where
 *   there is one. The build also states them to search engines.
 * - `photo`: a path under `public/`, such as "/henok.jpg".
 */
export interface Credential {
  /** "PhD, Computer Science" */
  degree: string;
  institution: string;
  year: number;
  /** Linked where it is published, so a reader can check the work itself. */
  dissertation?: { title: string; url: string };
}

export interface Author {
  /** The name alone, as the book and citations print it. */
  name: string;
  /** Post-nominal letters shown after the name, such as "PhD". */
  suffix?: string;
  role: string;
  summary: string;
  email: string;
  credentials: Credential[];
  photo: string;
  links: { linkedin: string; github: string };
}

export const author: Author = authorData as Author;

/** "Henok Ghebrechristos, PhD" — for bylines; titles and citations use the name alone. */
export const authorByline = author.suffix ? `${author.name}, ${author.suffix}` : author.name;

export interface AuthorContact {
  href: string;
  label: string;
}

/** Where a reader can reach the author: the address when there is one. */
export function authorContact(source: Author = author): AuthorContact {
  const email = source.email.trim();
  if (email) return { href: `mailto:${email}`, label: email };
  return { href: source.links.linkedin, label: "LinkedIn" };
}
