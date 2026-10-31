import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SignIn } from "../../dot/SignIn";
import { useAuth } from "../../dot/useAuth";
import { DotButton } from "../../shared/DotButton";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { checkInvitation } from "../../services/OrchestratorPeopleService";

interface Check { state: "checking" | "failed" | "closed" | "open"; invitedBy?: string | null }

export default function InvitePage() {
  const { user, loading } = useAuth();
  const [token] = useState(() => window.location.hash.slice(1));
  const [check, setCheck] = useState<Check>({ state: token ? "checking" : "closed" });
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => { document.title = "Your invitation"; }, []);
  useEffect(() => {
    if (!token) return;
    const abort = new AbortController();
    void checkInvitation(token, abort.signal)
      .then(result => setCheck(result.valid ? { state: "open", invitedBy: result.invited_by } : { state: "closed" }))
      .catch(() => { if (!abort.signal.aborted) setCheck({ state: "failed" }); });
    return () => abort.abort();
  }, [token]);

  let body;
  if (check.state === "checking" || loading) {
    body = <p role="status">Opening your invitation…</p>;
  } else if (check.state === "failed") {
    body = <p role="alert">The invitation could not be checked. Reload this page to try again.</p>;
  } else if (check.state === "closed") {
    body = <>
      <h1 className="dot-page-heading">This invitation is no longer open</h1>
      <p className="dot-lede mt-4">It may have been used, revoked, or expired. Everything public stays free to read without an account.</p>
      <p className="mt-6"><Link to="/join" className="underline underline-offset-4">Ask to join</Link></p>
    </>;
  } else if (user) {
    body = <>
      <h1 className="dot-page-heading">You are already signed in</h1>
      <p className="dot-lede mt-4">This invitation is for someone new. It stays open for them.</p>
      <p className="mt-6"><Link to="/" className="underline underline-offset-4">Return home</Link></p>
    </>;
  } else {
    body = <>
      <p className="dot-label">Private invitation</p>
      <h1 className="dot-page-heading mt-2">{check.invitedBy ? `${check.invitedBy} invited you` : "You are invited"}</h1>
      <p className="dot-lede mt-4">Accept with your email address. A one-time code confirms it; there is no password.</p>
      <div className="mt-8"><DotButton type="button" label="Accept invitation" onClick={() => setSigningIn(true)} /></div>
    </>;
  }

  return <PageShell header={<PageHeader />}>
    <section className="py-16">{body}</section>
    {signingIn && <SignIn inviteToken={token} onClose={() => setSigningIn(false)} onSignedIn={() => window.location.replace("/")} />}
  </PageShell>;
}
