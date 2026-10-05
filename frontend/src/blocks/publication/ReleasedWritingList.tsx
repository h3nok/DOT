import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchReleasedWriting, writingRoute, type ReleasedWriting } from "../../services/OrchestratorWritingService";

export function ReleasedWritingList() {
  const [entries, setEntries] = useState<ReleasedWriting[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    void fetchReleasedWriting(abort.signal).then(setEntries).catch(() => { if (!abort.signal.aborted) setFailed(true); });
    return () => abort.abort();
  }, []);
  return (
    <section aria-labelledby="native-writing-title" className="mt-12 border-t border-border pt-6">
      <h2 id="native-writing-title" className="font-serif text-2xl">Released writing</h2>
      {failed ? <p role="alert" className="mt-4 text-sm text-muted-foreground">The native writing catalogue could not be reached. Book One and the static essays remain available.</p>
        : entries === null ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading released writing…</p>
        : entries.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No standalone work has been released from Studio yet.</p>
        : <ol aria-label="Native publications" className="mt-4 divide-y divide-border/60">{entries.map((entry) => <li key={entry.work_id} className="py-5">
          <p className="dot-label">Version {entry.release_number} · <time dateTime={entry.released_at}>{new Date(entry.released_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</time></p>
          <h3 className="mt-2 text-lg font-semibold"><Link to={writingRoute(entry.work_id)} className="hover:underline">{entry.title}</Link></h3>
          {entry.summary && <p className="mt-2 text-sm text-muted-foreground">{entry.summary}</p>}
        </li>)}</ol>}
    </section>
  );
}