import { useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { JoinSurface } from "../../../dot/JoinSurface";

/**
 * The request-to-join ask as its own address, so it can be linked from the end
 * of the book, the steward node, or anywhere the reader has earned the ask.
 */
export default function JoinPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <JoinSurface
      reducedMotion={reducedMotion}
      titleAs="h1"
      onClose={() => navigate("/", { replace: true })}
    />
  );
}
