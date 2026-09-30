/**
 * Essays — the author's writing beyond Book One (ADR-0033).
 *
 * An essay is one Markdown file in `src/content/essays/`, named for its URL:
 * `why-fear-narrows.md` is published at `/essays/why-fear-narrows`. Its front
 * matter states what ADR-0030 asks of any released writing — the claim levels
 * it uses, its date, and the concepts it builds on — and the build refuses a
 * file that does not, rather than publishing something the reader cannot place.
 *
 * Files whose names start with `_` (the template) are never published, and
 * neither is an essay marked `draft: true`. The repository is public, though:
 * a committed draft is readable on GitHub even while the site withholds it.
 *
 * Plain ESM on purpose. The Vite plugin, the route materializer, and the tests
 * all read essays through this one module, so a file cannot be valid in one
 * place and broken in another.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Relative to the frontend package, like every path the build scripts use:
// under Vitest's DOM environment `import.meta.url` is not a file URL.
export const ESSAYS_DIR = path.resolve("src", "content", "essays");
export const ESSAYS_ROUTE = "/essays";
export const ESSAY_INDEX_SCHEMA = "dot.essays.v1";
export const CLAIM_LEVELS = ["observation", "model", "hypothesis", "speculation"];

// Book One's rate (scripts/import_dot_book.py), so a chapter and an essay of
// the same length promise the same time.
const WORDS_PER_MINUTE = 220;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// `/essays/index.json` is the published index; an essay named `index` would
// be served in its place.
const RESERVED_SLUGS = new Set(["index"]);
const FIELDS = ["title", "summary", "published", "updated", "levels", "concepts", "draft"];
const TITLE_LIMIT = 140;
const SUMMARY_LIMIT = 280;

export class EssayError extends Error {}

function fail(file, message) {
  throw new EssayError(`${file}: ${message}`);
}

function unquote(value) {
  const quote = value[0];
  if (value.length >= 2 && (quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1);
  }
  return value;
}

function parseValue(raw) {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    return inner ? inner.split(",").map((item) => unquote(item.trim())) : [];
  }
  return unquote(value);
}

/**
 * Split a file into its front matter and body.
 *
 * The front matter is a deliberately small subset of YAML: one `key: value`
 * per line, `[a, b]` lists, `true`/`false`, and optional quotes. Lines that
 * start with `#` are comments. An unknown or repeated key fails loudly, because
 * a misspelt `sumary:` would otherwise publish an essay with no summary.
 */
export function parseFrontMatter(source, file = "essay") {
  const lines = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    fail(file, "must start with front matter between two lines of ---.");
  }
  const close = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (close === -1) fail(file, "front matter is never closed with a line of ---.");

  const data = {};
  for (const line of lines.slice(1, close)) {
    const text = line.trim();
    if (!text || text.startsWith("#")) continue;
    const match = /^([a-z_]+):(.*)$/.exec(text);
    if (!match) fail(file, `cannot read front matter line "${text}". Write it as key: value.`);
    const [, key, raw] = match;
    if (!FIELDS.includes(key)) {
      fail(file, `unknown front matter field "${key}". Known fields: ${FIELDS.join(", ")}.`);
    }
    if (key in data) fail(file, `front matter field "${key}" appears twice.`);
    if (!raw.trim()) fail(file, `front matter field "${key}" has no value.`);
    data[key] = parseValue(raw);
  }

  return { data, body: lines.slice(close + 1).join("\n").trim() };
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function requireText(file, data, key, limit) {
  const value = data[key];
  if (typeof value !== "string" || !value.trim()) fail(file, `needs a ${key}.`);
  if (value.length > limit) {
    fail(file, `${key} is ${value.length} characters; keep it under ${limit}.`);
  }
  return value.trim();
}

function requireList(file, data, key, { required, allowed, pattern }) {
  const value = data[key];
  if (value === undefined && !required) return [];
  if (!Array.isArray(value) || (required && value.length === 0)) {
    fail(file, `${key} must be a list, such as [${allowed ? allowed.slice(0, 2).join(", ") : "a, b"}].`);
  }
  for (const item of value) {
    if (allowed && !allowed.includes(item)) {
      fail(file, `"${item}" is not a ${key.replace(/s$/, "")}. Use: ${allowed.join(", ")}.`);
    }
    if (pattern && !pattern.test(item)) fail(file, `"${item}" is not a valid ${key} id.`);
  }
  if (new Set(value).size !== value.length) fail(file, `${key} lists an entry twice.`);
  return value;
}

