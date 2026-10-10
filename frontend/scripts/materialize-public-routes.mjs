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
import { ESSAYS_ROUTE, readEssays } from "./essays.mjs";

const SITE_URL = "https://dotheory.org";
const BOOK_ROUTE = "/book/digital-organism-theory";
const ACADEMY_ROUTE = "/academy";
const ABOUT_ROUTE = "/about";
const CONTACT_ROUTE = "/contact";
const INBOX_ROUTE = "/studio/inbox";
const READERS_ROUTE = "/readers";
const PRIVACY_ROUTE = "/privacy";
const TERMS_ROUTE = "/terms";
const PUBLICATIONS_ROUTE = "/publications";
const BLOG_ROUTE = "/blog";
const WRITING_ROUTE = "/writing";

// Paths are relative to the frontend package, where the build runs.
const CONTENT_DIR = path.join("src", "content");
// The record the About page and siteConfig read too (src/content/author.ts).
const AUTHOR = JSON.parse(readFileSync(path.join(CONTENT_DIR, "author.json"), "utf8"));
const HOME = JSON.parse(readFileSync(path.join(CONTENT_DIR, "home.json"), "utf8"));
const ACADEMY = JSON.parse(readFileSync(path.join(CONTENT_DIR, "academy", "landing.json"), "utf8"));
const READERS = JSON.parse(readFileSync(path.join(CONTENT_DIR, "readers.json"), "utf8"));
const CONTACT = JSON.parse(readFileSync(path.join(CONTENT_DIR, "contact.json"), "utf8"));
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

const BOOK_DESCRIPTION =
  "Examine experience, inherited conditioning, meaningful choice, and development toward Love. Book One also develops DOT’s proposed wider architecture of consciousness and the physical universe, with its evidence boundaries in view.";

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
 * runs on plain Node against the built bundle and cannot import TypeScript;
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
const ACADEMY_ID = `${SITE_URL}${ACADEMY_ROUTE}#academy`;
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

const sectionUrl = (section) => `${SITE_URL}${BOOK_ROUTE}/${section.slug}`;
const conceptUrl = (concept) => `${SITE_URL}/doctrine/${concept.id}`;

/** The author: one entity with one @id, however many works name it. */
function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: AUTHOR.name,
    honorificSuffix: AUTHOR.suffix || undefined,
    url: `${SITE_URL}${ABOUT_ROUTE}`,
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
      item: `${SITE_URL}${entry.route}`,
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
    url: `${SITE_URL}${BOOK_ROUTE}`,
    author: personNode(),
    inLanguage: "en",
    isPartOf: { "@type": "BookSeries", name: project.series_title },
    bookEdition: edition,
    datePublished: release.published_at ?? undefined,
    dateModified: release.updated_at,
    isAccessibleForFree: true,
    hasPart: manifest.sections.map((section) => ({
      "@type": "Chapter",
      "@id": `${sectionUrl(section)}#chapter`,
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
        url: `${SITE_URL}${BOOK_ROUTE}/copy`,
        inLanguage: "en",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0.00",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}${BOOK_ROUTE}/copy`,
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
      "@id": `${conceptUrl(concept)}#concept`,
      name: concept.name,
      url: conceptUrl(concept),
    }));

  return {
    "@type": "Chapter",
    "@id": `${sectionUrl(section)}#chapter`,
    name: section.title,
    alternativeHeadline: section.subtitle ?? undefined,
    url: sectionUrl(section),
    position: section.order + 1,
    isPartOf: {
      "@id": BOOK_ID,
      "@type": "Book",
      name: manifest.project.title,
      url: `${SITE_URL}${BOOK_ROUTE}`,
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
    "@id": `${conceptUrl(concept)}#concept`,
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
    url: `${SITE_URL}/doctrine`,
    hasDefinedTerm: DOCTRINE_CONCEPTS.map((concept) => ({
      "@type": "DefinedTerm",
      "@id": `${conceptUrl(concept)}#concept`,
      name: concept.name,
      url: conceptUrl(concept),
    })),
  };
}

function academyNode() {
  return {
    "@type": "CollectionPage",
    "@id": ACADEMY_ID,
    name: "DOT Academy",
    description: ACADEMY.description,
    url: `${SITE_URL}${ACADEMY_ROUTE}`,
    inLanguage: "en",
    about: { "@type": "Thing", name: "Digital Organism Theory" },
    hasPart: [
      { "@id": CONCEPT_SET_ID, "@type": "DefinedTermSet" },
      { "@id": `${SITE_URL}/applied#page`, "@type": "WebPage" },
    ],
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
        { "@id": ACADEMY_ID, "@type": "CollectionPage" },
        { "@id": BOOK_ID, "@type": "Book" },
      ],
    },
    academyNode(),
    bookNode(manifest),
  );
}

