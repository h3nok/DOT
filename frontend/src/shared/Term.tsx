import { Link } from "react-router-dom";

const TERM_STYLE =
  "underline decoration-[color:var(--organism-accent-soft)] decoration-1 underline-offset-[3px] transition-colors hover:text-[color:var(--organism-accent-strong)] hover:decoration-[color:var(--organism-accent-strong)]";

export function Term({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={`/doctrine/${encodeURIComponent(id)}`} className={TERM_STYLE}>
      {children}
    </Link>
  );
}
