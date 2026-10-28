import { readFileSync } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { remarkDepthPassages } from "../src/attention-os/reader/remarkDepthPassages.js";
import { headingSlug } from "../src/attention-os/reader/headingSlug.js";
import { parseEvidenceChart } from "../src/attention-os/reader/evidenceChart.js";
import { ESSAYS_ROUTE, readEssays } from "./essays.mjs";
import { resolveAmmCopy } from "../src/content/editable/ammCopy.js";
import { resolveSupportMethods } from "../src/content/supportMethods.js";
import { READING_PATHS } from "../src/attention-os/reader/readingPaths.ts";

const SITE_URL = "https://dotheory.org";

/**
 * A page's public address. Every route is written as <route>/index.html, and
 * GitHub Pages answers the address without the trailing slash with a 301, so
 * canonical, sitemap, feed and structured-data URLs carry the slash.
 */
export const pageUrl = (route) => `${SITE_URL}${route === "/" ? "/" : `${route.replace(/\/$/, "")}/`}`;
const BOOK_ROUTE = "/book/digital-organism-theory";
const ACADEMY_ROUTE = "/academy";
const ABOUT_ROUTE = "/about";
const CONTACT_ROUTE = "/contact";
const COMMUNITY_ROUTE = "/community";
const INBOX_ROUTE = "/studio/inbox";
const READERS_ROUTE = "/readers";
const PRIVACY_ROUTE = "/privacy";
const TERMS_ROUTE = "/terms";
const PUBLICATIONS_ROUTE = "/publications";
const BLOG_ROUTE = "/blog";
const FILMS_ROUTE = "/academy/films";
const LEGACY_FILMS_ROUTE = "/films";
const VIDEOS_ROUTE = "/videos";
const WRITING_ROUTE = "/writing";

// Paths are relative to the frontend package, where the build runs.
const CONTENT_DIR = path.join("src", "content");
// The record the About page and siteConfig read too (src/content/author.ts).
const AUTHOR = JSON.parse(readFileSync(path.join(CONTENT_DIR, "author.json"), "utf8"));
const HOME = JSON.parse(readFileSync(path.join(CONTENT_DIR, "home.json"), "utf8"));
const BOOK_LANDING = JSON.parse(readFileSync(path.join(CONTENT_DIR, "publications", "bookLanding.json"), "utf8"));
const READERS = JSON.parse(readFileSync(path.join(CONTENT_DIR, "readers.json"), "utf8"));
const CONTACT = JSON.parse(readFileSync(path.join(CONTENT_DIR, "contact.json"), "utf8"));
const SUPPORT_METHODS = resolveSupportMethods(JSON.parse(readFileSync(path.join(CONTENT_DIR, "support.json"), "utf8")));
const BUILDER = JSON.parse(readFileSync(path.join(CONTENT_DIR, "builder.json"), "utf8"));
const CAREER = JSON.parse(readFileSync(path.join(CONTENT_DIR, "career.json"), "utf8"));
const PROJECTS = JSON.parse(readFileSync(path.join(CONTENT_DIR, "projects.json"), "utf8"));
const BUILDER_PROJECTS = BUILDER.projectOrder.map((slug) => {
  const project = PROJECTS.find((item) => item.slug === slug);
  if (!project) throw new Error(`Unknown portfolio project: ${slug}`);
  return project;
});
const OTHER_BUILDER_PROJECTS = BUILDER.otherProjects.map((slug) => {
  const project = PROJECTS.find((item) => item.slug === slug);
  if (!project) throw new Error(`Unknown portfolio project: ${slug}`);
  return project;
});
const NEWSLETTER = JSON.parse(readFileSync(path.join(CONTENT_DIR, "newsletter.json"), "utf8"));
const BLOG = JSON.parse(readFileSync(path.join(CONTENT_DIR, "blog.json"), "utf8"));
const FILMS = JSON.parse(readFileSync(path.join(CONTENT_DIR, "films.json"), "utf8"));
const ACADEMY = JSON.parse(readFileSync(path.join(CONTENT_DIR, "academy", "landing.json"), "utf8"));
const AMM = JSON.parse(readFileSync(path.join(CONTENT_DIR, "amm.json"), "utf8"));
const AMM_MEDIA = JSON.parse(readFileSync(path.join(CONTENT_DIR, "amm-media.json"), "utf8"));
const AMM_CAPITAL = JSON.parse(readFileSync(path.join(CONTENT_DIR, "amm-capital.json"), "utf8"));
const CAPITAL_ROUTE = "/amm/power";
const AMM_LIBRARY = JSON.parse(readFileSync(path.join(CONTENT_DIR, "amm-library.json"), "utf8"));
const ESSAY_MOVES = JSON.parse(readFileSync(path.join(CONTENT_DIR, "essays", "moves.json"), "utf8"));
// Search engines resolve an author entity through profiles they already know,
// so every work's structured data names them.
const AUTHOR_PROFILE = AUTHOR.links.linkedin;
// One person, stated on the About page and referred to from every work.
const PERSON_ID = `${SITE_URL}${ABOUT_ROUTE}#person`;
const RELEASE_MANIFEST = path.join(
  "public",
  "publications",
  "henok",
  "digital-organism-theory",
  "v4",
  "manifest.json",
);

const BOOK_DESCRIPTION = BOOK_LANDING.description;

const STATIC_ROUTES = [
  {
    route: ACADEMY_ROUTE,
    title: ACADEMY.title,
    description: ACADEMY.description,
  },
  {
    route: "/applied",
    title: "Open Questions — Digital Organism Theory",
    description: "The evidence boundaries, unfinished derivations, and open seams in DOT Book One.",
  },
  {
    route: "/doctrine",
    title: "Book One Concept Map — Digital Organism Theory",
    description: "Trace DOT's central concepts back to the passages and claim levels that define them.",
  },
  {
    route: "/join",
    title: "Join the Work — Digital Organism Theory",
    description: "Ask to take part in the careful reading, practice, and development of Digital Organism Theory.",
  },
  {
    route: "/support",
    title: "Support the Work — Digital Organism Theory",
    description: "Pay the author directly, if you wish: one-time, an amount you choose, and not a charitable donation. Reading and the PDF stay free.",
  },
  {
    route: BOOK_ROUTE,
    title: "Consciousness: A Digital Organism — Book One",
    description: BOOK_DESCRIPTION,
    image: "/og/book-one.png",
    imageAlt: "Consciousness: A Digital Organism — Book One of Digital Organism Theory",
  },
  {
    route: `${BOOK_ROUTE}/copy`,
    title: "Digital Edition — Consciousness: A Digital Organism",
    description: "Download the complete free PDF of Digital Organism Theory Book One. No account or payment required; author support is optional.",
  },
];

/**
 * The concept map's public identities.
 *
 * Duplicated from `src/content/doctrine/doctrineData.ts` because this script
 * runs on plain Node without the concept module's Vite-resolved imports;
 * the test keeps the two in step. The names have to be here: without them all
 * seventeen concept URLs share one title and one description, so a shared
 * concept link and a search result cannot say which concept they lead to.
 */
export const DOCTRINE_CONCEPTS = [
  {
    id: "subjective-data",
    name: "The Subjective Data Principle",
    oneLine:
      "Feeling must be treated as data, but feeling is not automatically truth.",
  },
  {
    id: "digital-organism",
    name: "Digital Organism",
    oneLine:
      "A state-bearing, information-sensitive process that works to preserve or develop its coherence across change.",
  },
  {
    id: "big-c",
    name: "The Big C Hypothesis",
    oneLine:
      "Consciousness is fundamental: the persistent process from which Reality Frames and local experience arise.",
  },
  {
    id: "little-c",
    name: "Little c",
    oneLine:
      "The hypothesized local experiencer that receives experience, forms Intent, participates through a body, and changes through consequence.",
  },
  {
    id: "decoupling-principle",
    name: "The Decoupling Principle",
    oneLine:
      "Awareness and its bodily rendering may be tightly coupled without being identical.",
  },
  {
    id: "reality-frame",
    name: "Reality Frame",
    oneLine:
      "A rule-bound experiential environment in which action meets consequence.",
  },
  {
    id: "world-invariants",
    name: "Physical Sciences as Frame Derivations",
    oneLine:
      "Physical sciences formalize RF₀'s generated regularities; DOT must derive those regularities from the Frame architecture.",
  },
  {
    id: "reality-stream",
    name: "Reality Stream",
    oneLine:
      "The situated sequence of experience delivered to a particular participant within a Reality Frame.",
  },
  {
    id: "intent",
    name: "Intent",
    oneLine:
      "The threshold at which a pre-Intent possibility becomes committed direction for action.",
  },
  {
    id: "experience-loop",
    name: "The Experience Loop",
    oneLine:
      "Reality Stream is interpreted through the Painting; Intent becomes action; consequence updates the Canvas.",
  },
  {
    id: "canvas",
    name: "Canvas",
    oneLine:
      "The persistent capacity to carry forward and update through the consequences of experience.",
  },
  {
    id: "painting",
    name: "Painting",
    oneLine:
      "The organized content carried by the Canvas through which a present moment is interpreted.",
  },
  {
    id: "character",
    name: "Character",
    oneLine:
      "The action policy made visible through repeated interpretation, commitment, and behavior.",
  },
  {
    id: "fear-gating",
    name: "The Fear-Gating Principle",
    oneLine:
      "When Fear governs, the set of responses that feels available becomes narrower.",
  },
  {
    id: "love",
    name: "Love as an Epistemic Condition",
    oneLine: "Love is the condition in which Fear no longer governs you.",
  },
  {
    id: "conscious-authorship",
    name: "Conscious Authorship",
    oneLine:
      "See the Painting, widen the pause before Intent, and choose what the next consequence will reinforce.",
  },
  {
    id: "limits-and-debts",
    name: "Limits and Unpaid Debts",
    oneLine:
      "The book separates what is observed, modeled, hypothesized, and still speculative so the framework can be criticized without becoming self-sealing.",
  },
];

const routePattern = /^\/[a-z0-9]+(?:\/[a-z0-9_-]+)*$/;

const BOOK_ID = `${SITE_URL}${BOOK_ROUTE}#book`;
const CONCEPT_SET_ID = `${SITE_URL}/doctrine#concepts`;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** JSON-LD sits inside a script element, so `<` must never close it early. */
function serializeStructuredData(data) {
  return JSON.stringify(data, null, 2).replaceAll("<", "\\u003c");
}

const sectionUrl = (section) => pageUrl(`${BOOK_ROUTE}/${section.slug}`);
const conceptUrl = (concept) => pageUrl(`/doctrine/${concept.id}`);
// Structured-data identifiers are names, not fetched: they keep their original form.
const sectionId = (section) => `${SITE_URL}${BOOK_ROUTE}/${section.slug}#chapter`;
const conceptId = (concept) => `${SITE_URL}/doctrine/${concept.id}#concept`;

/** The author: one entity with one @id, however many works name it. */
function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: AUTHOR.name,
    honorificSuffix: AUTHOR.suffix || undefined,
    url: pageUrl(ABOUT_ROUTE),
    jobTitle: AUTHOR.role,
    description: AUTHOR.summary,
    image: AUTHOR.photo ? `${SITE_URL}${AUTHOR.photo}` : undefined,
    sameAs: Object.values(AUTHOR.links).filter((href) => /^https:\/\//.test(href ?? "")),
    alumniOf: AUTHOR.credentials.length > 0
      ? [...new Set(AUTHOR.credentials.map((credential) => credential.institution))].map(
          (name) => ({ "@type": "CollegeOrUniversity", name }),
        )
      : undefined,
  };
}

const AUTHOR_BYLINE = AUTHOR.suffix ? `${AUTHOR.name}, ${AUTHOR.suffix}` : AUTHOR.name;

/** Supplied thesis titles; a public URL is included only when known. */
function dissertationNodes() {
  return AUTHOR.credentials
    .filter((credential) => credential.dissertation)
    .map((credential) => ({
      "@type": "Thesis",
      name: credential.dissertation.title,
      url: credential.dissertation.url,
      author: { "@id": PERSON_ID },
      datePublished: String(credential.year),
      inSupportOf: credential.degree,
      sourceOrganization: { "@type": "CollegeOrUniversity", name: credential.institution },
    }));
}

