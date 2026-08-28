import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://dotheory.org";
const BOOK_ROUTE = "/book/digital-organism-theory";
// Mirrors siteConfig.social.linkedin. Search engines resolve an author entity
// through profiles it already knows, so the book's structured data carries it.
// `materialize-public-routes.test.ts` fails if the two ever disagree.
const AUTHOR_PROFILE =
  "https://www.linkedin.com/in/henok-ghebrechristos-phd-793a1135";
const RELEASE_MANIFEST = path.join(
  "public",
  "publications",
  "henok",
  "digital-organism-theory",
  "v3",
  "manifest.json",
);

const BOOK_DESCRIPTION =
  "Read Digital Organism Theory's foundational architecture of consciousness, physical law, biology, and lived experience with its evidence boundaries in view.";

const STATIC_ROUTES = [
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
    description: "Fund the reader, grounded research companion, and public development of DOT without advertising.",
  },
  {
    route: BOOK_ROUTE,
    title: "Consciousness: A Digital Organism — Book One",
    description: BOOK_DESCRIPTION,
  },
  {
    route: `${BOOK_ROUTE}/copy`,
    title: "Digital Edition — Consciousness: A Digital Organism",
    description: "Purchase the authenticated digital edition of Digital Organism Theory Book One.",
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

const routePattern = /^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/;

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

const sectionUrl = (section) => `${SITE_URL}${BOOK_ROUTE}/${section.slug}`;
const conceptUrl = (concept) => `${SITE_URL}/doctrine/${concept.id}`;

function personNode(manifest) {
  return {
    "@type": "Person",
    name: manifest.project.author,
    url: SITE_URL,
    sameAs: [AUTHOR_PROFILE],
  };
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
    author: personNode(manifest),
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
        author: personNode(manifest),
        bookEdition: edition,
        bookFormat: "https://schema.org/EBook",
        encodingFormat: "application/pdf",
        url: `${SITE_URL}${BOOK_ROUTE}/copy`,
        inLanguage: "en",
        isAccessibleForFree: false,
        offers: {
          "@type": "Offer",
          price: "20.00",
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
    author: personNode(manifest),
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

const graph = (...nodes) => ({ "@context": "https://schema.org", "@graph": nodes });

/** What the site is, for a crawler that only ever sees the root document. */
function siteStructuredData(manifest) {
  return graph(
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: "Digital Organism Theory",
      alternateName: "DOT",
      url: SITE_URL,
      inLanguage: "en",
      author: personNode(manifest),
      about: { "@id": BOOK_ID },
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
    url: `${SITE_URL}${route.route}`,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}#website` },
  };
}

async function publicRoutes(manifest) {
  const home = { name: "DOT", route: "/" };
  const book = { name: manifest.project.title, route: BOOK_ROUTE };

  const sectionRoutes = manifest.sections.map((section) => ({
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
  }));

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
  }));

  const staticRoutes = STATIC_ROUTES.map((route) => {
    if (route.route === BOOK_ROUTE) {
      return {
        ...route,
        ogType: "book",
        structuredData: graph(bookNode(manifest), breadcrumb([home, book])),
      };
    }
    if (route.route === "/doctrine") {
      return {
        ...route,
        structuredData: graph(
          conceptSetNode(),
          breadcrumb([home, { name: "Concept map", route: "/doctrine" }]),
        ),
      };
    }
    return {
      ...route,
      structuredData: graph(
        webPageNode(route),
        breadcrumb([home, { name: route.title.split(" — ")[0], route: route.route }]),
      ),
    };
  });

  return [...staticRoutes, ...sectionRoutes, ...conceptRoutes];
}

function setStructuredData(html, structuredData) {
  const materialized = html.replace(
    /<script type="application\/ld\+json" id="dot-structured-data">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="dot-structured-data">\n${serializeStructuredData(structuredData)}\n    </script>`,
  );
  if (materialized === html) {
    throw new Error("Failed to place structured data: the shell has no dot-structured-data block");
  }
  return materialized;
}

function setMeta(shell, route) {
  const url = `${SITE_URL}${route.route}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const image = `${SITE_URL}${route.image ?? "/og-image.png"}`;
  const imageAlt = escapeHtml(
    route.imageAlt ?? "DOT — Consciousness: A Digital Organism, Book One",
  );
  const materialized = shell
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${url}" />`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${url}" />`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${title}" />`,
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${description}" />`,
    )
    .replace(
      /<meta property="og:image" content="[^"]*"\s*\/>/,
      `<meta property="og:image" content="${image}" />`,
    )
    .replace(
      /<meta property="og:image:alt" content="[^"]*"\s*\/>/,
      `<meta property="og:image:alt" content="${imageAlt}" />`,
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/>/,
      `<meta name="twitter:image" content="${image}" />`,
    )
    .replace(
      /<meta property="og:type" content="[^"]*"\s*\/>/,
      `<meta property="og:type" content="${route.ogType ?? "website"}" />`,
    );

  if (!materialized.includes(`<link rel="canonical" href="${url}" />`)) {
    throw new Error(`Failed to update metadata for ${route.route}`);
  }
  if (!materialized.includes(`<meta property="og:image" content="${image}" />`)) {
    throw new Error(`Failed to set the share card for ${route.route}`);
  }
  return setStructuredData(materialized, route.structuredData);
}

/**
 * One sitemap over every public entry point, dated by the release rather than
 * by the build: the pages change when the manuscript does, and a lastmod that
 * moved on every deploy would be noise.
 */
export function sitemapXml(routes, lastmod) {
  const urls = ["/", ...routes.map((route) => route.route)].map(
    (route) =>
      `  <url>\n    <loc>${SITE_URL}${route === "/" ? "/" : route}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
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
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

async function main() {
  const manifest = JSON.parse(await readFile(RELEASE_MANIFEST, "utf8"));
  const shell = await readFile(path.join("dist", "index.html"), "utf8");
  const routes = await publicRoutes(manifest);
  // Chapter cards are generated by scripts/generate_og_image.py and committed.
  // A route whose card was never generated shares the site card rather than a
  // URL that resolves to nothing.
  const cards = new Set(await readdir(path.join("dist", "og", "book")).catch(() => []));

  for (const entry of routes) {
    const route =
      entry.image && !cards.has(path.basename(entry.image))
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
    await writeFile(path.join(directory, "index.html"), setMeta(shell, route), "utf8");
  }

  // The root document keeps its hand-written copy and gains the site graph.
  await writeFile(
    path.join("dist", "index.html"),
    setStructuredData(shell, siteStructuredData(manifest)),
    "utf8",
  );

  await writeFile(
    path.join("dist", "sitemap.xml"),
    sitemapXml(routes, manifest.release.updated_at),
    "utf8",
  );
  await writeFile(path.join("dist", "robots.txt"), robotsTxt(), "utf8");

  console.log(
    `Materialized ${routes.length} public route entry points, a sitemap of ${routes.length + 1} URLs, and robots.txt.`,
  );
}

export { publicRoutes, RELEASE_MANIFEST, SITE_URL, AUTHOR_PROFILE };

if (process.argv[1]?.endsWith("materialize-public-routes.mjs")) {
  await main();
}
