import { useState } from "react";
import { ArrowUpRight, Copy } from "lucide-react";

import SUPPORT from "../content/support.json";
import { resolveSupportMethods, type DirectSupportMethod } from "../content/supportMethods.js";
import { BloomSurface } from "./BloomSurface";

export const DIRECT_SUPPORT_METHODS = resolveSupportMethods(SUPPORT);

export function DirectSupportSurface({ methods, origin, reducedMotion, titleAs, onClose, onCard }: {
  methods: DirectSupportMethod[];
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  titleAs?: "h1" | "h2";
  onClose: () => void;
  onCard: () => void;
}) {
  const [selected, setSelected] = useState(methods[0].id);
  const [copyStatus, setCopyStatus] = useState("");
  const method = methods.find(item => item.id === selected)!;
  const copyRecipient = async () => {
    if (method.id !== "zelle") return;
    try {
      await navigator.clipboard.writeText(method.recipient);
      setCopyStatus("Recipient copied. Open Zelle in your banking app to continue.");
    } catch {
      setCopyStatus("Copying is unavailable. You can select and copy the recipient shown above.");
    }
  };

  return <BloomSurface origin={origin} reducedMotion={reducedMotion} titleAs={titleAs} zIndex={58}
    onClose={onClose} kicker="support" title="Support the author"
    description="A voluntary, one-time contribution. The complete book and PDF remain free, with no account required." size="md"
    footer={method.id === "cashapp"
      ? <a href={method.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><ArrowUpRight className="h-4 w-4" aria-hidden="true" />Continue to Cash App</a>
      : <button type="button" onClick={() => void copyRecipient()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><Copy className="h-4 w-4" aria-hidden="true" />Copy Zelle recipient</button>}>
    {methods.length > 1 && <label className="mb-5 grid gap-2 text-sm">Support method
      <select className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground" value={selected} onChange={event => { setSelected(event.target.value as DirectSupportMethod["id"]); setCopyStatus(""); }}>
        {methods.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>}
    <section aria-label={`Support with ${method.label}`} className="space-y-3 text-sm leading-relaxed">
      <h2 className="font-semibold">{method.label}</h2>
      {method.id === "zelle" ? <>
        <dl className="grid gap-1"><dt className="text-muted-foreground">Recipient</dt><dd className="select-text break-words font-medium">{method.recipient}</dd><dt className="mt-2 text-muted-foreground">Name to check</dt><dd className="font-medium">{method.recipientName}</dd></dl>
        <p className="text-muted-foreground">Open Zelle in your banking app, enter this recipient, and choose an amount. Check the recipient name before sending. Your bank must offer Zelle for your account.</p>
      </> : <p className="text-muted-foreground">Continue to the author’s Cash App page. Check the recipient and amount there before sending.</p>}
      <p className="text-muted-foreground">Confirmation comes from {method.id === "zelle" ? "your bank" : "Cash App"}. This page cannot confirm a direct transfer. Copying a recipient or opening a link does not send money.</p>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </section>
    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Support buys no access, membership, or influence. It does not subscribe you to email. It is not a charitable donation.</p>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <button type="button" onClick={onCard} className="min-h-11 underline underline-offset-4">Use card checkout instead</button>
      <a href="/terms" className="inline-flex min-h-11 items-center underline underline-offset-4">Terms and refunds</a>
    </div>
  </BloomSurface>;
}