function breadcrumb(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: pageUrl(entry.route),
    })),
  };
}

/** The edition itself: one work, one author, its chapters, and its ownership offer. */
function bookNode(manifest) {
  const { project, release } = manifest;
  const edition = `${release.label}, version ${release.version}`;
  return {
    "@type": "Book",
    "@id": BOOK_ID,
    name: project.title,
    alternativeHeadline: project.subtitle,
    description: BOOK_DESCRIPTION,
    url: pageUrl(BOOK_ROUTE),
    author: personNode(),
    inLanguage: "en",
    isPartOf: { "@type": "BookSeries", name: project.series_title },
    bookEdition: edition,
    datePublished: release.published_at ?? undefined,
    dateModified: release.updated_at,
    isAccessibleForFree: true,
    hasPart: manifest.sections.map((section) => ({
      "@type": "Chapter",
      "@id": sectionId(section),
      name: section.title,
      url: sectionUrl(section),
      position: section.order + 1,
    })),
    workExample: [
      {
        "@type": "Book",
        "@id": `${SITE_URL}${BOOK_ROUTE}/copy#edition`,
        name: project.title,
        author: personNode(),
        bookEdition: edition,
        bookFormat: "https://schema.org/EBook",
        encodingFormat: "application/pdf",
        url: pageUrl(`${BOOK_ROUTE}/copy`),
        inLanguage: "en",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: pageUrl(`${BOOK_ROUTE}/copy`),
        },
      },
    ],
  };
}

function chapterNode(manifest, section) {
  const concepts = section.related_concepts
    .map((id) => DOCTRINE_CONCEPTS.find((concept) => concept.id === id))
    .filter(Boolean)
    .map((concept) => ({
      "@type": "DefinedTerm",
      "@id": conceptId(concept),
      name: concept.name,
      url: conceptUrl(concept),
    }));

  return {
    "@type": "Chapter",
    "@id": sectionId(section),
    name: section.title,
    alternativeHeadline: section.subtitle ?? undefined,
    url: sectionUrl(section),
    position: section.order + 1,
    isPartOf: {
      "@id": BOOK_ID,
      "@type": "Book",
      name: manifest.project.title,
      url: pageUrl(BOOK_ROUTE),
    },
    author: personNode(),
    inLanguage: "en",
    wordCount: section.word_count,
    timeRequired: `PT${section.reading_time_minutes}M`,
    datePublished: manifest.release.published_at ?? undefined,
    isAccessibleForFree: true,
    about: concepts.length > 0 ? concepts : undefined,
  };
}

function conceptNode(concept) {
  return {
    "@type": "DefinedTerm",
    "@id": conceptId(concept),
    name: concept.name,
    description: concept.oneLine,
    url: conceptUrl(concept),
    inDefinedTermSet: { "@id": CONCEPT_SET_ID },
    subjectOf: { "@id": BOOK_ID },
  };
}

function conceptSetNode() {
  return {
    "@type": "DefinedTermSet",
    "@id": CONCEPT_SET_ID,
    name: "Digital Organism Theory concept map",
    description:
      "The concepts of DOT Book One, each resolving to the passage that defines it.",
    url: pageUrl("/doctrine"),
    hasDefinedTerm: DOCTRINE_CONCEPTS.map((concept) => ({
      "@type": "DefinedTerm",
      "@id": conceptId(concept),
      name: concept.name,
      url: conceptUrl(concept),
    })),
  };
}

const graph = (...nodes) => ({ "@context": "https://schema.org", "@graph": nodes });

/** What the site is, for a crawler that only ever sees the root document. */
function siteStructuredData(manifest) {
  return graph(
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: `${AUTHOR.name} — Builder, writing & inquiry`,
      alternateName: "DOT",
      url: SITE_URL,
      inLanguage: "en",
      author: personNode(),
      about: [{ "@type": "Thing", name: "AI and product architecture" }, { "@type": "Thing", name: "Digital Organism Theory" }],
      hasPart: [
        { "@id": BOOK_ID, "@type": "Book" },
      ],
    },
    bookNode(manifest),
  );
}

function webPageNode(route) {
  return {
    "@type": "WebPage",
    "@id": `${SITE_URL}${route.route}#page`,
    name: route.title,
    description: route.description,
    url: pageUrl(route.route),
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}#website` },
  };
}

/** The author's own page: the URL a search engine should treat as the person. */
function profilePageNode(route) {
  return {
    "@type": "ProfilePage",
    "@id": `${SITE_URL}${ABOUT_ROUTE}#page`,
    name: route.title,
    url: pageUrl(ABOUT_ROUTE),
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}#website` },
    mainEntity: personNode(),
  };
}

const ESSAYS_DESCRIPTION = `Essays by ${AUTHOR.name} that develop Digital Organism Theory beyond Book One, each stating the claim levels it uses.`;
const FEED_URL = `${SITE_URL}/feed.xml`;
const FEED_TITLE = `Writing by ${AUTHOR.name}`;

const essayUrl = (essay) => essay.url ?? pageUrl(`${ESSAYS_ROUTE}/${essay.slug}`);
const writingPath = (item, release) => `${WRITING_ROUTE}/${item.id}${release ? `/releases/${release}` : ""}`;
const managedWriting = (item) => AMM_LIBRARY.some(source => source.slug === item.slug);
const writingPublicPath = (item) => managedWriting(item) ? `${ESSAYS_ROUTE}/${item.slug}` : writingPath(item);
export function visibleFileEssays(essays, writing) {
  return essays.filter(essay => !writing.some(item => managedWriting(item) && item.slug === essay.slug));
}

/**
 * Every released version of native writing, read from the public delivery API at
 * build time so a shared link carries its own title, summary and whole text.
 * Only an HTTPS orchestrator is read: local builds stay independent of a server.
 */
export async function fetchNativeWriting(apiUrl, { fetchImpl = fetch, space = "dot-academy" } = {}) {
  if (!/^https:\/\//.test(apiUrl ?? "")) return [];
  const base = `${apiUrl.replace(/\/$/, "")}/v1/academy`;
  const get = async (requestPath, asText = false) => {
    const response = await fetchImpl(`${base}${requestPath}`);
    if (!response.ok) throw new Error(`Released writing could not be read (${response.status}): ${requestPath}`);
    return asText ? response.text() : response.json();
  };
  const catalog = await get(`/delivery/catalog?space=${encodeURIComponent(space)}&include_withdrawn=true`);
  const latest = catalog.filter((entry) => entry.kind === "essay");
  return Promise.all(
    latest.map(async (entry) => {
      if (entry.withdrawn_at) return { id: entry.work_id, slug: entry.work_slug, title: entry.title, published: entry.released_at.slice(0, 10), withdrawn: true, releases: [], releaseNumber: entry.release_number };
      const releases = [];
      for (let number = 1; number <= entry.release_number; number += 1) {
        const delivery = await get(`/delivery/works/${encodeURIComponent(entry.work_id)}/releases/${number}`);
        if (delivery.withdrawn) continue;
        if (!delivery.manifest || !delivery.body_ref) throw new Error(`Release ${number} of ${entry.work_id} is incomplete.`);
        const body = await get(`/delivery/body/${delivery.body_ref.split("/").map(encodeURIComponent).join("/")}`, true);
        const images = Object.fromEntries((delivery.manifest.assets ?? []).flatMap(asset =>
          [asset.path, `./${asset.path}`].map(name => [name, { src: new URL(asset.src, apiUrl).href, width: asset.width, height: asset.height }]),
        ));
        const banner = delivery.manifest.presentation?.cover;
        const cover = banner && images[banner.path] ? { ...images[banner.path], alt: banner.alt, caption: banner.caption } : undefined;
        releases.push({ number, manifest: delivery.manifest, body, images, cover });
      }
      return {
        id: entry.work_id,
        slug: entry.work_slug,
        title: entry.title,
        summary: entry.summary ?? "",
        published: entry.released_at.slice(0, 10),
        releases,
        cover: releases.at(-1)?.cover,
      };
    }),
  ).then((items) => items.filter((item) => item.withdrawn || item.releases.length > 0).reverse());
}

function conceptTerms(ids) {
  return ids
    .map((id) => DOCTRINE_CONCEPTS.find((concept) => concept.id === id))
    .filter(Boolean)
    .map((concept) => ({
      "@type": "DefinedTerm",
      "@id": conceptId(concept),
      name: concept.name,
      url: conceptUrl(concept),
    }));
}

function articleNode(essay) {
  const url = essayUrl(essay);
  const about = conceptTerms(essay.concepts);
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    headline: essay.title,
    description: essay.summary,
    image: essay.cover ? new URL(essay.cover.src, SITE_URL).href : undefined,
    url,
    mainEntityOfPage: url,
    author: personNode(),
    datePublished: essay.published,
    dateModified: essay.updated ?? essay.published,
    inLanguage: "en",
    wordCount: essay.words,
    timeRequired: `PT${essay.readingMinutes}M`,
    isAccessibleForFree: true,
    isPartOf: { "@id": `${SITE_URL}#website` },
    about: about.length > 0 ? about : undefined,
  };
}

/**
 * Markdown to HTML through the reader's own pipeline, for readers and crawlers
 * that never run the app. Math becomes MathML: no fonts, no script, and still
 * legible to a screen reader.
 */
function headingText(node) {
  return node.type === "text" ? node.value : (node.children ?? []).map(headingText).join("");
}

export function renderMarkdown(markdown, { images = {}, post = false, restrictImages = false } = {}) {
  return renderToStaticMarkup(
    createElement(ReactMarkdown, {
      skipHtml: true,
      remarkPlugins: [remarkGfm, remarkMath, remarkDepthPassages],
      rehypePlugins: [[rehypeKatex, { output: "mathml" }]],
      children: markdown,
      components: post ? {
        pre: ({ children, node }) => {
          const code = node?.children[0];
          if (code?.properties?.className?.includes("language-evidence-chart")) {
            const data = parseEvidenceChart(headingText(code));
            if (!data) return createElement("p", null, "This figure’s data needs correction before it can be displayed.");
            return createElement("figure", null,
              createElement("figcaption", null, `${data.title} · ${data.period} · ${data.unit}`),
              createElement("p", null, data.status),
              createElement("table", null,
                createElement("thead", null, createElement("tr", null, ...["Category", "Value", "Cited source"].map(label => createElement("th", { key: label, scope: "col" }, label)))),
                createElement("tbody", null, ...data.rows.map((row, index) => createElement("tr", { key: index }, createElement("th", { scope: "row" }, row.label), createElement("td", null, row.value), createElement("td", null, createElement("a", { href: row.url }, row.source)))))),
              createElement("p", null, data.limits));
          }
          return createElement("pre", null, children);
        },
        ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(level => [`h${level}`, ({ children, node }) => createElement(`h${level}`, { id: headingSlug(headingText(node)) }, children)])),
        img: ({ src, alt }) => restrictImages && !images[src] ? createElement("span", null, `Image not attached: ${alt || src}`) : createElement("img", { src, alt, ...images[src], loading: "lazy", decoding: "async" }),
        p: ({ children, node }) => {
          const child = node?.children.length === 1 ? node.children[0] : undefined;
          return child?.type === "element" && child.tagName === "img"
            ? createElement("figure", null, children, child.properties.title ? createElement("figcaption", null, String(child.properties.title)) : null)
            : createElement("p", null, children);
        },
      } : undefined,
    }),
  );
}

const POST_FORMATS = { essay: "Essay", "case-study": "Case study", letter: "Letter" };
function coverHtml(cover) {
  return cover ? `<figure><img src="${escapeHtml(cover.src)}" alt="${escapeHtml(cover.alt)}" width="${cover.width}" height="${cover.height}" />${cover.caption ? `<figcaption>${escapeHtml(cover.caption)}</figcaption>` : ""}</figure>` : "";
}

const link = (href, label, downloadFilename) =>
  `<a href="${escapeHtml(href)}"${downloadFilename ? ` download="${escapeHtml(downloadFilename)}"` : ""}>${escapeHtml(label)}</a>`;