function webPageNode(route) {
  return {
    "@type": "WebPage",
    "@id": `${SITE_URL}${route.route}#page`,
    name: route.title,
    description: route.description,
    url: `${SITE_URL}${route.route}`,
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
    url: `${SITE_URL}${ABOUT_ROUTE}`,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}#website` },
    mainEntity: personNode(),
  };
}

const ESSAYS_DESCRIPTION = `Essays by ${AUTHOR.name} that develop Digital Organism Theory beyond Book One, each stating the claim levels it uses.`;
const FEED_URL = `${SITE_URL}/feed.xml`;
const FEED_TITLE = `Writing by ${AUTHOR.name}`;

const essayUrl = (essay) => essay.url ?? `${SITE_URL}${ESSAYS_ROUTE}/${essay.slug}`;
const writingPath = (item, release) => `${WRITING_ROUTE}/${item.id}${release ? `/releases/${release}` : ""}`;

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
  const catalog = await get(`/delivery/catalog?space=${encodeURIComponent(space)}`);
  const latest = catalog.filter((entry) => entry.kind === "essay" && !entry.withdrawn_at);
  return Promise.all(
    latest.map(async (entry) => {
      const releases = [];
      for (let number = 1; number <= entry.release_number; number += 1) {
        const delivery = await get(`/delivery/works/${encodeURIComponent(entry.work_id)}/releases/${number}`);
        if (delivery.withdrawn) continue;
        if (!delivery.manifest || !delivery.body_ref) throw new Error(`Release ${number} of ${entry.work_id} is incomplete.`);
        const body = await get(`/delivery/body/${delivery.body_ref.split("/").map(encodeURIComponent).join("/")}`, true);
        releases.push({ number, manifest: delivery.manifest, body });
      }
      return {
        id: entry.work_id,
        title: entry.title,
        summary: entry.summary ?? "",
        published: entry.released_at.slice(0, 10),
        releases,
      };
    }),
  ).then((items) => items.filter((item) => item.releases.length > 0).reverse());
}

