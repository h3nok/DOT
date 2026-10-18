import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AppearanceControl } from "../../organism/AppearanceControl";
import { PageShell } from "../../shared/PageShell";
import AMM from "../../content/amm.json";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { OwnerEditLink } from "../publication/components/OwnerEditLink";
import { AmmMark } from "./AmmMark";
import "./amm.css";
import "./amm-interactions.css";
import "./amm-money.css";

export { AmmMark } from "./AmmMark";

/** The masthead: the publication's name, the way back to Digital Organism Theory, and the reader's appearance control. */
function AmmHeader() {
  const { dot } = useAmmContent();
  return (
    <header className="amm-header">
      <div className="amm-container amm-header-inner">
        <Link to="/amm" className="amm-brand" aria-label={`${AMM.title} — Home`}>
          <AmmMark kindle />
          <span className="amm-brand-name"><span>American</span><strong>Millennial Manifesto</strong></span>
        </Link>
        <Link to={dot.route} className="amm-header-dot" aria-label="Digital Organism Theory — Home"><span className="amm-header-dot-full">Digital Organism Theory</span><abbr className="amm-header-dot-short" title="Digital Organism Theory">DOT</abbr></Link>
        <div className="amm-appearance"><AppearanceControl placement="inline" /></div>
      </div>
    </header>
  );
}

function AmmFooter() {
  const { dot, movement } = useAmmContent();
  return (
    <footer className="amm-footer amm-container">
      <div className="amm-footer-signature"><AmmMark /><div><strong>The American Millennial Manifesto</strong><p>An independent publication by <Link to="/about">Henok Ghebrechristos</Link>.</p><p className="amm-footer-lineage"><Link to={dot.route}>{dot.footer}</Link> <a href={movement.href} rel="noopener">{movement.footer}</a></p></div></div>
      <nav aria-label="AMM footer">
        <Link to="/amm/editions">Editions</Link>
        <Link to="/contact?purpose=writing">Correspondence <ArrowUpRight aria-hidden="true" /></Link>
        <a href={AMM.feed}>RSS</a>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/">Digital Organism Theory</Link>
        <a href={movement.href} rel="noopener">4Us <ArrowUpRight aria-hidden="true" /></a>
      </nav>
    </footer>
  );
}

export function AmmShell({ children, reading = false, footer = true }: { children: ReactNode; reading?: boolean; footer?: boolean }) {
  const { pathname } = useLocation();
  useEffect(() => {
    // Reuse the prerendered icon. React 19 metadata hoisting does not adopt
    // static tags, so the shell owns this override and removes it on departure.
    const icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"][href="/amm/mark.svg"]') ?? document.createElement("link");
    icon.rel = "icon"; icon.type = "image/svg+xml"; icon.href = "/amm/mark.svg";
    document.head.append(icon);
    return () => icon.remove();
  }, []);
  return (
    <div className={`amm-shell${reading ? " amm-shell--reading" : ""}${pathname.replace(/\/+$/, "") === "/amm" ? " amm-shell--home" : ""}`}>
      <a className="amm-skip" href="#amm-main">Skip to content</a>
      <PageShell wide className={reading ? "amm-reader" : "amm-page"} header={<AmmHeader />} footer={footer ? <AmmFooter /> : undefined}>
        <div id="amm-main" tabIndex={-1}>{["/amm", "/amm/editions", "/amm/power"].includes(pathname.replace(/\/+$/, "")) && <OwnerEditLink to="/studio/pages/amm" label="Edit this page" />}{children}</div>
      </PageShell>
    </div>
  );
}
