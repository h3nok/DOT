import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BOOK_ROUTE = "/book/digital-organism-theory";
const RELEASE_MANIFEST = path.join(
  "public",
  "publications",
  "henok",
  "digital-organism-theory",
  "v2",
  "manifest.json",
);

const STATIC_ROUTES = [
  {
    route: "/applied",
    title: "Open Questions — Digital Organism Theory",
    description: "The evidence boundaries, open seams, and strongest alternatives in DOT Book One.",
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
    description: "Read Book One of Digital Organism Theory with its evidence boundaries, references, and concept trails in view.",
  },
  {
    route: `${BOOK_ROUTE}/copy`,
    title: "Digital Edition — Consciousness: A Digital Organism",
    description: "Download the branded digital edition of Digital Organism Theory Book One.",
  },
];

const DOCTRINE_NODE_IDS = [
  "subjective-data",
  "digital-organism",
  "big-c",
  "little-c",
  "decoupling-principle",
  "reality-frame",
  "reality-stream",
  "intent",
  "experience-loop",
  "canvas",
  "painting",
  "character",
  "fear-gating",
  "love",
  "conscious-authorship",
  "limits-and-debts",
];

const routePattern = /^\/[a-z0-9]+(?:\/[a-z0-9-]+)*$/;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function publicRoutes() {
  const manifest = JSON.parse(await readFile(RELEASE_MANIFEST, "utf8"));
  const sectionRoutes = manifest.sections.map((section) => ({
    route: `${BOOK_ROUTE}/${section.slug}`,
    title: `${section.title} — Consciousness: A Digital Organism`,
    description:
      section.subtitle ??
      `Read ${section.title} in Digital Organism Theory Book One.`,
  }));
  const doctrineRoutes = DOCTRINE_NODE_IDS.map((id) => ({
    route: `/doctrine/${id}`,
    title: "Book One Concept Map — Digital Organism Theory",
    description: "Read this concept in context and trace it to its source in DOT Book One.",
  }));
  return [...STATIC_ROUTES, ...sectionRoutes, ...doctrineRoutes];
}

function setMeta(shell, route) {
  const url = `https://dotheory.org${route.route}`;
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
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
    );

  if (!materialized.includes(`<link rel="canonical" href="${url}" />`)) {
    throw new Error(`Failed to update metadata for ${route.route}`);
  }
  return materialized;
}

async function main() {
  const shell = await readFile(path.join("dist", "index.html"), "utf8");
  const routes = await publicRoutes();

  for (const route of routes) {
    if (!routePattern.test(route.route)) {
      throw new Error(`Refusing to materialize an invalid public route: ${route.route}`);
    }
    const directory = path.join("dist", ...route.route.slice(1).split("/"));
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), setMeta(shell, route), "utf8");
  }

  console.log(`Materialized ${routes.length} public route entry points.`);
}

await main();
