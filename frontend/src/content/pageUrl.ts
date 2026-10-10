const SITE_URL = import.meta.env.VITE_SITE_URL || "https://dotheory.org";

/**
 * A page's public address, in the form the build declares canonical: each
 * route is served from <route>/index.html, and the host redirects the
 * address without the trailing slash (scripts/materialize-public-routes.mjs).
 */
export function pageUrl(route: string): string {
  const path = route === "/" ? "/" : `${route.replace(/\/$/, "")}/`;
  return new URL(path, SITE_URL).href;
}
