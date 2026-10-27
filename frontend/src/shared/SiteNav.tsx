import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, X } from "lucide-react";
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
  "/": "Begin with the inquiry",
  "/about": "The person and the work",
  "/blog": "Read essays, notes, and questions",
  "/academy": "Watch films and explore the theory",
  "/book/digital-organism-theory": "Read the complete, free edition",
  "/contact": "Start a conversation",
  "/readers": "New writing, by email",
};

function isCurrentDestination(pathname: string, to: string) {
  return pathname === to || (to !== "/" && pathname.startsWith(`${to}/`)) ||
    (to === "/blog" && (/^\/(writing|essays)(\/|$)/.test(pathname) || pathname.startsWith("/_preview/essays"))) ||
    (to === "/academy" && /^\/(films|videos)(\/|$)/.test(pathname));
}

/** One deliberate opening into a finite map of the work, at every screen size. */
export function SiteNav({ className = "" }: { className?: string }) {
  const location = useLocation();
  const { pathname } = location;
  const [open, setOpen] = useState(false);
  const descriptionPrefix = useId();
  const panel = useRef<HTMLDivElement>(null);
  const currentDestination = [...PRIMARY_NAV, ...EXTRA_NAV].find(([to]) => isCurrentDestination(pathname, to));

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
            <button type="button" className="site-nav-trigger" aria-label="Explore the site">
              <svg className="site-nav-trigger-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              <span>Explore</span>
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
          onOpenAutoFocus={(event) => {
            const destination = panel.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ??
              panel.current?.querySelector<HTMLAnchorElement>("a");
            if (!destination) return;
            event.preventDefault();
            destination.focus();
          }}
        >
          <div className="site-nav-panel-heading">
            <div className="site-nav-heading-copy">
              <span className="dot-label">Digital Organism Theory</span>
              <Dialog.Title className="site-nav-title">Follow your curiosity.</Dialog.Title>
              <Dialog.Description className="site-nav-introduction">A few clear paths into the work.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="site-nav-close" aria-label="Close navigation">
                <span>Close</span><X aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="Primary" className="site-nav-panel-scroll">
            <svg className="site-nav-route-line" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
              <path d="M100 60 C210 -20 330 -15 420 20 S730 40 720 140 S760 290 660 350 S430 455 340 410 S20 400 60 280" fill="none" />
            </svg>
            <div className="site-nav-observer" aria-hidden="true">
              <svg viewBox="-150 -150 300 300" fill="none" stroke="currentColor">
                <circle cx="0" cy="0" r="78" />
                <circle cx="0" cy="0" r="108" />
                <circle cx="0" cy="0" r="138" />
                <circle cx="0" cy="0" r="5" fill="currentColor" stroke="none" />
              </svg>
              <span>You are here</span>
              <strong>{currentDestination?.[1] ?? "DOT"}</strong>
            </div>
            <ul className="site-nav-links">
              {PRIMARY_NAV.map(([to, label], index) => (
                <li key={to}>
                  <Link
                    to={to}
                    aria-label={label}
                    aria-describedby={`${descriptionPrefix}-${index}`}
                    aria-current={isCurrentDestination(pathname, to) ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="site-nav-link-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <span className="site-nav-link-copy">
                      <span className="site-nav-link-title">{label}</span>
                      <span id={`${descriptionPrefix}-${index}`} className="site-nav-description">{DESTINATION_DESCRIPTIONS[to]}</span>
                    </span>
                    <ArrowUpRight className="site-nav-link-arrow" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="site-nav-panel-footer">
            <p>Take your time. Choose your own way in.</p>
            <nav aria-label="Conversation and updates">
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
