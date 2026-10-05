import { Copy, Download, ExternalLink } from "lucide-react";
import { useState } from "react";

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://dotheory.org";

export function PublicationSharing({ title, path }: { title: string; path: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const url = new URL(path, SITE_URL).href;
  const packageText = `${title}\n\n${url}\n`;

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage("Copied.");
    } catch {
      setMessage("Clipboard unavailable. Select and copy the address below.");
    }
  }

  function download() {
    const blobUrl = URL.createObjectURL(new Blob([packageText], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = "publication-sharing.txt";
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <section aria-label="Share publication" className="border-t border-border/60 pt-5">
      <h3 className="text-sm font-semibold">Share this publication</h3>
      <a href={url} className="mt-3 block break-all text-xs text-muted-foreground underline underline-offset-4">{url}</a>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => void copy(url)} className="dot-pill"><Copy className="h-4 w-4" aria-hidden="true" />Copy link</button>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="dot-pill">
          <ExternalLink className="h-4 w-4" aria-hidden="true" />Share on LinkedIn
        </a>
        <button type="button" onClick={() => void copy(packageText)} className="dot-pill"><Copy className="h-4 w-4" aria-hidden="true" />Copy title and link</button>
        <button type="button" onClick={download} className="dot-pill"><Download className="h-4 w-4" aria-hidden="true" />Export sharing text</button>
      </div>
      {message && <p role="status" className="mt-3 text-xs text-muted-foreground">{message}</p>}
    </section>
  );
}