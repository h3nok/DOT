import { Navigate } from "react-router-dom";

/** Keep old archive links useful; individual essay addresses remain unchanged. */
export default function EssaysPage() {
  return <Navigate to="/blog" replace />;
}
