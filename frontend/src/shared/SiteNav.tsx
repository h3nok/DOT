import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import { Menu, X } from "lucide-react";
import "./site-nav.css";

const PRIMARY_NAV: ReadonlyArray<readonly [string, string]> = [
  ["/about", "About"],
  ["/blog", "Blog"],
  ["/book/digital-organism-theory", "Book One"],
  ["/academy", "Academy"],
  ["/contact", "Contact"],
];

/** Fixed destinations on every page, with an explicit door for conversation. */
export function SiteNav({ className = "" }: { className?: string }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const links = (destinations: ReadonlyArray<readonly [string, string]>) => destinations.map(([to, label]) => {
    const current = pathname === to || pathname.startsWith(`${to}/`) ||
      (to === "/blog" && (/^\/(writing|essays)(\/|$)/.test(pathname)));
    return (
      <li key={to}>
        <Link to={to} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
          <span>{label}</span>
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
              <span className="dot-label">Explore</span>
              <Popover.Close asChild><button type="button" aria-label="Close menu"><X aria-hidden="true" /></button></Popover.Close>
            </div>
            <nav aria-label="Primary"><ul className="site-nav-links">{links([...PRIMARY_NAV, ["/readers", "Reader list"]])}</ul></nav>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
