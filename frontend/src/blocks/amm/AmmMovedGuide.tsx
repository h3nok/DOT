import { Navigate, useLocation } from "react-router-dom";
import { DIAGNOSIS_ADDRESS, powerAddress } from "./ammPowerMoves";

/** Earlier addresses of the money guide, Capital and power, and Organized Power: a chart opens its figure, the rest Chapter Two. */
export default function AmmMovedGuide() {
  const { pathname, hash } = useLocation();
  return <Navigate replace to={powerAddress(pathname, hash)} />;
}

/** The diagnosis page now opens where the book develops the diagnosis: Chapter Three. */
export function AmmMovedDiagnosis() {
  return <Navigate replace to={DIAGNOSIS_ADDRESS} />;
}