const titleOf = (route) => route.title.split(" — ")[0];

function siteNav(essaysPublished) {
  const entries = [
    ["/", "Home"],
    [BOOK_ROUTE, "Book One"],
    [ACADEMY_ROUTE, "Academy"],
    [BLOG_ROUTE, "Writing"],
    [ABOUT_ROUTE, "About"],
    [CONTACT_ROUTE, "Contact"],
    [PUBLICATIONS_ROUTE, "Books"],
    ...(essaysPublished ? [["/feed.xml", "RSS"]] : []),
    [READERS_ROUTE, "Reader list"],
    [PRIVACY_ROUTE, "Privacy"],
    [TERMS_ROUTE, "Terms"],
  ];
  return `<nav aria-label="Site">${entries.map(([href, label]) => link(href, label)).join(" · ")}</nav>`;
}

/**
 * A page's own text, written into #root at build time (ADR-0033).
 *
 * The app replaces it when it starts, and an inline rule in index.html hides it
 * from the first paint in any browser running JavaScript. So it reaches exactly
 * the readers without JavaScript and the crawlers that read HTML without
 * running it, and nobody else ever sees it flash.
 */
function prerenderArticle(body, essaysPublished) {
  return `<article data-prerender>${body}${siteNav(essaysPublished)}</article>`;
}

function prerenderAmm(body, { footer = true } = {}) {
  const closing = footer ? `<footer><p>Manifesto and writing by ${link(ABOUT_ROUTE, AUTHOR.name)}.</p><p>${link(AMM.dot.route, AMM.dot.footer)} ${link(AMM.movement.href, AMM.movement.footer)}</p><nav aria-label="AMM footer">${link("/amm/editions", "Editions")} · ${link("/contact?purpose=writing", "Correspondence")} · ${link(AMM.feed, "AMM RSS")} · ${link(PRIVACY_ROUTE, "Privacy")} · ${link(TERMS_ROUTE, "Terms")} · ${link("/", "Digital Organism Theory")}</nav></footer>` : "";
  return `<article data-prerender><header><a href="/amm"><img src="/amm/mark.svg" width="48" height="48" alt="" /> ${escapeHtml(AMM.title)}</a> ${link(AMM.dot.route, "Digital Organism Theory")}</header>${body}${closing}</article>`;
}

const AMM_PARTS = AMM_LIBRARY.filter(item => typeof item.part === "number").sort((a, b) => a.part - b.part);
const ammPartLink = (part) => link(`${ESSAYS_ROUTE}/${part.slug}`, `${part.partLabel} · ${part.partTitle}`);

/** Where AMM comes from: three ideas in DOT's own words, each beside where it applies, and the way back to DOT. */
function ammDotHtml({ dot }) {
  return `<section id="amm-dot" aria-labelledby="amm-dot-title"><h2 id="amm-dot-title">${escapeHtml(dot.title)}</h2><p>${escapeHtml(dot.intro)}</p><p>${link(dot.route, dot.action)}</p><ol aria-label="From Digital Organism Theory to AMM and 4Us">${dot.links.map(item => `<li><h3>${link(`/doctrine/${item.id}`, item.title)}</h3><blockquote><p>${escapeHtml(item.quote)}</p></blockquote><p>${escapeHtml(item.applies)}</p></li>`).join("")}</ol></section>`;
}

/** The movement AMM sponsors. */
function ammSponsorHtml({ movement }) {
  return `<section id="amm-sponsor" aria-labelledby="amm-sponsor-title"><img src="${escapeHtml(movement.artwork)}" alt="${escapeHtml(movement.artworkAlt)}" width="1024" height="1536" loading="lazy" /><p>${escapeHtml(movement.sponsor)}</p><p>${escapeHtml(movement.name)}</p><h2 id="amm-sponsor-title">${escapeHtml(movement.title)}</h2><p>${escapeHtml(movement.description)}</p><p>${escapeHtml(movement.stage)}</p><p>${link(movement.href, movement.action)}</p></section>`;
}

/** The manifesto as a book (front page and archive): each chapter's full title, its own line, reading time and one way in. */
function ammPathHtml(content, id, essays = []) {
  return `<section id="${id}"><h2>${escapeHtml(content.chapterSection.title)}</h2><p>${escapeHtml(content.chapterSection.description)}</p><ol aria-label="The manifesto, in reading order">${AMM_PARTS.map((part, index) => {
    const line = content.chapterSection.chapters.find(chapter => chapter.id === part.slug)?.line;
    const minutes = essays.find(essay => essay.slug === part.slug)?.readingMinutes;
    return `<li><h3>${escapeHtml(part.partLabel)}: ${escapeHtml(part.partTitle)}</h3>${line ? `<p>${escapeHtml(line)}</p>` : ""}<p>${link(`${ESSAYS_ROUTE}/${part.slug}`, index === 0 ? content.introduction.label : part.partAction)}${minutes ? ` · ${minutes} min read` : ""}</p></li>`;
  }).join("")}</ol><p>${escapeHtml(content.artwork.caption)}</p></section>`;
}

/** The complete guided home remains readable without JavaScript. */
function ammHomeSceneHtml(group, id, home) {
  const scene = AMM_MEDIA.homeScenes[group][id];
  const art = AMM_MEDIA[scene];
  const alt = scene === "everyday" ? home.sceneAlt : art.alt;
  return `<img src="${escapeHtml(art.fallback)}" alt="${escapeHtml(alt)}" width="${art.width}" height="${art.height}" loading="lazy" />`;
}

function ammReadingBarHtml(content, slug) {
  const part = AMM_PARTS.find(item => item.slug === slug);
  return `<nav aria-label="Reading order"><p>${escapeHtml(part ? content.reading.orderLabel : content.reading.letterLabel)}${part ? ` · Part ${part.part} of ${AMM_PARTS.length} published` : ""}</p><ol>${AMM_PARTS.map(item => `<li>${item.slug === slug ? `<a href="${ESSAYS_ROUTE}/${item.slug}" aria-current="page">${escapeHtml(`${item.partLabel} · ${item.partTitle}`)}</a>` : ammPartLink(item)}</li>`).join("")}</ol></nav>`;
}

/** What follows the text: the next part in the author's order, then the two asks. */
function ammEditionEndHtml(content, slug) {
  const index = AMM_PARTS.findIndex(item => item.slug === slug);
  const next = index === -1 ? AMM_PARTS[0] : AMM_PARTS[index + 1];
  const previous = index > 0 ? AMM_PARTS[index - 1] : undefined;
  return [
    `<nav aria-label="Continue reading">${next ? `<p>${escapeHtml(index === -1 ? content.reading.beginLabel : content.reading.nextLabel)}: ${ammPartLink(next)}</p>` : `<p>${escapeHtml(content.reading.latestNote)}</p>`}${previous ? `<p>Previous: ${ammPartLink(previous)}</p>` : ""}</nav>`,
    `<section aria-label="Subscribe to AMM by email"><h2>${escapeHtml(content.signupTitle)}</h2><p>${escapeHtml(content.signupDescription)}</p><p>Email signup requires JavaScript. ${link(content.feed, "Follow AMM with RSS")} without an account.</p></section>`,
    `<section><h2>${escapeHtml(content.reading.supportTitle)}</h2><p>${escapeHtml(content.reading.supportDescription)}</p><p>${link("/support?purpose=author&from=amm", content.reading.supportAction)}</p><p>${escapeHtml(content.reading.supportNote)}</p></section>`,
  ].join("");
}

/** How power works: the framework the chapters assume, in six scenes (the first follows one payment up the power map), then four questions and the next step. */
function ammCapitalHtml(content) {
  const m = content.money, c = content.capital;
  const paragraph = text => `<p>${escapeHtml(text)}</p>`;
  const quote = (text, source) => `<blockquote><p>${escapeHtml(text)}</p>${source ? `<cite>${escapeHtml(source)}</cite>` : ""}</blockquote>`;
  const order = ["platforms", "housing", "borrowing", "knowledge", "public"];
  const examples = order.flatMap(id => m.examples.filter(item => item.id === id));
  const ids = ["power", "assault", "chain", "interfaces", "holders", "detachment"];
  const equity = AMM_CAPITAL.charts.find(chart => chart.title === "Ownership of corporate equity");
  const value = label => equity.rows.find(row => row.label === label).value;
  const figure = chart => `<figure><figcaption>${escapeHtml(chart.title)} · ${escapeHtml(chart.period)} · ${escapeHtml(chart.unit)}. ${escapeHtml(chart.status)}</figcaption><table><tbody>${chart.rows.map(row => `<tr><th scope="row">${escapeHtml(row.label)}</th><td>${row.value}</td><td>${link(row.url, row.source)}</td></tr>`).join("")}</tbody></table><p>${escapeHtml(chart.limits)}</p></figure>`;
  return [
    `<header><p>${escapeHtml(c.eyebrow)}</p><h1>${escapeHtml(c.title)}</h1>${paragraph(c.intro)}<figure><img src="${escapeHtml(AMM_MEDIA.erosion.fallback)}" alt="${escapeHtml(AMM_MEDIA.erosion.alt)}" width="${AMM_MEDIA.erosion.width}" height="${AMM_MEDIA.erosion.height}" /><figcaption>${escapeHtml(c.erosionCaption)}</figcaption></figure><dl aria-label="${escapeHtml(c.imageKeyLabel)}">${c.imageKey.map(item => `<dt>${link(item.href, item.label)}</dt><dd>${escapeHtml(item.meaning)}</dd>`).join("")}</dl><nav aria-label="${escapeHtml(c.contentsLabel)}"><ol>${c.glance.map((label, index) => `<li><a href="#${ids[index]}">${escapeHtml(label)}</a></li>`).join("")}</ol></nav></header>`,
    `<section id="power"><h2>${escapeHtml(c.mapTitle)}</h2>${paragraph(c.mapIntro)}<figure><figcaption>${escapeHtml(c.mapLabel)}</figcaption><ol>${c.tiers.map(tier => `<li><strong>${escapeHtml(tier.label)}</strong>${tier.detail ? `: ${escapeHtml(tier.detail)}` : ""}${tier.chips ? ` (${tier.chips.map(escapeHtml).join(", ")})` : ""}${c.flows.filter(flow => flow.after === tier.id).map(flow => `<p>${flow.items.map(item => `${item.direction === "up" ? "Up" : "Down"}: ${escapeHtml(item.label)}`).join(" · ")}</p>`).join("")}</li>`).join("")}</ol><p>${escapeHtml(c.rail.label)}: ${escapeHtml(c.rail.note)}.</p></figure><ol>${c.story.map(step => `<li><h3>${escapeHtml(step.title)}</h3>${paragraph(step.text)}${step.quote ? quote(step.quote, step.source) : ""}</li>`).join("")}</ol></section>`,
    `<section id="assault"><h2>${escapeHtml(c.assaultTitle)}</h2>${paragraph(c.assaultIntro)}<figure><img src="${escapeHtml(AMM_MEDIA.anatomy.fallback)}" alt="${escapeHtml(AMM_MEDIA.anatomy.alt)}" width="${AMM_MEDIA.anatomy.width}" height="${AMM_MEDIA.anatomy.height}" loading="lazy" /><figcaption>${escapeHtml(c.anatomyCaption)}</figcaption></figure><p><strong>${escapeHtml(c.assaultLine)}</strong></p><ol>${c.ledger.map(item => `<li><strong>${escapeHtml(item.term)}</strong> ${escapeHtml(item.becomes)}</li>`).join("")}</ol>${quote(c.assaultClose, c.assaultSource)}</section>`,
    `<section id="chain"><h2>${escapeHtml(c.chainTitle)}</h2>${quote(c.chainIntro, c.chainSource)}<ol aria-label="${escapeHtml(c.chainLabel)}">${m.cycle.map((item, index) => `<li><p>${escapeHtml(c.links[index])}</p><h3>${escapeHtml(item.title)}</h3>${paragraph(item.text)}</li>`).join("")}</ol>${paragraph(c.chainReturn)}<details><summary>${escapeHtml(c.termsLabel)}</summary><dl>${m.definitions.map(item => `<dt>${escapeHtml(item.term)}</dt><dd>${escapeHtml(item.text)}</dd>`).join("")}</dl></details></section>`,
    `<section id="interfaces"><h2>${escapeHtml(c.interfacesTitle)}</h2>${paragraph(c.interfacesIntro)}${examples.map(item => `<article id="${item.id}"><p>${escapeHtml(c.interfaceLabels[item.id])}</p><h3>${escapeHtml(item.title)}</h3>${paragraph(item.path)}<strong>${escapeHtml(item.question)}</strong>${paragraph(item.mechanic)}<p>${escapeHtml(c.leverageLabel)}: ${escapeHtml(item.pressure)}</p></article>`).join("")}</section>`,
    `<section id="holders"><h2>${escapeHtml(c.holdersTitle)}</h2>${paragraph(c.holdersIntro)}<p><strong>${value("Top 1%")}%</strong> ${escapeHtml(c.equityTop)}; <strong>${value("Bottom 50%")}%</strong> ${escapeHtml(c.equityBottom)}.</p><p>${escapeHtml(c.managersTitle)}: ${AMM_CAPITAL.administration.rows.map(row => `${escapeHtml(row.label)} $${row.value} trillion`).join(", ")}. ${escapeHtml(c.managersNote)}</p>${quote(c.holdersQuote, c.holdersSource)}${[...AMM_CAPITAL.charts, AMM_CAPITAL.administration].map(figure).join("")}</section>`,
    `<section id="detachment"><h2>${escapeHtml(c.detachmentTitle)}</h2><p>${escapeHtml(c.wealthLine)} ${c.wealthWords.map(escapeHtml).join(", ")}.</p><p>${escapeHtml(c.obligationLine)} ${c.obligationWords.map(escapeHtml).join(", ")}.</p><p>${escapeHtml(c.detachmentSource)}</p>${quote(c.detachmentQuote)}<p>${escapeHtml(c.detachmentExample)} ${link(c.detachmentExampleUrl, c.detachmentExampleLabel)}</p></section>`,
    `<section id="tests"><h2>${escapeHtml(c.questionsTitle)}</h2>${paragraph(m.testIntro)}${m.tests.map(item => `<h3>${escapeHtml(item.title)}</h3>${paragraph(item.text)}`).join("")}</section>`,
    `<section id="alternatives" aria-label="${escapeHtml(c.alternativeLabel)}"><p>${escapeHtml(c.alternativeLine)} ${link(content.artwork.movementUrl, c.movementLabel)}</p><p>${link(content.introduction.route, content.reading.prereqThen)}</p></section>`,
    `<details id="sources"><summary>${escapeHtml(m.sourcesTitle)}</summary>${paragraph(m.sourcesIntro)}${paragraph(m.creditNote)}<ul>${m.sources.map(item => `<li>${link(item.url, item.title)}${paragraph(item.note)}</li>`).join("")}</ul></details>`,
    `<nav aria-label="Continue reading">${link("/amm", "AMM home")} ${link(content.introduction.route, content.reading.prereqThen)}</nav>`,
  ].join("");
}

