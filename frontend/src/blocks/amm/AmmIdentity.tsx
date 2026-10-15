import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { AppearanceControl } from "../../organism/AppearanceControl";
import { PageShell } from "../../shared/PageShell";
import AMM from "../../content/amm.json";
import "./amm.css";

/** A publication identity, shared by its landing and both Markdown readers. */
export function AmmMark({ className = "" }: { className?: string }) {
  return <img className={`amm-mark ${className}`} src="/amm/mark.svg" alt="" width={64} height={64} aria-hidden="true" />;
}

function AmmHeader() {
  const { pathname, hash } = useLocation();
  return (
    <header className="amm-header">
      <div className="amm-container amm-header-inner">
        <Link to="/amm" className="amm-brand" aria-label={`${AMM.title} — Home`}>
          <AmmMark />
          <span className="amm-brand-name"><span>American</span><strong>Millennial Manifesto</strong></span>
        </Link>
        <nav aria-label="AMM" className="amm-nav">
          {[["#amm-analysis", "The analysis"], ["#amm-editions", "Editions"], ["#amm-subscribe", "Subscribe"]].map(([anchor, label]) => (
            <Link key={anchor} to={`/amm${anchor}`} aria-current={pathname === "/amm" && hash === anchor ? "location" : undefined}>{label}</Link>
          ))}
        </nav>
        <div className="amm-appearance"><AppearanceControl placement="inline" /></div>
      </div>
    </header>
  );
}

function AmmFooter() {
  return (
    <footer className="amm-footer amm-container">
      <div className="amm-footer-signature"><AmmMark /><div><strong>The American Millennial Manifesto</strong><p>An independent publication by <Link to="/about">Henok Ghebrechristos</Link>.</p></div></div>
      <nav aria-label="AMM footer">
        <Link to="/contact?purpose=writing">Correspondence <ArrowUpRight aria-hidden="true" /></Link>
        <a href={AMM.feed}>RSS</a>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/">Digital Organism Theory <ArrowUpRight aria-hidden="true" /></Link>
      </nav>
    </footer>
  );
}

export function AmmShell({ children, reading = false }: { children: ReactNode; reading?: boolean }) {
  useEffect(() => {
    // Reuse the prerendered icon. React 19 metadata hoisting does not adopt
    // static tags, so the shell owns this override and removes it on departure.
    const icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"][href="/amm/mark.svg"]') ?? document.createElement("link");
    icon.rel = "icon"; icon.type = "image/svg+xml"; icon.href = "/amm/mark.svg";
    document.head.append(icon);
    return () => icon.remove();
  }, []);
  return (
    <div className={`amm-shell${reading ? " amm-shell--reading" : ""}`}>
      <a className="amm-skip" href="#amm-main">Skip to content</a>
      <PageShell wide className={reading ? "amm-reader" : "amm-page"} header={<AmmHeader />} footer={<AmmFooter />}>
        <div id="amm-main" tabIndex={-1}>{children}</div>
      </PageShell>
    </div>
  );
}
