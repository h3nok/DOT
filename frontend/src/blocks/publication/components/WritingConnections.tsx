import { useCallback, useEffect, useState } from "react";
import { authorizeLinkedIn, disconnectLinkedIn, fetchLinkedInConnection, type LinkedInConnection } from "../../../services/OrchestratorDistributionService";

export function WritingConnections({ selected, onSelect }: { selected: boolean; onSelect: (value: boolean) => void }) {
  const [connection, setConnection] = useState<LinkedInConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const callbackFailed = new URLSearchParams(window.location.search).get("connected") === "failed";
  const [busy, setBusy] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setConnection(await fetchLinkedInConnection()); setError(null); }
    catch { setError("LinkedIn settings could not be loaded. You can still publish on this website."); }
  }, []);

  useEffect(() => {
    void refresh();
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [refresh]);
  useEffect(() => {
    if (connection && !connection.connected) onSelect(false);
  }, [connection, onSelect]);

  async function connect() {
    // Open from the click itself so browsers do not block the OAuth tab after
    // the request resolves. The current manuscript stays in its original tab.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    setBusy(true);
    setError(null);
    try {
      const { authorization_url: url } = await authorizeLinkedIn();
      const target = new URL(url);
      if (target.origin !== "https://www.linkedin.com" || target.pathname !== "/oauth/v2/authorization") throw new Error("The account connection address was invalid.");
      setAuthorizationUrl(url);
      if (tab) tab.location.href = url;
    } catch (reason) {
      tab?.close();
      setError(reason instanceof Error ? reason.message : "LinkedIn could not be connected.");
    } finally { setBusy(false); }
  }

  async function disconnect() {
    setBusy(true);
    try { await disconnectLinkedIn(); onSelect(false); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The connection could not be removed."); }
    finally { setBusy(false); }
  }

  return <section aria-label="Publishing destinations" className="my-6 border-y border-border py-5">
    <h2 className="text-sm font-semibold">Publish here, then distribute</h2>
    <p className="mt-2 text-sm text-muted-foreground">The complete piece lives on this website. Substack and Medium copies can be prepared from the published version.</p>
    <label className="mt-4 flex min-h-11 items-start gap-3 text-sm">
      <input type="checkbox" checked={selected} disabled={busy || !connection?.connected} onChange={(event) => onSelect(event.target.checked)} className="mt-1" />
      <span>Also share a link on LinkedIn<span className="mt-1 block text-xs text-muted-foreground">Posts the released title, summary, and link. A LinkedIn newsletter issue is prepared separately below.</span></span>
    </label>
    {connection?.connected ? <div className="mt-3 flex flex-wrap items-center gap-4 text-sm"><p>Connected as {connection.display_name}. Return to your original writing tab if you connected in a new tab.</p><button type="button" disabled={busy} onClick={() => void disconnect()} className="min-h-11 underline underline-offset-4">Disconnect</button></div>
      : connection?.configured ? <button type="button" disabled={busy} onClick={() => void connect()} className="dot-pill mt-3">Connect LinkedIn in a new tab</button>
        : connection && <p className="mt-3 text-xs text-muted-foreground">Automatic LinkedIn sharing needs application setup. You can use the sharing and full-text tools after publishing.</p>}
    {authorizationUrl && !connection?.connected && <a href={authorizationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block break-words text-sm underline">Continue connecting LinkedIn</a>}
    {callbackFailed && !connection?.connected && <p role="status" className="mt-3 text-sm">The LinkedIn connection did not complete. Return to your writing tab and try connecting again.</p>}
    {error && <p role="status" className="mt-3 text-sm text-muted-foreground">{error} <button type="button" onClick={() => void refresh()} className="underline">Try again</button></p>}
    <details className="mt-3 text-xs text-muted-foreground"><summary className="min-h-10 cursor-pointer py-3">About distribution</summary><p>Publishing here updates the blog and RSS. Full-text copies retain the published version and its source link. External accounts and subscriptions stay separate from the owned reader list.</p></details>
  </section>;
}