function contentsList(manifest) {
  return `<ol>${manifest.sections
    .map((section) => `<li>${link(`${BOOK_ROUTE}/${section.slug}`, section.title)}</li>`)
    .join("")}</ol>`;
}

function authorContactLink() {
  const email = AUTHOR.email.trim();
  return email ? link(`mailto:${email}`, email) : link(AUTHOR.links.linkedin, "LinkedIn");
}

async function publicRoutes(manifest, { essays = readEssays(), writing = [], siteContent = {} } = {}) {
  const AMM = resolveAmmCopy(JSON.parse(readFileSync(path.join(CONTENT_DIR, "amm.json"), "utf8")), (key, text) => typeof siteContent[key] === "string" && siteContent[key].trim() ? siteContent[key] : text);
  const withdrawn = writing.filter(item => item.withdrawn);
  essays = visibleFileEssays(essays, writing);
  writing = writing.filter(item => !item.withdrawn);
  const home = { name: "DOT", route: "/" };
  const book = { name: manifest.project.title, route: BOOK_ROUTE };
  const essaysPublished = essays.length > 0;
  const page = (body) => prerenderArticle(body, essaysPublished);
  const releaseDir = path.dirname(RELEASE_MANIFEST);

  // An essay's concepts become links; a misspelt id would be a dead one.
  for (const essay of essays) {
    for (const id of essay.concepts) {
      if (!DOCTRINE_CONCEPTS.some((concept) => concept.id === id)) {
        throw new Error(
          `Essay "${essay.slug}" builds on "${id}", which is not a concept in the concept map.`,
        );
      }
    }
  }

  const sectionRoutes = await Promise.all(
    manifest.sections.map(async (section, index) => {
      const text = await readFile(path.join(releaseDir, section.content_path), "utf8");
      const previous = manifest.sections[index - 1];
      const next = manifest.sections[index + 1];
      const turn = [
        previous && `Previous: ${link(`${BOOK_ROUTE}/${previous.slug}`, previous.title)}`,
        next && `Next: ${link(`${BOOK_ROUTE}/${next.slug}`, next.title)}`,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        route: `${BOOK_ROUTE}/${section.slug}`,
        title: `${section.title} — Consciousness: A Digital Organism`,
        description:
          section.subtitle ??
          `Read ${section.title} in Digital Organism Theory Book One.`,
        // A chapter link is what people actually share, so it carries a card
        // naming that chapter rather than the one card the whole site would show.
        image: `/og/book/${section.slug}.png`,
        imageAlt: `${section.title} — ${manifest.project.title}`,
        ogType: "book",
        structuredData: graph(
          chapterNode(manifest, section),
          breadcrumb([home, book, { name: section.title, route: `${BOOK_ROUTE}/${section.slug}` }]),
        ),
        prerender: page(
          [
            `<header><p>${link(BOOK_ROUTE, manifest.project.title)} · ${link(ABOUT_ROUTE, AUTHOR.name)}</p>`,
            `<h1>${escapeHtml(section.title)}</h1>`,
            section.subtitle ? `<p>${escapeHtml(section.subtitle)}</p>` : "",
            "</header>",
            renderMarkdown(text),
            turn ? `<p>${turn}</p>` : "",
          ].join(""),
        ),
      };
    }),
  );

  const conceptRoutes = DOCTRINE_CONCEPTS.map((concept) => ({
    route: `/doctrine/${concept.id}`,
    title: `${concept.name} — Digital Organism Theory`,
    description: concept.oneLine,
    structuredData: graph(
      conceptNode(concept),
      breadcrumb([
        home,
        { name: "Concept map", route: "/doctrine" },
        { name: concept.name, route: `/doctrine/${concept.id}` },
      ]),
    ),
    prerender: page(
      `<h1>${escapeHtml(concept.name)}</h1><p>${escapeHtml(concept.oneLine)}</p><p>From the ${link("/doctrine", "Book One concept map")}, where every concept leads to the passage of ${link(BOOK_ROUTE, manifest.project.title)} that defines it.</p>`,
    ),
  }));

  const staticRoutes = STATIC_ROUTES.map((route) => {
    const heading = `<h1>${escapeHtml(titleOf(route))}</h1><p>${escapeHtml(route.description)}</p>`;
    if (route.route === BOOK_ROUTE) {
      return {
        ...route,
        ogType: "book",
        structuredData: graph(bookNode(manifest), breadcrumb([home, book])),
        prerender: page(
          `<h1>${escapeHtml(BOOK_LANDING.heading)}</h1><p>${escapeHtml(manifest.project.title)} · ${escapeHtml(manifest.project.subtitle)} · ${link(ABOUT_ROUTE, AUTHOR.name)}</p><p>${escapeHtml(BOOK_DESCRIPTION)}</p><aside><h2>${escapeHtml(BOOK_LANDING.positionLabel)}</h2><p>${escapeHtml(BOOK_LANDING.position)}</p></aside><h2>Contents</h2>${contentsList(manifest)}`,
        ),
      };
    }
    if (route.route === `${BOOK_ROUTE}/copy`) {
      const pdf = `/publications/henok/digital-organism-theory/v${manifest.release.version}/digital-organism-theory-book-one.pdf`;
      return {
        ...route,
        structuredData: graph(bookNode(manifest), breadcrumb([home, book, { name: "Free PDF", route: route.route }])),
        prerender: page(
          `${heading}<p>${link(pdf, "Download the free PDF", "Digital-Organism-Theory-Book-One-Digital-Edition.pdf")}</p><p>${link(BOOK_ROUTE, "Read the fixed edition online")}</p><h2>Support the author, if you wish.</h2><p>Voluntary contributions help fund independent writing and research. The book and PDF remain free either way.</p><p>${link("/support?purpose=author", "Support the author · optional")}</p>`,
        ),
      };
    }
    if (route.route === "/support") {
      return {
        ...route,
        structuredData: graph(
          webPageNode(route),
          breadcrumb([home, { name: titleOf(route), route: route.route }]),
        ),
        prerender: page(
          `${heading}${SUPPORT_METHODS.map(method => method.id === "zelle"
            ? `<section><h2>Zelle</h2><p>Recipient: ${escapeHtml(method.recipient)}</p><p>Name to check: ${escapeHtml(method.recipientName)}</p><p>Open Zelle in your banking app, enter this recipient, and choose an amount. Check the recipient name before sending. Your bank must offer Zelle for your account.</p></section>`
            : `<section><h2>Cash App</h2><p>${link(method.url, "Continue to Cash App")}</p><p>Check the recipient and amount before sending.</p></section>`).join("")}${SUPPORT_METHODS.length ? "<p>Confirmation comes from your bank or Cash App. This page cannot confirm a direct transfer.</p>" : ""}<p>Card checkout uses Stripe, which emails the receipt. A payment buys no access, membership, or standing. Who runs the site, the refund policy, and a contact address: ${link(TERMS_ROUTE, "Terms and refunds")}.</p>`,
        ),
      };
    }
    if (route.route === "/doctrine") {
      return {
        ...route,
        structuredData: graph(
          conceptSetNode(),
          breadcrumb([home, { name: "Concept map", route: "/doctrine" }]),
        ),
        prerender: page(
          `${heading}<ul>${DOCTRINE_CONCEPTS.map((concept) => `<li>${link(`/doctrine/${concept.id}`, concept.name)}: ${escapeHtml(concept.oneLine)}</li>`).join("")}</ul>`,
        ),
      };
    }
    if (route.route === ACADEMY_ROUTE) {
      return {
        ...route,
        structuredData: graph(
          { ...webPageNode(route), "@type": "CollectionPage" },
          breadcrumb([home, { name: "Academy", route: ACADEMY_ROUTE }]),
        ),
        prerender: page([
          `<header><p>DOT Academy</p><h1>${escapeHtml(ACADEMY.heading)}</h1><p>${escapeHtml(ACADEMY.introduction)}</p></header>`,
          `<section><h2>Choose a way into the book.</h2><p>Book One is a fixed, citable edition. These reading paths change the order of the encounter without changing the book.</p><ol>${READING_PATHS.map(readingPath => `<li><h3>${escapeHtml(readingPath.label)}</h3><p>${escapeHtml(readingPath.purpose)}</p><p>${link(`${BOOK_ROUTE}/${readingPath.steps[0].slug}?path=${readingPath.id}`, `Begin: ${readingPath.label}`)}</p></li>`).join("")}</ol><p>${link(BOOK_ROUTE, "View Book One and its contents")}</p></section>`,
          `<section><h2>Follow your questions.</h2><p>${link("/doctrine", "Explore the concept map")} · ${link("/applied", "Review open questions")} · ${link(`${CONTACT_ROUTE}?purpose=writing`, "Bring a question to the conversation")}</p></section>`,
        ].join("")),
      };
    }
    return {
      ...route,
      structuredData: graph(
        webPageNode(route),
        breadcrumb([home, { name: titleOf(route), route: route.route }]),
      ),
      prerender: page(heading),
    };
  });

  const [aboutText, privacyText, termsText] = await Promise.all([
    readFile(path.join(CONTENT_DIR, "pages", "about.md"), "utf8"),
    readFile(path.join(CONTENT_DIR, "pages", "privacy.md"), "utf8"),
    readFile(path.join(CONTENT_DIR, "pages", "terms.md"), "utf8"),
  ]);

  const about = {
    route: ABOUT_ROUTE,
    title: `${AUTHOR.name} — ${BUILDER.title}`,
    description: `${AUTHOR.name}. ${BUILDER.summary}`,
    ogType: "profile",
    image: "/og/henok-platform.png",
    imageAlt: `${AUTHOR.name} — work, writing and conversation`,
  };
  const authorRoutes = [
    { route: "/studio/pages/amm", title: "Edit AMM’s pages", description: "Private page editor.", noindex: true, prerender: page("<h1>Edit AMM’s pages</h1><p>Sign in to open your saved page copy.</p>") },
    { route: "/studio/newsletter", title: "AMM newsletter — Private workspace", description: "Private newsletter desk.", noindex: true, prerender: page("<h1>AMM newsletter</h1><p>Sign in to open the private workspace.</p>") },
    {
      route: "/studio/writing",
      title: `Writing studio — ${AUTHOR.name}`,
      description: "Sign in to import, edit and publish your writing.",
      noindex: true,
      structuredData: graph({
        "@type": "WebPage",
        "@id": `${SITE_URL}/studio/writing#page`,
        url: `${SITE_URL}/studio/writing`,
        name: "Writing studio",
      }),
      prerender: page('<p>Private workspace</p><h1>Writing studio</h1><p>Sign in to import Markdown, add images, edit and publish your writing. This workspace requires JavaScript.</p>'),
    },
    {
      route: INBOX_ROUTE,
      title: `Contact inbox — ${AUTHOR.name}`,
      description: "Sign in with the site owner's account to review and reply to private inquiries.",
      noindex: true,
      structuredData: graph({
        "@type": "WebPage",
        "@id": `${SITE_URL}${INBOX_ROUTE}#page`,
        url: pageUrl(INBOX_ROUTE),
        name: "Contact inbox",
      }),
      prerender: page('<p>Private workspace</p><h1>Contact inbox</h1><p>Sign in with the site owner’s account to review and reply to private inquiries. This workspace requires JavaScript.</p>'),
    },
    {
      ...about,
      structuredData: graph(
        profilePageNode(about),
        ...dissertationNodes(),
        breadcrumb([home, { name: "About", route: ABOUT_ROUTE }]),
      ),
      prerender: page(
        [
          `<h1>${escapeHtml(AUTHOR_BYLINE)}</h1>`,
          `<p>${escapeHtml(BUILDER.title)}</p>`,
          `<p>${escapeHtml(AUTHOR.role)}</p>`,
          `<p>${escapeHtml(BUILDER.headline)}</p>`,
          `<p>${link(`${CONTACT_ROUTE}?purpose=project`, "Discuss a project")}</p>`,
          `<p>${link("#about-resume", "View résumé")}</p>`,
          `<nav aria-label="On this page">${link("#about-products", "Selected work")} · ${link("#about-services", "Project work")} · ${link("#about-resume", "Career & résumé")} · ${link("#about-contact", "Contact")}</nav>`,
          '<h2 id="about-products">Selected work</h2>',
          `<ul>${BUILDER_PROJECTS.map((project) => {
            const href = project.links.live || project.links.website || project.links.repo;
            const label = project.links.live ? "Explore project" : project.links.website ? "Visit website" : "View source";
            const showcase = project.showcase ? `<div><img src="${escapeHtml(project.showcase.brandMark)}" alt="Sullix mark" width="200" height="200"><img src="${escapeHtml(project.showcase.mark)}" alt="Faro mark" width="160" height="160"><p>${escapeHtml(project.showcase.agentName)} — ${escapeHtml(project.showcase.agentRole)}</p></div>` : "";
            const movement = project.movement;
            const heading = movement ? "h4" : "h3";
            const body = `<${heading}>${escapeHtml(project.name)}</${heading}>${showcase}<p>${escapeHtml(project.status)}</p><p>${escapeHtml(project.role)}</p><p>${escapeHtml(project.period)}</p><p>${escapeHtml(project.tagline)}</p>${href ? link(href, `${label}: ${project.name}`) : ""}<details><summary>Project details</summary><p>${escapeHtml(project.description)}</p><ul>${project.stack.map((technology) => `<li>${escapeHtml(technology)}</li>`).join("")}</ul></details>`;
            if (!movement) return `<li id="project-${escapeHtml(project.slug)}">${body}</li>`;
            return `<li><section id="project-${escapeHtml(movement.slug)}"><p>${escapeHtml(movement.category)}</p><h3>${escapeHtml(movement.name)}</h3><p>${escapeHtml(movement.subtitle)}</p><p>${escapeHtml(movement.role)}</p><img src="${escapeHtml(movement.artwork)}" alt="${escapeHtml(movement.artworkAlt)}" width="1024" height="1536" loading="lazy"><p>${escapeHtml(movement.tagline)}</p><details><summary>About the movement</summary><p>${escapeHtml(movement.description)}</p></details><p>${escapeHtml(movement.status)}</p><p>${link(movement.href, `Explore ${movement.name}`)}</p><p>${escapeHtml(movement.relationship)}</p></section><article id="project-${escapeHtml(project.slug)}">${body}</article></li>`;
          }).join("")}</ul>`,
          // The live page's rule (projectDestination): only work with a public destination is named.
          OTHER_BUILDER_PROJECTS.map((project) => ({ project, href: project.links.live || project.links.website || project.links.repo }))
            .filter(({ href }) => href)
            .map(({ project, href }) => `<p>Also in open source: ${link(href, project.name)}. Isolation for AI agent tools.</p>`).join(""),
          '<h2 id="about-services">Project work</h2>',
          BUILDER.services.map((service) => `<h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p>`).join(""),
          `<p>${escapeHtml(CAREER.background)}</p><h2 id="about-resume">Career & résumé</h2>`,
          `<ol>${CAREER.experience.map((job) => `<li><p>${escapeHtml(job.period)}</p><h3>${escapeHtml(job.company)}</h3><p>${escapeHtml(job.role)}</p></li>`).join("")}</ol>`,
          AUTHOR.credentials.length > 0
            ? `<h3>Education</h3><ul>${AUTHOR.credentials
                .map(
                  (credential) =>
                    `<li>${escapeHtml(credential.degree)} · ${escapeHtml(credential.institution)}, ${credential.year}${
                      credential.dissertation
                        ? `<details><summary>Doctoral research</summary><p>${credential.dissertation.url ? link(credential.dissertation.url, credential.dissertation.title) : escapeHtml(credential.dissertation.title)}</p></details>`
                        : ""
                    }</li>`,
                )
                .join("")}</ul>`
            : "",
          `<details><summary>Technical toolkit</summary><dl>${CAREER.skills.map((skill) => `<dt>${escapeHtml(skill.domain)}</dt><dd>${escapeHtml(skill.technologies)}</dd>`).join("")}</dl></details>`,
          `<p>${link(AUTHOR.resumeUrl && (/^https:\/\//.test(AUTHOR.resumeUrl) || /^\/(?!\/)/.test(AUTHOR.resumeUrl))
            ? AUTHOR.resumeUrl
            : AUTHOR.email.trim() ? `mailto:${AUTHOR.email.trim()}?subject=${encodeURIComponent("Résumé request")}` : AUTHOR.links.linkedin,
          AUTHOR.resumeUrl ? "Download résumé" : "Request full résumé")}</p>`,
          AUTHOR.resumeOnlineUrl ? `<p>${link(AUTHOR.resumeOnlineUrl, "Read online")}</p>` : "",
          "<p>Full experience, research, and technical background.</p>",
          '<h2 id="about-writing">Writing & research</h2>',
          `<p>${escapeHtml(AUTHOR.summary)}</p>`,
          `<p>${link(BOOK_ROUTE, "Read Book One")} · ${link(BLOG_ROUTE, "Essays and letters")}</p>`,
          `<details><summary>Where the work comes from</summary>${renderMarkdown(aboutText)}<p>From the ${link(`${BOOK_ROUTE}/preface`, "preface to Book One")}.</p><p>${link("/doctrine", "The concept map")} · ${link("/applied", "Open seams")}</p></details>`,
          '<h2 id="about-contact">Contact</h2>',
          `<p>${escapeHtml(BUILDER.contactIntro)}</p><p>${link(CONTACT_ROUTE, "Start a conversation")} · ${authorContactLink()}</p>`,
          `<p>${link(AUTHOR.links.linkedin, "LinkedIn")} · ${link(AUTHOR.links.github, "GitHub")}</p>`,
          "<p>Also for writing, research, interviews, and requests about your data.</p>",
        ].join(""),
      ),
    },
    {
      route: CONTACT_ROUTE,
      title: `Contact — ${AUTHOR.name}`,
      description: CONTACT.description,
      image: "/og/henok-platform.png",
      imageAlt: `${AUTHOR.name} — work, writing and conversation`,
      body: `<h1>${escapeHtml(CONTACT.title)}</h1><p>${escapeHtml(CONTACT.description)}</p><h2>What brings you here?</h2><ul>${CONTACT.purposes.map(purpose => `<li><h3>${escapeHtml(purpose.title)}</h3><p>${escapeHtml(purpose.description)}</p></li>`).join("")}</ul><p>The contact form needs JavaScript. You can also email ${authorContactLink()} directly.</p><h2>What happens next</h2><p>${escapeHtml(CONTACT.next)}</p><p>${escapeHtml(CONTACT.privacy)} ${link(PRIVACY_ROUTE, "Read the privacy page.")}</p><p>${link(`${ABOUT_ROUTE}#about-resume`, "Background & résumé")}</p>`,
    },
    {
      route: READERS_ROUTE,
      title: `${READERS.title} — ${AUTHOR.name}`,
      description: READERS.description,
      body: `<p>${escapeHtml(READERS.title)}</p><h1>${escapeHtml(READERS.heading)}</h1><p>${escapeHtml(READERS.description)}</p><ul>${READERS.topics.map(topic => `<li><h2>${escapeHtml(topic.label)}</h2><p>${escapeHtml(topic.description)}</p></li>`).join("")}</ul><h2>${escapeHtml(READERS.formTitle)}</h2><p>${escapeHtml(READERS.formDescription)}</p><p>The signup form needs JavaScript. Everything published remains available without joining.</p><ul>${READERS.commitments.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p>${link(PRIVACY_ROUTE, "How addresses are kept")} · ${link(BLOG_ROUTE, "Browse the writing")} · ${link(AMM.route + "/editions#amm-subscribe", "Subscribe to AMM separately")}</p>`,
    },
    {
      route: `${READERS_ROUTE}/leave`,
      title: `Leave the reader list — ${AUTHOR.name}`,
      description: `Remove an address from ${AUTHOR.name}’s reader list.`,
      // Where a message's leave link lands. There is nothing here to find.
      noindex: true,
      body: `<h1>Leave the reader list</h1><p>Opened from the link in a message, this page removes you at once, which needs JavaScript. Without it, reach the author via ${authorContactLink()} and you will be removed by hand.</p>`,
    },
    {
      route: PRIVACY_ROUTE,
      title: `Privacy — ${AUTHOR.name}`,
      description:
        "What this site keeps, what it never collects, and which services handle what.",
      body: renderMarkdown(privacyText),
    },
    {
      route: TERMS_ROUTE,
      title: `Terms and refunds — ${AUTHOR.name}`,
      description:
        "Who runs this site, what an optional payment to the author is, and how to get a refund.",
      body: renderMarkdown(termsText),
    },
  ].map((route) => {
    if (route.structuredData) return route;
    const { body, ...rest } = route;
    return {
      ...rest,
      structuredData: graph(
        webPageNode(rest),
        breadcrumb([home, { name: titleOf(rest), route: rest.route }]),
      ),
      prerender: page(body ?? `<h1>${escapeHtml(titleOf(rest))}</h1><p>${escapeHtml(rest.description)}</p>`),
    };
  });

  const essayRoutes = [
    {
      route: ESSAYS_ROUTE,
      canonicalRoute: BLOG_ROUTE,
      title: `Writing archive — ${AUTHOR.name}`,
      description: "Essays and letters are collected in the blog.",
      structuredData: graph(webPageNode({ route: BLOG_ROUTE, title: "Writing archive", description: "Essays and letters." })),
      prerender: page(`<h1>Writing archive</h1><p>Essays and letters are collected in the blog.</p><p>${link(BLOG_ROUTE, "All writing")}</p>`),
    },
    ...essays.map((essay) => {
      const route = `${ESSAYS_ROUTE}/${essay.slug}`;
      const isAmm = essay.series === AMM.series;
      const concepts = essay.concepts
        .map((id) => DOCTRINE_CONCEPTS.find((concept) => concept.id === id))
        .map((concept) => `<li>${link(`/doctrine/${concept.id}`, concept.name)}</li>`)
        .join("");
      return {
        route,
        title: `${essay.title} — ${isAmm ? AMM.title : AUTHOR.name}`,
        publication: isAmm ? "amm" : undefined,
        description: essay.summary,
        image: essay.cover?.src ?? "/og/henok-writing.png",
        imageAlt: essay.cover?.alt ?? `${AUTHOR.name} — writing and ideas`,
        imageWidth: essay.cover?.width,
        imageHeight: essay.cover?.height,
        ogType: "article",
        lastmod: essay.updated ?? essay.published,
        structuredData: graph(
          articleNode(essay),
          breadcrumb([home, { name: isAmm ? AMM.title : "Blog", route: isAmm ? AMM.route : BLOG_ROUTE }, { name: essay.title, route }]),
        ),
        prerender: (isAmm ? prerenderAmm : page)(
          [
            `<p>${link(isAmm ? "/amm/editions" : BLOG_ROUTE, isAmm ? "All AMM editions" : "All writing")}</p>`,
            isAmm ? ammReadingBarHtml(AMM, essay.slug) : "",
            `<header><p>${POST_FORMATS[essay.format ?? "essay"]}${essay.series ? ` · ${escapeHtml(essay.series)}` : ""} by ${link(ABOUT_ROUTE, AUTHOR.name)} · <time datetime="${essay.published}">${essay.published}</time> · ${essay.readingMinutes} min read · Claim levels: ${essay.levels.join(", ")}</p>`,
            `<h1>${escapeHtml(essay.title)}</h1><p>${escapeHtml(essay.summary)}</p></header>`,
            coverHtml(essay.cover),
            renderMarkdown(essay.body, { images: essay.images, post: true }),
            `<p>End of ${POST_FORMATS[essay.format ?? "essay"].toLowerCase()}</p>`,
            isAmm ? ammEditionEndHtml(AMM, essay.slug) : "",
            concepts ? `<h2>Builds on</h2><ul>${concepts}</ul>` : "",
            `<p>${link(isAmm ? "/amm/editions" : BLOG_ROUTE, isAmm ? "All AMM editions" : "All writing")}</p>`,
          ].join(""),
        ),
      };
    }),
  ];

  const writingRoutes = writing.flatMap((item) => {
    const pages = item.releases.map((release) => ({ path: writingPath(item, release.number), release }));
    pages.push({ path: writingPath(item), release: item.releases.at(-1) });
    if (managedWriting(item)) pages.push({ path: writingPublicPath(item), release: item.releases.at(-1) });
    return pages.map(({ path: route, release }) => {
      const { manifest: delivered, body, cover, images } = release;
      const isAmm = delivered.presentation?.series === AMM.series;
      const sources = delivered.sources ?? [];
      return {
        route,
        canonicalRoute: route === writingPath(item) && managedWriting(item) ? writingPublicPath(item) : undefined,
        title: `${delivered.title} — ${isAmm ? AMM.title : AUTHOR.name}`,
        publication: isAmm ? "amm" : undefined,
        description: delivered.summary || `${delivered.title}, by ${AUTHOR.name}.`,
        ogType: "article",
        image: cover?.src, imageAlt: cover?.alt, imageWidth: cover?.width, imageHeight: cover?.height,
        lastmod: item.published,
        structuredData: graph(
          articleNode({ ...item, cover, title: delivered.title, summary: delivered.summary ?? "", url: pageUrl(route), concepts: [] }),
          breadcrumb([home, { name: isAmm ? AMM.title : "Blog", route: isAmm ? AMM.route : BLOG_ROUTE }, { name: delivered.title, route }]),
        ),
        prerender: (isAmm ? prerenderAmm : page)(
          [
            `<p>${link(isAmm ? "/amm/editions" : BLOG_ROUTE, isAmm ? "All AMM editions" : "All writing")}</p>`,
            isAmm ? ammReadingBarHtml(AMM, item.slug) : "",
            `<header><p>By ${link(ABOUT_ROUTE, AUTHOR.name)} · Version ${release.number}</p>`,
            `<h1>${escapeHtml(delivered.title)}</h1>${delivered.summary ? `<p>${escapeHtml(delivered.summary)}</p>` : ""}</header>`,
            coverHtml(cover),
            renderMarkdown(body, { images, post: true, restrictImages: true }),
            "<p>End of piece</p>",
            `<h2>Claims</h2><ul>${delivered.claims.map((claim) => `<li>${escapeHtml(claim.statement)} (${escapeHtml(claim.epistemic_level)})</li>`).join("")}</ul>`,
            sources.length > 0
              ? `<h2>Sources</h2><ul>${sources.map((source) => `<li>${/^https?:\/\//i.test(source.external_uri) ? link(source.external_uri, source.external_uri) : escapeHtml(source.external_uri)}</li>`).join("")}</ul>`
              : "",
            isAmm ? ammEditionEndHtml(AMM, item.slug) : "",
            `<p>${link(isAmm ? "/amm/editions" : BLOG_ROUTE, isAmm ? "All AMM editions" : "All writing")}</p>`,
          ].join(""),
        ),
      };
    });
  });

  const publicationsRoute = {
    route: PUBLICATIONS_ROUTE,
    title: `Books — ${AUTHOR.name}`,
    description: `Books by ${AUTHOR.name}, with links to the complete free edition and letters.`,
    lastmod: writing[0]?.published,
    structuredData: graph(
      webPageNode({ route: PUBLICATIONS_ROUTE, title: `Books — ${AUTHOR.name}`, description: `Books by ${AUTHOR.name}.` }),
      breadcrumb([home, { name: "Books", route: PUBLICATIONS_ROUTE }]),
    ),
    prerender: page(
      [
        `<h1>Books</h1><p>Books by ${link(ABOUT_ROUTE, AUTHOR.name)}.</p>`,
        `<ul><li>${link(BOOK_ROUTE, manifest.project.title)}</li><li>${escapeHtml(NEWSLETTER.title)} (${escapeHtml(NEWSLETTER.status)})</li></ul>`,
        `<p>${link(AMM.route, "Explore the AMM publication")}</p>`,
      ].join(""),
    ),
  };

  const blogPosts = [
    ...essays.map((essay) => ({ title: essay.title, summary: essay.summary, date: essay.published, cover: essay.cover, href: `${ESSAYS_ROUTE}/${essay.slug}` })),
    ...writing.map((item) => ({ title: item.title, summary: item.summary, date: item.published, cover: item.cover, href: writingPublicPath(item) })),
  ].sort((first, second) => second.date.localeCompare(first.date));
  const blogRoute = {
    route: BLOG_ROUTE,
    title: `${BLOG.title} — ${AUTHOR.name}`,
    description: BLOG.description,
    image: "/og/henok-writing.png",
    imageAlt: `${AUTHOR.name} — ${BLOG.heading.join(" ")}`,
    lastmod: blogPosts[0]?.date,
    structuredData: graph(
      {
        ...webPageNode({ route: BLOG_ROUTE, title: `${BLOG.title} — ${AUTHOR.name}`, description: BLOG.description }),
        "@type": "Blog",
        author: { "@id": PERSON_ID },
      },
      breadcrumb([home, { name: "Blog", route: BLOG_ROUTE }]),
    ),
    prerender: page(
      [
        `<p>${escapeHtml(BLOG.title)}</p><h1>${BLOG.heading.map(escapeHtml).join("<br />")}</h1>`,
        `<p>${escapeHtml(BLOG.description)}</p><p>By ${link(ABOUT_ROUTE, AUTHOR.name)}</p>`,
        `<div id="start-reading"><section><p>Book One · Free to read</p><h2>${escapeHtml(manifest.project.title)}</h2><p>${link(BOOK_ROUTE, "Read Book One")}</p><details><summary>Start with a passage</summary><p>${escapeHtml(BLOG.startingPoint.label)}</p><p>${escapeHtml(BLOG.startingPoint.title)}</p><p>${link(BLOG.startingPoint.to, BLOG.startingPoint.linkLabel)}</p></details></section>`,
        `<section><a href="${escapeHtml(AMM.route)}"><img src="${escapeHtml(AMM_MEDIA.illustration.fallback)}" alt="${escapeHtml(AMM.artwork.alt)}" width="${AMM_MEDIA.illustration.width}" height="${AMM_MEDIA.illustration.height}" /></a><p>AMM · An independent publication</p><h2>${escapeHtml(NEWSLETTER.title)}</h2><p>${link(AMM.route, "Explore AMM")}</p>`,
        NEWSLETTER.editions.length > 0
          ? `<details><summary>Read a letter</summary><ul aria-label="Letters on LinkedIn">${NEWSLETTER.editions.map((edition) => `<li>${link(edition.url, edition.title)}</li>`).join("")}</ul></details>`
          : "",
        "</section></div>",
        "<h2>Latest writing</h2><p>Newest first</p>",
        blogPosts.length > 0
          ? `<ol>${blogPosts.map((post) => `<li>${post.cover ? `<img src="${escapeHtml(post.cover.src)}" alt="" width="160" loading="lazy" />` : ""}${link(post.href, post.title)} (<time datetime="${post.date}">${post.date}</time>)${post.summary ? `: ${escapeHtml(post.summary)}` : ""}</li>`).join("")}</ol><p>That is everything posted here so far.</p>`
          : `<p>${escapeHtml(BLOG.emptyTitle)}</p><p>${escapeHtml(BLOG.emptyDescription)}</p>`,
        `<h2>Read at your pace.</h2><p>${link(FEED_URL, "Follow with RSS")} · ${link(READERS_ROUTE, "Open the reader list")}</p>`,
        `<p>AI &amp; digital products</p><h2>${escapeHtml(BLOG.contactTitle)}</h2><p>${link(`${CONTACT_ROUTE}?purpose=project`, "Discuss a project")}</p><p>${link(`${ABOUT_ROUTE}#about-products`, "Explore the work")}</p>`,
      ].join(""),
    ),
  };

  const ammPosts = [
    ...essays.filter(item => item.series === AMM.series).map(item => ({ title: item.title, summary: AMM.money.companions.find(note => note.id === item.slug)?.summary ?? item.summary, date: item.published, href: `${ESSAYS_ROUTE}/${item.slug}` })),
    ...writing.filter(item => item.releases.at(-1)?.manifest?.presentation?.series === AMM.series).map(item => ({ title: item.title, summary: item.summary, date: item.published, href: writingPublicPath(item) })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const ammLetters = ammPosts.filter(post => !AMM_PARTS.some(part => post.href === `${ESSAYS_ROUTE}/${part.slug}`));
  const overviewSourceChapter = AMM_PARTS.find(part => AMM.home.overviewSource.startsWith(`${part.partLabel} ·`));
  const overviewCitation = overviewSourceChapter ? link(`${ESSAYS_ROUTE}/${overviewSourceChapter.slug}`, AMM.home.overviewSource) : escapeHtml(AMM.home.overviewSource);
  const ammRoute = {
    route: AMM.route, title: AMM.title, description: AMM.description, publication: "amm",
    image: AMM_MEDIA.illustration.fallback, imageAlt: AMM.artwork.alt,
    structuredData: graph({ ...webPageNode({ route: AMM.route, title: AMM.title, description: AMM.description }), "@type": "Blog", author: { "@id": PERSON_ID } }, breadcrumb([home, { name: AMM.title, route: AMM.route }])),
    prerender: prerenderAmm([
      `<h1>${AMM.headline.map(escapeHtml).join(" ")}</h1>`,
      `<p>${escapeHtml(AMM.home.premise)}</p>`,
      `<figure><a href="${escapeHtml(AMM.artwork.src)}" aria-label="Open full-size illustration"><img src="${escapeHtml(AMM.artwork.src)}" alt="${escapeHtml(AMM.artwork.alt)}" width="${AMM_MEDIA.illustration.width}" height="${AMM_MEDIA.illustration.height}" /></a></figure>`,
      `<p>${link("#amm-overview", AMM.heroAction)}</p>`,
      `<section id="amm-overview" aria-labelledby="amm-overview-title"><h2 id="amm-overview-title">${escapeHtml(AMM.home.overviewTitle)}</h2><p>${escapeHtml(AMM.home.overviewClaim)}</p><p>${escapeHtml(AMM.home.overviewIntro)}</p><blockquote><p>${escapeHtml(AMM.home.overviewArgument)}</p><cite>${overviewCitation}</cite></blockquote><ol aria-label="${escapeHtml(AMM.home.conceptsLabel)}">${AMM.home.concepts.map((item, index) => `<li>${index === 0 || AMM_MEDIA.homeScenes.concepts[item.id] !== AMM_MEDIA.homeScenes.concepts[AMM.home.concepts[index - 1].id] ? ammHomeSceneHtml("concepts", item.id, AMM.home) : ""}<p>${escapeHtml(item.label)}</p><h3>“${escapeHtml(item.script)}”</h3><p>${escapeHtml(item.text)}</p><blockquote><p>${escapeHtml(item.argument)}</p><cite>${escapeHtml(item.source)}</cite></blockquote></li>`).join("")}</ol></section>`,
      ammDotHtml(AMM),
      ammPathHtml(AMM, "amm-start", essays),
      ammSponsorHtml(AMM),
    ].join("")),
  };
  const ammCapitalRoute = {
    // Hidden for now: built for its address, kept out of search and the sitemap, and linked from nowhere.
    route: CAPITAL_ROUTE, title: `${AMM.capital.title} — ${AMM.title}`, description: AMM.capital.intro, publication: "amm", noindex: true,
    image: AMM_MEDIA.erosion.full, imageAlt: AMM_MEDIA.erosion.alt,
    imageWidth: AMM_MEDIA.erosion.width, imageHeight: AMM_MEDIA.erosion.height,
    structuredData: graph(webPageNode({ route: CAPITAL_ROUTE, title: AMM.capital.title, description: AMM.capital.intro }), breadcrumb([home, { name: AMM.title, route: AMM.route }, { name: AMM.capital.title, route: CAPITAL_ROUTE }])),
    prerender: prerenderAmm(ammCapitalHtml(AMM)),
  };
  // The former money guide's addresses open the AMM home while How power works is hidden.
  const ammMovedGuideRoutes = ["/amm/money", "/amm/money/ownership", "/amm/money/alternatives", "/amm/capital"].map(route => ({
    route, title: AMM.title, description: AMM.description,
    canonicalRoute: AMM.route, noindex: true, publication: "amm",
    structuredData: graph(webPageNode({ route, title: AMM.title, description: AMM.description })),
    prerender: prerenderAmm(`<h1>${escapeHtml(AMM.title)}</h1><p>${link(AMM.route, "Open the manifesto")}</p>`),
  }));
  const ammEditionsRoute = {
    route: "/amm/editions", title: `${AMM.archiveTitle} — ${AMM.title}`, description: AMM.description, publication: "amm",
    image: AMM_MEDIA.illustration.fallback, imageAlt: AMM.artwork.alt,
    structuredData: graph(webPageNode({ route: "/amm/editions", title: AMM.archiveTitle, description: AMM.description }), breadcrumb([home, { name: AMM.title, route: AMM.route }, { name: "Editions", route: "/amm/editions" }])),
    prerender: prerenderAmm([
      `<section id="amm-editions"><h1>${escapeHtml(AMM.archiveTitle)}</h1><p>${escapeHtml(AMM.archiveDescription)}</p></section>`,
      ammPathHtml(AMM, "amm-chapters", essays),
      `<section id="amm-letters"><p>${escapeHtml(AMM.reading.lettersEyebrow)}</p><h2>${escapeHtml(AMM.reading.lettersTitle)}</h2><p>${escapeHtml(AMM.reading.lettersDescription)}</p>${ammLetters.length ? `<ol>${ammLetters.map(post => `<li>${link(post.href, post.title)} <time datetime="${post.date}">${post.date}</time><p>${escapeHtml(post.summary)}</p></li>`).join("")}</ol>` : `<h3>${escapeHtml(AMM.emptyTitle)}</h3><p>${escapeHtml(AMM.emptyDescription)}</p>`}</section>`,
      `<section id="amm-subscribe"><h2>${escapeHtml(AMM.signupTitle)}</h2><p>${escapeHtml(AMM.signupDescription)}</p><p>Email signup requires JavaScript. ${link(AMM.feed, "Follow AMM with RSS")} without an account.</p></section>`,
    ].join("")),
  };
  const withdrawnRoutes = withdrawn.flatMap(item => [writingPath(item), writingPath(item, item.releaseNumber), ...(managedWriting(item) ? [writingPublicPath(item)] : [])].map(route => ({
    route, title: `${item.title} — Withdrawn`, description: "This release has been withdrawn.", structuredData: graph(webPageNode({ route, title: item.title, description: "This release has been withdrawn." })), publication: managedWriting(item) ? "amm" : undefined,
    prerender: (managedWriting(item) ? prerenderAmm : page)(`<h1>${escapeHtml(item.title)}</h1><p>This release has been withdrawn.</p><p>${link(managedWriting(item) ? "/amm/editions" : BLOG_ROUTE, "Return to the archive")}</p>`),
  })));
  // A piece folded into a chapter keeps a page at its old address that points to its new place.
  const movedRoutes = Object.entries(ESSAY_MOVES).map(([slug, move]) => ({
    route: `${ESSAYS_ROUTE}/${slug}`, title: `${move.title} — ${AMM.title}`, description: `${move.title} is now a section of a chapter.`,
    canonicalRoute: move.route, noindex: true, publication: "amm",
    structuredData: graph(webPageNode({ route: `${ESSAYS_ROUTE}/${slug}`, title: move.title, description: `${move.title} is now a section of a chapter.` })),
    prerender: prerenderAmm(`<h1>${escapeHtml(move.title)}</h1><p>This section now appears in ${link(`${move.route}#${move.anchor}`, essays.find(essay => `${ESSAYS_ROUTE}/${essay.slug}` === move.route)?.title ?? "its chapter")}.</p>`),
  }));
  // The Community page was retired; its address points to Contact, where conversations start.
  const communityRoute = {
    route: COMMUNITY_ROUTE,
    canonicalRoute: CONTACT_ROUTE,
    noindex: true,
    title: `Contact — ${AUTHOR.name}`,
    description: `Start a conversation with ${AUTHOR.name}.`,
    structuredData: graph(webPageNode({ route: CONTACT_ROUTE, title: `Contact — ${AUTHOR.name}`, description: `Start a conversation with ${AUTHOR.name}.` })),
    prerender: page(`<h1>Contact ${escapeHtml(AUTHOR.name)}</h1><p>${link(CONTACT_ROUTE, "Start a conversation")}</p>`),
  };

  const filmsRoute = {
    route: FILMS_ROUTE,
    title: `${FILMS.eyebrow} — ${AUTHOR.name}`,
    description: FILMS.description,
    structuredData: graph(
      {
        ...webPageNode({ route: FILMS_ROUTE, title: `${FILMS.eyebrow} — ${AUTHOR.name}`, description: FILMS.description }),
        "@type": "CollectionPage",
        author: { "@id": PERSON_ID },
      },
      breadcrumb([home, { name: "Academy", route: ACADEMY_ROUTE }, { name: "Films", route: FILMS_ROUTE }]),
    ),
    prerender: page(
      [
        `<header><p>${escapeHtml(FILMS.eyebrow)} · By ${link(ABOUT_ROUTE, AUTHOR.name)}</p>`,
        `<h1>${escapeHtml(FILMS.title)}</h1>`,
        `<p>${escapeHtml(FILMS.subtitle)}</p>`,
        `<p>${link(FILMS.channelUrl, `${FILMS.channelHandle} on YouTube`)}</p>`,
        `<p>${escapeHtml(FILMS.privacyNote)}</p></header>`,
        `<section id="screening-room"><h2>A short film for each concept</h2><p>${escapeHtml(FILMS.conceptFilmsNote)}</p><ol>${DOCTRINE_CONCEPTS.map((concept) => [
          `<li><h3>${escapeHtml(concept.name)}</h3>`,
          `<p>${escapeHtml(concept.oneLine)}</p>`,
          `<p>${link(`${FILMS_ROUTE}?concept=${concept.id}#screening-room`, "Watch the film")} · ${link(`/doctrine/${concept.id}`, "Open in the concept map")}</p></li>`,
        ].join("")).join("")}</ol></section>`,
        `<section id="channel-streams"><h2>Series on ${escapeHtml(FILMS.channelHandle)}</h2><p>${escapeHtml(FILMS.seriesNote)}</p>${FILMS.streams.map((stream) => [
          `<section><h3>${escapeHtml(stream.number)}: ${escapeHtml(stream.title)}</h3><p>${escapeHtml(stream.description)}</p>`,
          `<ul>${stream.episodes.map((ep) => `<li><h4>${escapeHtml(ep.code)} · ${escapeHtml(ep.title)}</h4><p>${escapeHtml(ep.subtitle)}</p><p>${link(ep.readingTo, ep.readingLabel)}</p></li>`).join("")}</ul></section>`,
        ].join("")).join("")}<p>${escapeHtml(FILMS.completionNote)}</p></section>`,
      ].join(""),
    ),
  };

  const filmAliasRoutes = [LEGACY_FILMS_ROUTE, VIDEOS_ROUTE].map(route => ({
    route,
    canonicalRoute: FILMS_ROUTE,
    title: `${FILMS.eyebrow} — ${AUTHOR.name}`,
    description: FILMS.description,
    structuredData: graph(webPageNode({ route: FILMS_ROUTE, title: `${FILMS.eyebrow} — ${AUTHOR.name}`, description: FILMS.description })),
    prerender: page(`<h1>${escapeHtml(FILMS.title)}</h1><p>${escapeHtml(FILMS.description)}</p><p>${link(FILMS_ROUTE, "Open the Films & Screening Room")}</p>`),
  }));

  return [...staticRoutes, blogRoute, communityRoute, filmsRoute, ...filmAliasRoutes, ammRoute, ammCapitalRoute, ...ammMovedGuideRoutes, ammEditionsRoute, ...movedRoutes, publicationsRoute, ...authorRoutes, ...essayRoutes, ...writingRoutes, ...withdrawnRoutes, ...sectionRoutes, ...conceptRoutes];
}

/** Replace exactly the tag a pattern names, or fail: a silent miss ships the wrong page. */
function replaceOnce(html, pattern, replacement, what) {
  let found = false;
  // A function, not a string: `$&` in an essay title must stay literal.
  const result = html.replace(pattern, () => {
    found = true;
    return replacement;
  });
  if (!found) throw new Error(`Failed to set ${what}: the shell has no matching tag`);
  return result;
}

function setStructuredData(html, structuredData) {
  return replaceOnce(
    html,
    /<script type="application\/ld\+json" id="dot-structured-data">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="dot-structured-data">\n${serializeStructuredData(structuredData)}\n    </script>`,
    "structured data (dot-structured-data block)",
  );
}

function setRoot(html, prerender) {
  return replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${prerender}</div>`, "page text (empty #root)");
}

function addHeadTags(html, tags) {
  if (tags.length === 0) return html;
  return replaceOnce(html, /<\/head>/, `    ${tags.join("\n    ")}\n  </head>`, "head tags");
}

function feedLinkTag() {
  return `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(FEED_TITLE)}" href="${FEED_URL}" />`;
}

/** One route's document: its metadata, its structured data, and its own text. */
export function renderRoute(shell, route, { headTags = [] } = {}) {
  const url = pageUrl(route.canonicalRoute ?? route.route);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const image = new URL(route.image ?? "/og-image.png", SITE_URL).href;
  const imageAlt = escapeHtml(
    route.imageAlt ?? "DOT — Consciousness: A Digital Organism, Book One",
  );
  const tags = [
    [/<title>.*?<\/title>/, `<title>${title}</title>`, "title"],
    [/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`, "description"],
    [/<link rel="canonical" href="[^"]*"(?: data-rh="true")?\s*\/>/, `<link rel="canonical" href="${url}" data-rh="true" />`, "canonical"],
    [/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`, "og:url"],
    [/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`, "og:title"],
    [/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`, "og:description"],
    [/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`, "twitter:title"],
    [/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`, "twitter:description"],
    [/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${image}" />`, "og:image"],
    [/<meta property="og:image:width" content="[^"]*"\s*\/>/, `<meta property="og:image:width" content="${route.imageWidth ?? 1200}" />`, "og:image:width"],
    [/<meta property="og:image:height" content="[^"]*"\s*\/>/, `<meta property="og:image:height" content="${route.imageHeight ?? 630}" />`, "og:image:height"],
    [/<meta property="og:image:alt" content="[^"]*"\s*\/>/, `<meta property="og:image:alt" content="${imageAlt}" />`, "og:image:alt"],
    [/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${image}" />`, "twitter:image"],
    [/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${route.ogType ?? "website"}" />`, "og:type"],
  ];

  let html = shell;
  if (route.publication === "amm") {
    // Helmet takes ownership on boot and removes this override when leaving AMM.
    // Keep the base site's icons so client-side navigation restores its identity.
    headTags = [...headTags, '<link data-rh="true" rel="icon" type="image/svg+xml" href="/amm/mark.svg" />'];
  }
  for (const [pattern, replacement, what] of tags) {
    html = replaceOnce(html, pattern, replacement, `${what} for ${route.route}`);
  }
  html = setStructuredData(html, route.structuredData);
  if (route.prerender) html = setRoot(html, route.prerender);
  return addHeadTags(html, [
    ...(route.noindex ? ['<meta name="robots" content="noindex" />'] : []),
    ...headTags,
  ]);
}

/** The root document keeps its hand-written metadata and gains the site graph and text. */
export function rootDocument(shell, manifest, { essays = [], headTags = [] } = {}) {
  // Already escaped: it is read out of the shell's own attribute.
  const description = /<meta\s+name="description"\s+content="([^"]*)"/.exec(shell)?.[1] ?? "";
  const latest = essays.slice(0, 5);
  const body = [
    `<p>Digital Organism Theory</p><h1>${escapeHtml(HOME.title)}</h1><p>${escapeHtml(HOME.criticalLine)}</p>`,
    `<p>${description}</p>`,
    `<p>By ${link(ABOUT_ROUTE, AUTHOR_BYLINE)}. ${escapeHtml(AUTHOR.summary)}</p>`,
    `<p>${link(`${BOOK_ROUTE}/preface?path=start-where-you-live`, HOME.primaryAction)}</p>`,
    `<section id="consciousness-101"><p>${escapeHtml(HOME.culture.eyebrow)}</p><h2>${escapeHtml(HOME.culture.title)}</h2><p>${escapeHtml(HOME.culture.critique)}</p><p>${escapeHtml(HOME.culture.questions)}</p><p><strong>${escapeHtml(HOME.culture.challenge)}</strong></p><p>${escapeHtml(HOME.culture.loveLabel)}</p><p>${escapeHtml(HOME.culture.loveIntro)}</p><blockquote><p>${escapeHtml(HOME.loveDefinition)}</p></blockquote><p>${escapeHtml(HOME.culture.reflection)}</p><p>${link(HOME.culture.ammPath, `${HOME.culture.ammKicker} ${HOME.culture.ammTitle}`)} · ${link(HOME.culture.sourcePath, `${HOME.culture.sourceKicker} · ${HOME.culture.sourceTitle}`)}</p></section>`,
    `<h2>Questions for inquiry</h2>${HOME.critiques.map(concept => `<h3>${escapeHtml(concept.term)}</h3><p>${escapeHtml(concept.text)}</p><p>${concept.rejected ? "DOT rejects" : "Outside perspective"} · Model</p>${concept.source ? `<cite>${concept.sourceHref ? link(concept.sourceHref, concept.source) : escapeHtml(concept.source)}</cite>` : ""}`).join("")}`,
    `<h2>Book One</h2>${contentsList(manifest)}`,
    latest.length > 0
      ? `<h2>Essays</h2><ol>${latest.map((essay) => `<li>${link(`${ESSAYS_ROUTE}/${essay.slug}`, essay.title)}</li>`).join("")}</ol>`
      : "",
  ].join("");
  let html = setStructuredData(shell, siteStructuredData(manifest));
  html = setRoot(html, prerenderArticle(body, essays.length > 0));
  return addHeadTags(html, headTags);
}

/**
 * One sitemap over every public entry point. Pages are dated by what they
 * hold (the release, or an essay's own date) rather than by the build: a
 * lastmod that moved on every deploy would be noise.
 */
export function sitemapXml(routes, lastmod) {
  const urls = [{ route: "/" }, ...routes.filter((route) => !route.noindex && !route.canonicalRoute)].map(
    (entry) =>
      `  <url>\n    <loc>${pageUrl(entry.route)}</loc>\n    <lastmod>${entry.lastmod ?? lastmod}</lastmod>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function robotsTxt() {
  return [
    "# The whole public reading surface is open. Nothing here is behind a wall.",
    "User-agent: *",
    "Allow: /",
    "",
    "# The publication studio is an owner tool, not a public page.",
    "Disallow: /studio",
    "# Where a reader-list message's leave link lands. There is nothing to index.",
    "Disallow: /readers/leave",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

const rfc822 = (isoDate) => new Date(`${isoDate}T00:00:00Z`).toUTCString();
// Feed readers resolve links against the feed, not the page, so root-relative
// links would point nowhere.
const absoluteLinks = (html) => html.replace(/(href|src)="\//g, `$1="${SITE_URL}/`);
const cdata = (html) => html.replaceAll("]]>", "]]]]><![CDATA[>");

/**
 * The essays as RSS 2.0: pulled by a reader's own software, newest first,
 * whole text included (L3, L4). Nothing in it tracks who reads.
 */
export function rssXml(essays, publication = null) {
  const items = essays.map((essay) =>
    [
      "    <item>",
      `      <title>${escapeHtml(essay.title)}</title>`,
      `      <link>${essayUrl(essay)}</link>`,
      `      <guid isPermaLink="true">${essayUrl(essay)}</guid>`,
      `      <dc:creator>${escapeHtml(AUTHOR.name)}</dc:creator>`,
      `      <pubDate>${rfc822(essay.published)}</pubDate>`,
      `      <description>${escapeHtml(essay.summary)}</description>`,
      `      <content:encoded><![CDATA[${cdata(absoluteLinks(coverHtml(essay.cover) + renderMarkdown(essay.body, { images: essay.images, post: true, restrictImages: essay.restrictImages })))}]]></content:encoded>`,
      "    </item>",
    ].join("\n"),
  );
  const newest = essays.reduce(
    (latest, essay) => [latest, essay.updated ?? essay.published].sort().at(-1),
    essays[0]?.published ?? null,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${escapeHtml(publication?.title ?? FEED_TITLE)}</title>`,
    `    <link>${pageUrl(publication?.route ?? BLOG_ROUTE)}</link>`,
    `    <atom:link href="${publication ? SITE_URL + publication.feed : FEED_URL}" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeHtml(publication?.description ?? BLOG.description)}</description>`,
    "    <language>en</language>",
    ...(newest ? [`    <lastBuildDate>${rfc822(newest)}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export async function fetchPublishedSiteCopy(apiUrl, { fetchImpl = fetch } = {}) {
  if (!apiUrl) return {};
  const response = await fetchImpl(`${apiUrl.replace(/\/$/, "")}/v1/site-content`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Cannot materialize published page copy (${response.status}).`);
  const { blocks } = await response.json();
  if (!blocks || typeof blocks !== "object" || Array.isArray(blocks)) throw new Error("Invalid published page copy.");
  return blocks;
}

async function main() {
  const manifest = JSON.parse(await readFile(RELEASE_MANIFEST, "utf8"));
  const shell = await readFile(path.join("dist", "index.html"), "utf8");
  const essays = readEssays();
  const writing = await fetchNativeWriting(process.env.VITE_ORCHESTRATOR_URL, {
    space: process.env.VITE_ACADEMY_SPACE_SLUG || "dot-academy",
  });
  const siteContent = await fetchPublishedSiteCopy(process.env.VITE_ORCHESTRATOR_URL);
  const routes = await publicRoutes(manifest, { essays, writing, siteContent });
  const feed = [
    ...visibleFileEssays(essays, writing),
    ...writing.filter(item => !item.withdrawn).map((item) => ({
      title: item.title,
      summary: item.summary,
      series: item.releases.at(-1)?.manifest?.presentation?.series,
      published: item.published,
      body: item.releases.at(-1).body,
      images: item.releases.at(-1).images,
      cover: item.cover,
      restrictImages: true,
      url: pageUrl(writingPublicPath(item)),
    })),
  ].sort((first, second) => second.published.localeCompare(first.published));
  const headTags = [feedLinkTag()];

  for (const entry of routes) {
    // Share cards are generated by scripts/generate_og_image.py and committed.
    // A route whose card was never generated shares the site card rather than
    // a URL that resolves to nothing. Resolve the full path: Book One's own
    // card lives beside, not inside, the chapter-card directory.
    const imageExists = entry.image?.startsWith("https://") ? true : entry.image
      ? await access(path.join("dist", ...entry.image.slice(1).split("/")))
          .then(() => true)
          .catch(() => false)
      : true;
    const route = entry.image && !imageExists
      ? { ...entry, image: undefined, imageAlt: undefined, imageWidth: undefined, imageHeight: undefined }
      : entry;
    if (route !== entry) {
      console.warn(`No share card for ${route.route}; falling back to the site card.`);
    }
    if (!routePattern.test(route.route)) {
      throw new Error(`Refusing to materialize an invalid public route: ${route.route}`);
    }
    const directory = path.join("dist", ...route.route.slice(1).split("/"));
    await mkdir(directory, { recursive: true });
    const routeHeadTags = route.route === AMM.route ? [...headTags, `<link rel="alternate" type="application/rss+xml" title="${escapeHtml(AMM.title)}" href="${SITE_URL}${AMM.feed}" />`] : headTags;
    await writeFile(path.join(directory, "index.html"), renderRoute(shell, route, { headTags: routeHeadTags }), "utf8");
  }

  await writeFile(
    path.join("dist", "index.html"),
    rootDocument(shell, manifest, { essays: visibleFileEssays(essays, writing), headTags }),
    "utf8",
  );
  await writeFile(
    path.join("dist", "sitemap.xml"),
    sitemapXml(routes, manifest.release.updated_at),
    "utf8",
  );
  await writeFile(path.join("dist", "robots.txt"), robotsTxt(), "utf8");
  // Readers can subscribe before the first piece is released. The blog's RSS
  // link must resolve even when its channel has no items yet.
  await writeFile(path.join("dist", "feed.xml"), rssXml(feed), "utf8");
  await mkdir(path.join("dist", "amm"), { recursive: true });
  await writeFile(path.join("dist", "amm", "feed.xml"), rssXml(feed.filter(item => item.series === AMM.series), AMM), "utf8");

  const indexed = routes.filter((route) => !route.noindex).length;
  console.log(
    `Materialized ${routes.length} public route entry points with their own text, a sitemap of ${indexed + 1} URLs, robots.txt, and an RSS feed of ${feed.length} pieces.`,
  );
}

export { publicRoutes, RELEASE_MANIFEST, SITE_URL, AUTHOR, AUTHOR_PROFILE };

if (process.argv[1]?.endsWith("materialize-public-routes.mjs")) {
  await main();
}