function conceptTerms(ids) {
  return ids
    .map((id) => DOCTRINE_CONCEPTS.find((concept) => concept.id === id))
    .filter(Boolean)
    .map((concept) => ({
      "@type": "DefinedTerm",
      "@id": `${conceptUrl(concept)}#concept`,
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
export function renderMarkdown(markdown) {
  return renderToStaticMarkup(
    createElement(ReactMarkdown, {
      skipHtml: true,
      remarkPlugins: [remarkGfm, remarkMath, remarkDepthPassages],
      rehypePlugins: [[rehypeKatex, { output: "mathml" }]],
      children: markdown,
    }),
  );
}

const link = (href, label, downloadFilename) =>
  `<a href="${escapeHtml(href)}"${downloadFilename ? ` download="${escapeHtml(downloadFilename)}"` : ""}>${escapeHtml(label)}</a>`;
const titleOf = (route) => route.title.split(" — ")[0];

function siteNav(essaysPublished) {
  const entries = [
    ["/", "Home"],
    [BOOK_ROUTE, "Book One"],
    ["/doctrine", "Concept map"],
    ["/applied", "Open questions"],
    [ACADEMY_ROUTE, "DOT Academy"],
    [BLOG_ROUTE, "Blog"],
    [PUBLICATIONS_ROUTE, "Books"],
    ...(essaysPublished ? [["/feed.xml", "RSS"]] : []),
    [ABOUT_ROUTE, "About"],
    [CONTACT_ROUTE, "Contact"],
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

function contentsList(manifest) {
  return `<ol>${manifest.sections
    .map((section) => `<li>${link(`${BOOK_ROUTE}/${section.slug}`, section.title)}</li>`)
    .join("")}</ol>`;
}

function authorContactLink() {
  const email = AUTHOR.email.trim();
  return email ? link(`mailto:${email}`, email) : link(AUTHOR.links.linkedin, "LinkedIn");
}

async function publicRoutes(manifest, { essays = readEssays(), writing = [] } = {}) {
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
          `<h1>${escapeHtml(manifest.project.title)}</h1><p>${escapeHtml(manifest.project.subtitle)} · ${link(ABOUT_ROUTE, AUTHOR.name)}</p><p>${escapeHtml(BOOK_DESCRIPTION)}</p><h2>Contents</h2>${contentsList(manifest)}`,
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
          `${heading}<p>Payments are taken by Stripe, which emails the receipt. A payment buys no access, membership, or standing. Who runs the site, the refund policy, and a contact address: ${link(TERMS_ROUTE, "Terms and refunds")}.</p>`,
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
          academyNode(),
          breadcrumb([home, { name: "DOT Academy", route: ACADEMY_ROUTE }]),
        ),
        prerender: page(
          `<p>DOT Academy · In development</p><h1>${escapeHtml(ACADEMY.heading.join(" "))}</h1><p>${escapeHtml(ACADEMY.introduction)}</p><p>${link(ACADEMY.start.href, ACADEMY.start.label)}</p><p>${link("/doctrine", "Explore the concept map")} · ${link("/applied", "Review open questions")}</p><aside><p>${escapeHtml(ACADEMY.hypothesis.label)}</p><h2>${escapeHtml(ACADEMY.hypothesis.heading)}</h2><p>${escapeHtml(ACADEMY.hypothesis.body)}</p><p>${link(ACADEMY.hypothesis.sourceHref, ACADEMY.hypothesis.sourceLabel)}</p></aside><h2>${escapeHtml(ACADEMY.publication.heading)}</h2><p>${escapeHtml(ACADEMY.publication.body)}</p><p>${link(BOOK_ROUTE, "Open the released edition")}</p>`,
        ),
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
    {
      route: INBOX_ROUTE,
      title: `Contact inbox — ${AUTHOR.name}`,
      description: "Sign in with the site owner's account to review and reply to private inquiries.",
      noindex: true,
      structuredData: graph({
        "@type": "WebPage",
        "@id": `${SITE_URL}${INBOX_ROUTE}#page`,
        url: `${SITE_URL}${INBOX_ROUTE}`,
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
          `<p>${escapeHtml(BUILDER.summary)}</p>`,
          `<p>${link(`${CONTACT_ROUTE}?purpose=project`, "Discuss a project")}</p>`,
          `<p>${link("#about-resume", "Explore the background")}</p>`,
          `<aside><p>Research depth. Product experience.</p><dl><dt>Applied AI research</dt><dd>${escapeHtml(CAREER.experience[0].company)} — ${escapeHtml(CAREER.experience[0].role)}</dd><dt>Product co-founding</dt><dd>Sullix — Hands-on architecture and engineering</dd>${AUTHOR.credentials[0] ? `<dt>Research foundation</dt><dd>${escapeHtml(AUTHOR.credentials[0].degree)} — ${escapeHtml(AUTHOR.credentials[0].institution)}</dd>` : ""}</dl><p>Based in ${escapeHtml(CAREER.location)}</p></aside>`,
          `<nav aria-label="On this page">${link("#about-products", "Selected work")} · ${link("#about-services", "Ways to work together")} · ${link("#about-resume", "Career & résumé")} · ${link("#about-contact", "Contact")}</nav>`,
          '<h2 id="about-products">Selected work</h2>',
          `<ul>${BUILDER_PROJECTS.map((project) => {
            const href = project.links.live || project.links.website || project.links.repo;
            const label = project.links.live ? "Explore project" : project.links.website ? "Visit website" : "View source";
            const showcase = project.showcase ? `<div><img src="${escapeHtml(project.showcase.brandMark)}" alt="Sullix mark" width="200" height="200"><img src="${escapeHtml(project.showcase.mark)}" alt="Faro mark" width="160" height="160"><p>${escapeHtml(project.showcase.agentName)} — ${escapeHtml(project.showcase.agentRole)}</p></div>` : "";
            return `<li id="project-${escapeHtml(project.slug)}"><h3>${escapeHtml(project.name)}</h3>${showcase}<p>${escapeHtml(project.role)}</p><p>${escapeHtml(project.period)}</p><p>${escapeHtml(project.tagline)}</p><p>${escapeHtml(project.description)}</p>${href ? link(href, `${label}: ${project.name}`) : ""}</li>`;
          }).join("")}</ul>`,
          OTHER_BUILDER_PROJECTS.map((project) => `<p>Also in open source: ${link(project.links.repo, project.name)}. Isolation for AI agent tools.</p>`).join(""),
          '<h2 id="about-services">Ways to work together</h2>',
          BUILDER.services.map((service) => `<h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p><p>${escapeHtml(service.deliverable)}</p>`).join(""),
          '<h2 id="about-resume">Career & résumé</h2>',
          `<ol>${CAREER.experience.map((job) => `<li><p>${escapeHtml(job.period)}</p><h3>${escapeHtml(job.company)}</h3><p>${escapeHtml(job.role)}</p><p>${escapeHtml(job.summary)}</p></li>`).join("")}</ol>`,
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
      body: `<p>${escapeHtml(READERS.title)}</p><h1>${escapeHtml(READERS.heading)}</h1><p>${escapeHtml(READERS.description)}</p><ul>${READERS.topics.map(topic => `<li><h2>${escapeHtml(topic.label)}</h2><p>${escapeHtml(topic.description)}</p></li>`).join("")}</ul><h2>${escapeHtml(READERS.formTitle)}</h2><p>${escapeHtml(READERS.formDescription)}</p><p>The signup form needs JavaScript. Everything published remains available without joining.</p><ul>${READERS.commitments.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p>${link(PRIVACY_ROUTE, "How addresses are kept")} · ${link(BLOG_ROUTE, "Browse the writing")}</p>`,
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
      title: "Privacy — Digital Organism Theory",
      description:
        "What this site keeps, what it never collects, and which services handle what.",
      body: renderMarkdown(privacyText),
    },
    {
      route: TERMS_ROUTE,
      title: "Terms and refunds — Digital Organism Theory",
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
      const concepts = essay.concepts
        .map((id) => DOCTRINE_CONCEPTS.find((concept) => concept.id === id))
        .map((concept) => `<li>${link(`/doctrine/${concept.id}`, concept.name)}</li>`)
        .join("");
      return {
        route,
        title: `${essay.title} — ${AUTHOR.name}`,
        description: essay.summary,
        ogType: "article",
        lastmod: essay.updated ?? essay.published,
        structuredData: graph(
          articleNode(essay),
          breadcrumb([home, { name: "Blog", route: BLOG_ROUTE }, { name: essay.title, route }]),
        ),
        prerender: page(
          [
            `<p>${link(BLOG_ROUTE, "All writing")}</p>`,
            `<header><p>Essay by ${link(ABOUT_ROUTE, AUTHOR.name)} · <time datetime="${essay.published}">${essay.published}</time> · Claim levels: ${essay.levels.join(", ")}</p>`,
            `<h1>${escapeHtml(essay.title)}</h1><p>${escapeHtml(essay.summary)}</p></header>`,
            renderMarkdown(essay.body),
            "<p>End of essay</p>",
            concepts ? `<h2>Builds on</h2><ul>${concepts}</ul>` : "",
            `<p>${link(BLOG_ROUTE, "All writing")}</p>`,
          ].join(""),
        ),
      };
    }),
  ];

  const writingRoutes = writing.flatMap((item) => {
    const pages = item.releases.map((release) => ({ path: writingPath(item, release.number), release }));
    pages.push({ path: writingPath(item), release: item.releases.at(-1) });
    return pages.map(({ path: route, release }) => {
      const { manifest: delivered, body } = release;
      const sources = delivered.sources ?? [];
      return {
        route,
        title: `${delivered.title} — ${AUTHOR.name}`,
        description: delivered.summary || `${delivered.title}, by ${AUTHOR.name}.`,
        ogType: "article",
        lastmod: item.published,
        structuredData: graph(
          articleNode({ ...item, title: delivered.title, summary: delivered.summary ?? "", url: `${SITE_URL}${route}`, concepts: [] }),
          breadcrumb([home, { name: "Blog", route: BLOG_ROUTE }, { name: delivered.title, route }]),
        ),
        prerender: page(
          [
            `<p>${link(BLOG_ROUTE, "All writing")}</p>`,
            `<header><p>By ${link(ABOUT_ROUTE, AUTHOR.name)} · Version ${release.number}</p>`,
            `<h1>${escapeHtml(delivered.title)}</h1>${delivered.summary ? `<p>${escapeHtml(delivered.summary)}</p>` : ""}</header>`,
            renderMarkdown(body),
            "<p>End of piece</p>",
            `<h2>Claims</h2><ul>${delivered.claims.map((claim) => `<li>${escapeHtml(claim.statement)} (${escapeHtml(claim.epistemic_level)})</li>`).join("")}</ul>`,
            sources.length > 0
              ? `<h2>Sources</h2><ul>${sources.map((source) => `<li>${/^https?:\/\//i.test(source.external_uri) ? link(source.external_uri, source.external_uri) : escapeHtml(source.external_uri)}</li>`).join("")}</ul>`
              : "",
            `<p>${link(BLOG_ROUTE, "All writing")}</p>`,
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
        `<p>${link(BLOG_ROUTE, "Letters and essays")}</p>`,
      ].join(""),
    ),
  };

  const blogPosts = [
    ...essays.map((essay) => ({ title: essay.title, summary: essay.summary, date: essay.published, href: `${ESSAYS_ROUTE}/${essay.slug}` })),
    ...writing.map((item) => ({ title: item.title, summary: item.summary, date: item.published, href: writingPath(item) })),
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
        `<section aria-label="Building and inquiry">${BLOG.paths.map((entry) => `<p>${escapeHtml(entry.label)}</p><h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.description)}</p><p>${link(entry.to, entry.linkLabel)}</p>`).join("")}</section>`,
        `<section><p>A series · Applied DOT</p><h2>${escapeHtml(NEWSLETTER.title)}</h2><p>${escapeHtml(BLOG.seriesDescription)}</p><p>These letters are published on LinkedIn.</p>`,
        NEWSLETTER.editions.length > 0
          ? `<ul aria-label="Letters on LinkedIn">${NEWSLETTER.editions.map((edition) => `<li>${link(edition.url, edition.title)}<p>Read on LinkedIn</p></li>`).join("")}</ul>`
          : "",
        `<p>${link(NEWSLETTER.url, "Explore the series on LinkedIn")}</p></section>`,
        "<h2>Latest writing</h2><p>Newest first</p>",
        blogPosts.length > 0
          ? `<ol>${blogPosts.map((post) => `<li>${link(post.href, post.title)} (<time datetime="${post.date}">${post.date}</time>)${post.summary ? `: ${escapeHtml(post.summary)}` : ""}</li>`).join("")}</ol><p>That is everything posted here so far.</p>`
          : `<p>${escapeHtml(BLOG.emptyTitle)}</p><p>${escapeHtml(BLOG.emptyDescription)}</p>`,
        `<h2>Read at your pace.</h2><p>${escapeHtml(BLOG.followDescription)}</p><p>${link(FEED_URL, "Follow with RSS")} · ${link(READERS_ROUTE, "Open the reader list")}</p>`,
        `<h2>${escapeHtml(BLOG.contactTitle)}</h2><p>${escapeHtml(BLOG.contactDescription)}</p><p>${link(`${CONTACT_ROUTE}?purpose=project`, "Discuss a project")}</p><p>${link(`${ABOUT_ROUTE}#about-resume`, "Background & résumé")}</p>`,
      ].join(""),
    ),
  };

  return [...staticRoutes, blogRoute, publicationsRoute, ...authorRoutes, ...essayRoutes, ...writingRoutes, ...sectionRoutes, ...conceptRoutes];
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
  const url = `${SITE_URL}${route.canonicalRoute ?? route.route}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const image = `${SITE_URL}${route.image ?? "/og-image.png"}`;
  const imageAlt = escapeHtml(
    route.imageAlt ?? "DOT — Consciousness: A Digital Organism, Book One",
  );
  const tags = [
    [/<title>.*?<\/title>/, `<title>${title}</title>`, "title"],
    [/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`, "description"],
    [/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`, "canonical"],
    [/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`, "og:url"],
    [/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`, "og:title"],
    [/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`, "og:description"],
    [/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`, "twitter:title"],
    [/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`, "twitter:description"],
    [/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${image}" />`, "og:image"],
    [/<meta property="og:image:alt" content="[^"]*"\s*\/>/, `<meta property="og:image:alt" content="${imageAlt}" />`, "og:image:alt"],
    [/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${image}" />`, "twitter:image"],
    [/<meta property="og:type" content="[^"]*"\s*\/>/, `<meta property="og:type" content="${route.ogType ?? "website"}" />`, "og:type"],
  ];

  let html = shell;
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
    `<p>Digital Organism Theory</p><h1>${escapeHtml(HOME.title)}</h1><p>${escapeHtml(HOME.subtitle)} <strong>${escapeHtml(HOME.interpretation)}</strong><br>${escapeHtml(HOME.criticalLine)}</p>`,
    `<p>${description}</p>`,
    `<p>By ${link(ABOUT_ROUTE, AUTHOR_BYLINE)}. ${escapeHtml(AUTHOR.summary)}</p>`,
    `<p>${link(`${BOOK_ROUTE}/preface?path=start-where-you-live`, HOME.primaryAction)}</p>`,
    `<h2>Questions for inquiry</h2>${HOME.critiques.map(concept => `<h3>${escapeHtml(concept.term)}</h3><p>${escapeHtml(concept.text)}</p><p>${concept.rejected ? "DOT rejects" : "Outside perspective"} · Model</p>${concept.source ? `<cite>${concept.sourceHref ? link(concept.sourceHref, concept.source) : escapeHtml(concept.source)}</cite>` : ""}`).join("")}`,
    `<h2>Consciousness 101</h2><blockquote><p>${escapeHtml(HOME.loveDefinition)}</p><cite>${link(HOME.sourcePath, HOME.sourceLabel)}</cite></blockquote>`,
    `<h2>${escapeHtml(HOME.invitationTitle)}</h2><p>${escapeHtml(HOME.invitation)}</p><p>${escapeHtml(HOME.boundary)}</p><p>${escapeHtml(HOME.edition)}</p>`,
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
      `  <url>\n    <loc>${SITE_URL}${entry.route === "/" ? "/" : entry.route}</loc>\n    <lastmod>${entry.lastmod ?? lastmod}</lastmod>\n  </url>`,
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
export function rssXml(essays) {
  const items = essays.map((essay) =>
    [
      "    <item>",
      `      <title>${escapeHtml(essay.title)}</title>`,
      `      <link>${essayUrl(essay)}</link>`,
      `      <guid isPermaLink="true">${essayUrl(essay)}</guid>`,
      `      <dc:creator>${escapeHtml(AUTHOR.name)}</dc:creator>`,
      `      <pubDate>${rfc822(essay.published)}</pubDate>`,
      `      <description>${escapeHtml(essay.summary)}</description>`,
      `      <content:encoded><![CDATA[${cdata(absoluteLinks(renderMarkdown(essay.body)))}]]></content:encoded>`,
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
    `    <title>${escapeHtml(FEED_TITLE)}</title>`,
    `    <link>${SITE_URL}${BLOG_ROUTE}</link>`,
    `    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeHtml(BLOG.description)}</description>`,
    "    <language>en</language>",
    ...(newest ? [`    <lastBuildDate>${rfc822(newest)}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

async function main() {
  const manifest = JSON.parse(await readFile(RELEASE_MANIFEST, "utf8"));
  const shell = await readFile(path.join("dist", "index.html"), "utf8");
  const essays = readEssays();
  const writing = await fetchNativeWriting(process.env.VITE_ORCHESTRATOR_URL, {
    space: process.env.VITE_ACADEMY_SPACE_SLUG || "dot-academy",
  });
  const routes = await publicRoutes(manifest, { essays, writing });
  const feed = [
    ...essays,
    ...writing.map((item) => ({
      title: item.title,
      summary: item.summary,
      published: item.published,
      body: item.releases.at(-1).body,
      url: `${SITE_URL}${writingPath(item)}`,
    })),
  ].sort((first, second) => second.published.localeCompare(first.published));
  const headTags = [feedLinkTag()];

  for (const entry of routes) {
    // Share cards are generated by scripts/generate_og_image.py and committed.
    // A route whose card was never generated shares the site card rather than
    // a URL that resolves to nothing. Resolve the full path: Book One's own
    // card lives beside, not inside, the chapter-card directory.
    const imageExists = entry.image
      ? await access(path.join("dist", ...entry.image.slice(1).split("/")))
          .then(() => true)
          .catch(() => false)
      : true;
    const route = entry.image && !imageExists
      ? { ...entry, image: undefined, imageAlt: undefined }
      : entry;
    if (route !== entry) {
      console.warn(`No share card for ${route.route}; falling back to the site card.`);
    }
    if (!routePattern.test(route.route)) {
      throw new Error(`Refusing to materialize an invalid public route: ${route.route}`);
    }
    const directory = path.join("dist", ...route.route.slice(1).split("/"));
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), renderRoute(shell, route, { headTags }), "utf8");
  }

  await writeFile(
    path.join("dist", "index.html"),
    rootDocument(shell, manifest, { essays, headTags }),
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

  const indexed = routes.filter((route) => !route.noindex).length;
  console.log(
    `Materialized ${routes.length} public route entry points with their own text, a sitemap of ${indexed + 1} URLs, robots.txt, and an RSS feed of ${feed.length} pieces.`,
  );
}

export { publicRoutes, RELEASE_MANIFEST, SITE_URL, AUTHOR, AUTHOR_PROFILE };

if (process.argv[1]?.endsWith("materialize-public-routes.mjs")) {
  await main();
}
