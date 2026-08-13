import { useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

  return (
    <SupportSurface
      reducedMotion={reducedMotion}
      onClose={() => navigate("/", { replace: true })}
    />
  );
}
