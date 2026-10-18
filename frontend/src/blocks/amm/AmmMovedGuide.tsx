import { Navigate } from "react-router-dom";

/**
 * Earlier addresses of the money guide and Capital and power. How power works is hidden for now, so they
 * open the AMM home; when it returns, send them to powerAddress() in ammPowerMoves again.
 */
export default function AmmMovedGuide() {
  return <Navigate replace to="/amm" />;
}
