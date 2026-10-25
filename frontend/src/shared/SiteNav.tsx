import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import { ArrowUpRight, Menu, X } from "lucide-react";
import "./site-nav.css";

const PRIMARY_NAV: ReadonlyArray<readonly [string, string]> = [
  ["/", "Home"],
  ["/about", "About"],
  ["/blog", "Blog"],
  ["/films", "Films"],
  ["/book/digital-organism-theory", "Book One"],
  ["/contact", "Contact"],
];

const COMPACT_NAV: ReadonlyArray<readonly [string, string]> = [
  ...PRIMARY_NAV.slice(0, -1),
  ["/community", "Community"],
  PRIMARY_NAV[PRIMARY_NAV.length - 1],
  ["/readers", "Reader list"],
];

const DESTINATION_DESCRIPTIONS: Readonly<Record<string, string>> = {
  "/": "The inquiry, at a glance",
  "/about": "The person and the work",
  "/blog": "Essays, notes, and questions",
  "/films": "Watch the ideas take shape",
  "/book/digital-organism-theory": "The complete, free edition",
  "/community": "Conversation and ways to take part",
  "/contact": "Start a conversation",
  "/readers": "New writing, by email",
};

/** Fixed destinations on every page, with an explicit door for conversation. */
export function SiteNav({ className = "" }: { className?: string }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const descriptionPrefix = useId();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const links = (destinations: ReadonlyArray<readonly [string, string]>, descriptions = false) => destinations.map(([to, label], index) => {
    const current = pathname === to || (to !== "/" && pathname.startsWith(`${to}/`)) ||
      (to === "/blog" && (/^\/(writing|essays)(\/|$)/.test(pathname) || pathname.startsWith("/_preview/essays"))) ||
      (to === "/films" && /^\/videos(\/|$)/.test(pathname));
    return (
      <li key={to} className={to === "/readers" ? "site-nav-reader-list" : undefined}>
        <Link
          to={to}
          aria-label={descriptions ? label : undefined}
          aria-describedby={descriptions ? `${descriptionPrefix}-${index}` : undefined}
          aria-current={current ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <span className="site-nav-link-copy">
            <span>{label}</span>
            {descriptions && <span id={`${descriptionPrefix}-${index}`} className="site-nav-description">{DESTINATION_DESCRIPTIONS[to]}</span>}
          </span>
          {descriptions && <ArrowUpRight className="site-nav-link-arrow" aria-hidden="true" />}
        </Link>
      </li>
    );
  });

  return (
    <div className={`site-nav ${className}`}>
      <nav aria-label="Primary" className="site-nav-desktop">
        <ul className="site-nav-links">{links(PRIMARY_NAV)}</ul>
      </nav>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className="site-nav-trigger"><Menu aria-hidden="true" /><span>Menu</span></button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="site-nav-panel" align="end" sideOffset={8} collisionPadding={16} aria-label="Site navigation">
            <div className="site-nav-panel-heading">
              <span className="dot-label">Explore DOT</span>
              <Popover.Close asChild><button type="button" aria-label="Close menu"><X aria-hidden="true" /></button></Popover.Close>
            </div>
            <nav aria-label="Primary" className="site-nav-panel-scroll"><ul className="site-nav-links">{links(COMPACT_NAV, true)}</ul></nav>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
