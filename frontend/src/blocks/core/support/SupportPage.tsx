import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";

import { SupportSurface } from "../../../dot/SupportSurface";

/**
 * The support ask as its own address.
 *
 * Support used to be reachable only by drilling into a limb that visitors never
 * saw, which meant the one funding path the movement has could not be linked,
 * shared, or arrived at from outside. Giving it a route costs nothing and makes
 * the ask quotable; closing it returns to the field rather than to history, so a
 * visitor who arrives here first still lands somewhere real (L7 — leaving is
 * always one gesture).
 */
export default function SupportPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() ?? false;
  const [query] = useSearchParams();
  const authorSupport = query.get("purpose") === "author";
  const fromAmm = authorSupport && rememberedAmmOrigin(query);

  useEffect(() => {
    document.title = "Support the Work — Digital Organism Theory";
  }, []);

  return (
    <SupportSurface
      reducedMotion={reducedMotion}
      titleAs="h1"
      initialPurpose={authorSupport ? "author" : "lumen"}
      context={fromAmm ? "amm" : undefined}
      onClose={() => navigate(fromAmm ? "/amm/editions" : authorSupport ? "/book/digital-organism-theory/copy" : "/", { replace: true })}
    />
  );
}

/**
 * Stripe returns every author contribution to the same address, so an AMM
 * reader's origin is held for the tab's session and read back only on that
 * return. A convenience: without storage the book's return path applies.
 */
function rememberedAmmOrigin(query: URLSearchParams): boolean {
  try {
    if (query.get("from") === "amm") { sessionStorage.setItem("dot_support_from", "amm"); return true; }
    if (query.has("support")) return sessionStorage.getItem("dot_support_from") === "amm";
    sessionStorage.removeItem("dot_support_from");
  } catch {
    return query.get("from") === "amm";
  }
  return false;
}
