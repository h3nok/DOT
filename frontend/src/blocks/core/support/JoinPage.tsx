import { Navigate } from "react-router-dom";

/**
 * Preserve the old joining address after opening free verified membership.
 */
export default function JoinPage() { return <Navigate to="/amm/membership" replace />; }
