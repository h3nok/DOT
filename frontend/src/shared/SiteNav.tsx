import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ArrowUpRight, X } from "lucide-react";
import "./site-nav.css";

const PRIMARY_NAV: ReadonlyArray<readonly [string, string]> = [
  ["/", "Home"],
  ["/book/digital-organism-theory", "Book One"],
  ["/academy", "Academy"],
  ["/blog", "Writing"],
  ["/about", "About"],
  ["/contact", "Contact"],
];

const EXTRA_NAV: ReadonlyArray<readonly [string, string]> = [
  ["/readers", "Reader list"],
];

const DESTINATION_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "/": "Overview",
  "/book/digital-organism-theory": "Complete edition, free to read",
  "/academy": "Concepts, films, and open questions",
  "/blog": "Essays and notes",
  "/about": "Background and projects",
  "/contact": "Projects, speaking, and general inquiries",
};

function isCurrentDestination(pathname: string, to: string) {
  return pathname === to || (to !== "/" && pathname.startsWith(`${to}/`)) ||
    (to === "/blog" && (/^\/(writing|essays)(\/|$)/.test(pathname) || pathname.startsWith("/_preview/essays"))) ||
    (to === "/academy" && /^\/(films|videos)(\/|$)/.test(pathname));
}

/** The DOT mark: an observer, three rings around one point. It marks the current page. */
function ObserverMark() {
  return (
    <svg className="site-nav-mark" viewBox="-24 -24 48 48" fill="none" stroke="currentColor" aria-hidden="true">
      <circle r="21" strokeWidth={1.4} opacity={0.55} />
      <circle r="14" strokeWidth={1.6} opacity={0.8} />
      <circle r="7.5" strokeWidth={1.8} />
      <circle r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** The site menu: a finite, ordered list of the main pages, at every screen size. */
export function SiteNav({ className = "" }: { className?: string }) {
  const location = useLocation();
  const { pathname } = location;
  const [open, setOpen] = useState(false);
  const descriptionPrefix = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {createPortal(
        // Header filters create containing blocks for fixed descendants. Keep
        // this viewport control outside them while preserving Dialog context.
        <div className={`site-nav ${className}`}>
          <Dialog.Trigger asChild>
            <button type="button" className="site-nav-trigger" aria-label="Open menu">
              <svg className="site-nav-trigger-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              <span>Menu</span>
            </button>
          </Dialog.Trigger>
        </div>,
        document.body,
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="site-nav-overlay" />
        <Dialog.Content
          ref={panel}
          className="site-nav-panel"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            const destination = panel.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ??
              panel.current?.querySelector<HTMLAnchorElement>("a");
            if (!destination) return;
            event.preventDefault();
            destination.focus();
          }}
        >
          <div className="site-nav-panel-heading">
            <Dialog.Title className="site-nav-title">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="site-nav-close" aria-label="Close menu">
                <span>Close</span><X aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <div className="site-nav-body">
            <nav aria-label="Primary" className="site-nav-index">
              <ol className="site-nav-links">
                {PRIMARY_NAV.map(([to, label], index) => {
                  const current = isCurrentDestination(pathname, to);
                  return (
                    <li key={to} style={{ "--site-nav-order": index } as CSSProperties}>
                      <Link
                        to={to}
                        aria-label={label}
                        aria-describedby={`${descriptionPrefix}-${index}`}
                        aria-current={current ? "page" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        <span className="site-nav-link-marker" aria-hidden="true">
                          {current ? <ObserverMark /> : String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="site-nav-link-copy">
                          <span className="site-nav-link-title">{label}</span>
                          <span id={`${descriptionPrefix}-${index}`} className="site-nav-description">{DESTINATION_DESCRIPTIONS[to]}</span>
                        </span>
                        <ArrowRight className="site-nav-link-arrow" aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
          <div className="site-nav-panel-footer">
            <nav aria-label="More">
              {EXTRA_NAV.map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="site-nav-extra"
                  aria-current={isCurrentDestination(pathname, to) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}<ArrowUpRight aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