export function countWords(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/** Read and validate one essay. `file` is the path shown in error messages. */
export function parseEssay(source, slug, file = `${slug}.md`) {
  if (!SLUG_PATTERN.test(slug)) {
    fail(file, "file names must be lowercase words joined by hyphens, like why-fear-narrows.md.");
  }
  if (RESERVED_SLUGS.has(slug)) fail(file, `"${slug}" is reserved; choose another file name.`);

  const { data, body } = parseFrontMatter(source, file);
  const title = requireText(file, data, "title", TITLE_LIMIT);
  const summary = requireText(file, data, "summary", SUMMARY_LIMIT);

  if (!isCalendarDate(data.published)) {
    fail(file, "published must be a date written as YYYY-MM-DD.");
  }
  if (data.updated !== undefined) {
    if (!isCalendarDate(data.updated)) fail(file, "updated must be a date written as YYYY-MM-DD.");
    if (data.updated < data.published) fail(file, "updated cannot be earlier than published.");
  }
  // ADR-0030: released writing declares its claim-level coverage.
  const levels = requireList(file, data, "levels", { required: true, allowed: CLAIM_LEVELS });
  const concepts = requireList(file, data, "concepts", { required: false, pattern: SLUG_PATTERN });
  if (data.draft !== undefined && typeof data.draft !== "boolean") {
    fail(file, "draft must be true or false.");
  }

  if (!body) fail(file, "has no text after its front matter.");
  if (/^#\s/.test(body)) {
    fail(file, "starts with a # heading. The page already shows the title; begin with the text, or with ## for a section.");
  }

  const words = countWords(body);
  return {
    slug,
    title,
    summary,
    published: data.published,
    updated: data.updated ?? null,
    levels,
    concepts,
    draft: data.draft === true,
    words,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    body,
  };
}

const newestFirst = (a, b) =>
  b.published.localeCompare(a.published) || a.title.localeCompare(b.title);

/** Every publishable essay, newest first. Drafts and `_` files are left out. */
export function readEssays({ dir = ESSAYS_DIR, includeDrafts = false } = {}) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .map((name) =>
      parseEssay(
        readFileSync(path.join(dir, name), "utf8"),
        name.slice(0, -3),
        path.relative(process.cwd(), path.join(dir, name)),
      ),
    )
    .filter((essay) => includeDrafts || !essay.draft)
    .sort(newestFirst);
}

/** What `/essays/index.json` publishes: everything but the text itself. */
export function essayIndex(essays) {
  return {
    schema: ESSAY_INDEX_SCHEMA,
    essays: essays.map(({ body: _body, draft: _draft, ...summary }) => summary),
  };
}

/**
 * Serves essays in development and publishes them in a build.
 *
 * The published files are `/essays/index.json` and `/essays/<slug>.md`, the
 * same shape Book One uses (a manifest beside its sections). Nothing is written
 * into `public/`, so a draft can never be copied into the site by accident.
 */
export function essaysPlugin({ dir = ESSAYS_DIR } = {}) {
  let published = [];
  return {
    name: "dot-essays",
    config() {
      published = readEssays({ dir });
      return {
        // Lets the site show or hide its Essays link without asking the
        // network whether any writing exists.
        define: { __DOT_ESSAYS_PUBLISHED__: JSON.stringify(published.length > 0) },
      };
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = (request.url ?? "").split("?")[0];
        const isIndex = pathname === `${ESSAYS_ROUTE}/index.json`;
        const essayFile = /^\/essays\/([^/]+)\.md$/.exec(pathname);
        if (!isIndex && !essayFile) {
          next();
          return;
        }
        try {
          // Re-read on every request so an edit shows on reload.
          const essays = readEssays({ dir });
          if (isIndex) {
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(essayIndex(essays)));
            return;
          }
          const essay = essays.find((candidate) => candidate.slug === essayFile[1]);
          response.statusCode = essay ? 200 : 404;
          response.setHeader("Content-Type", "text/markdown; charset=utf-8");
          response.end(essay ? essay.body : "Not found");
        } catch (error) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.end(error instanceof Error ? error.message : String(error));
        }
      });
    },
    generateBundle() {
      for (const essay of published) {
        this.emitFile({ type: "asset", fileName: `essays/${essay.slug}.md`, source: essay.body });
      }
      this.emitFile({
        type: "asset",
        fileName: "essays/index.json",
        source: `${JSON.stringify(essayIndex(published), null, 2)}\n`,
      });
    },
  };
}
