import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { SignIn } from "../../dot/SignIn";
import { useAuth } from "../../dot/useAuth";
import { closeFreeMembership, membershipAvailability, membershipProfile, signOutMembership, type MembershipAvailability } from "../../services/OrchestratorMembershipService";
import { downloadText } from "../publication/writing/manuscriptFile";
import { AmmButton } from "./AmmControls";
import { AmmShell } from "./AmmIdentity";
import "./amm-membership.css";

/** A real verified account, with separate reading, email, and account choices. */
export default function AmmMembershipPage() {
  const AMM = useAmmContent();
  const { user, loading, refresh } = useAuth();
  const [availability, setAvailability] = useState<MembershipAvailability | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    void membershipAvailability(abort.signal).then(value => { if (!abort.signal.aborted) setAvailability(value); })
      .catch(() => { if (!abort.signal.aborted) setAvailabilityError(true); });
    return () => abort.abort();
  }, []);

  async function exportDetails() {
    setBusy(true); setError(null);
    try { downloadText(JSON.stringify(await membershipProfile(), null, 2), "my-membership.json", "application/json;charset=utf-8"); }
    catch { setError("Your membership details could not be exported. Please try again."); }
    finally { setBusy(false); }
  }
  async function leave() {
    setBusy(true); setError(null);
    try { await closeFreeMembership(); setClosed(true); setClosing(false); await refresh(); }
    catch { setError("The closure result could not be confirmed. Reload this page to check your account before trying again."); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError(null);
    try { await signOutMembership(); await refresh(); }
    catch { setError("Sign-out could not be confirmed. Please try again."); }
    finally { setBusy(false); }
  }
  return <AmmShell reading><div className="amm-membership-page">
    <Helmet><title>Free membership — {AMM.title}</title><meta name="robots" content="noindex" /></Helmet>
    <header><p className="amm-eyebrow">The American Millennial Manifesto</p><h1>{user ? "Your free membership." : "Take your life seriously."}</h1><p>{user ? `Your account is active${user.display_name ? `, ${user.display_name}` : ""}. Choose what you came here to do.` : "Join with a verified email address. Membership is free and open; receiving email is a separate choice."}</p></header>
    {closed && <p role="status">Your free membership is closed and your sessions have ended. Email subscriptions remain under their own unsubscribe controls.</p>}
    {loading ? <p role="status">Checking your session…</p> : user ? <>
      <FocusNav label="Your membership" primary={{ to: AMM.introduction.route, label: "Read the working book" }} secondary={[{ to: "/amm/editions#amm-subscribe", label: "Choose email updates" }, { to: "/contact?purpose=writing", label: "Write to Henok" }]} />
      <p className="amm-membership-note">Public reading remains open. A shared discussion space and manuscript downloads are not available yet.</p>
      <details className="amm-account-details"><summary>Account and privacy</summary><p>Export your account identifier, name, status, and join date. To request deletion of separately stored work or other records, use <Link to="/contact?purpose=privacy">the privacy contact</Link>.</p><div className="amm-account-actions"><AmmButton label="Export membership details" disabled={busy} onClick={() => void exportDetails()} /><AmmButton label="Sign out" disabled={busy} onClick={() => void signOut()} /></div>
      {user.role === "member" && <div className="amm-membership-close">{closing ? <><p>Close your free membership and end its sessions? Your display name is removed. A one-way email fingerprint and account record remain so you can rejoin; separately stored work and newsletter subscriptions are retained.</p><div className="amm-account-actions"><button disabled={busy} onClick={() => void leave()}>Close membership</button><button disabled={busy} onClick={() => setClosing(false)}>Keep membership</button></div></> : <button disabled={busy} onClick={() => setClosing(true)}>Leave free membership</button>}</div>}
      </details>
    </> : <section className="amm-membership-entry" aria-label="Free membership signup">
      {availability?.available ? <AmmButton variant="primary" label="Join or sign in" onClick={() => { setClosed(false); setSignInOpen(true); }} /> : availabilityError ? <p role="alert">Membership signup could not be reached. Please try again later. The <Link to="/amm/editions">writing remains open</Link>.</p> : availability ? <><p>New membership signup is not available right now. Public reading and the reader list remain open.</p><AmmButton label="Sign in to an existing account" onClick={() => setSignInOpen(true)} /></> : <p role="status">Checking membership availability…</p>}
      <p><Link to="/amm/editions#amm-subscribe">Choose AMM email updates</Link> · <Link to="/amm/editions">Read without an account</Link></p>
    </section>}
    {error && <p role="alert">{error}</p>}
    {signInOpen && <SignIn membership={availability?.open === true} onClose={() => setSignInOpen(false)} onSignedIn={() => { setSignInOpen(false); void refresh(); }} />}
  </div></AmmShell>;
}
