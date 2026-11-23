import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/**
 * Copies the address of one idea (this page plus the screen's #id), so a reader
 * can send exactly what they mean. Nothing is counted or reported (L5, L9). If the
 * clipboard is refused, the address is shown as selectable text instead.
 */
export function ShareLink({ target, labels }: {
  /** The id of the screen to link to. */
  target: string;
  labels: { action: string; done: string; unavailable: string };
}) {
  const [state, setState] = useState<"idle" | "done" | { address: string }>("idle");
  const copy = async () => {
    const address = `${window.location.origin}${window.location.pathname}#${target}`;
    try {
      await navigator.clipboard.writeText(address);
      setState("done");
    } catch {
      setState({ address });
    }
  };
  return (
    <span className="inq-share">
      <button type="button" className="inq-share-button" onClick={copy}>
        {state === "done" ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
        <span>{labels.action}</span>
      </button>
      <span role="status" aria-live="polite" className="inq-share-status">
        {state === "done" ? labels.done : typeof state === "object" ? <>{labels.unavailable} <span className="inq-share-address">{state.address}</span></> : ""}
      </span>
    </span>
  );
}
