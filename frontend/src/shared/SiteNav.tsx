import { Link, useLocation } from "react-router-dom";

const PRIMARY_NAV: ReadonlyArray<readonly [string, string]> = [
  ["/book/digital-organism-theory", "Book One"],
  ["/blog", "Blog"],
  ["/academy", "Academy"],
  ["/about", "About"],
];

/** The same four doors on every page; a fixed order, nothing counted or ranked. */
export function SiteNav({ className = "" }: { className?: string }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {PRIMARY_NAV.map(([to, label]) => {
          const current = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded px-2.5 text-xs font-medium transition-colors sm:min-h-9 ${
                  current ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
