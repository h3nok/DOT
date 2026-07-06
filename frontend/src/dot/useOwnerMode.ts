import { useEffect, useState } from "react";

/**
 * useOwnerMode — a minimal gate for authoring.
 *
 * The graph is editable, but only its owner should see Edit. Until real
 * authentication lands, this is a lightweight gate: visiting with `?owner=1`
 * (or `#owner`) enables owner mode and remembers it; `?owner=0` clears it.
 * Visitors never see authoring affordances. This is intentionally not security
 * — it hides owner UI from the public, and real auth replaces it before any
 * write reaches a server.
 */

const OWNER_KEY = "dot-owner";

const readOwner = (): boolean => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const flag = params.get("owner");
  if (flag === "1" || window.location.hash === "#owner") {
    window.localStorage.setItem(OWNER_KEY, "1");
    return true;
  }
  if (flag === "0") {
    window.localStorage.removeItem(OWNER_KEY);
    return false;
  }
  return window.localStorage.getItem(OWNER_KEY) === "1";
};

export function useOwnerMode(): boolean {
  const [owner, setOwner] = useState<boolean>(readOwner);

  useEffect(() => {
    const sync = () => setOwner(readOwner());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return owner;
}
