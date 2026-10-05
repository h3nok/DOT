import { Plus, Trash2 } from "lucide-react";
import type { WritingClaim } from "../../../services/OrchestratorWritingService";

export const emptyClaim = (): WritingClaim => ({ statement: "", level: "", origin: "author_originated", source: "" });
const field = "min-h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground";

export function WritingClaimsEditor({ claims, onChange, disabled }: { claims: WritingClaim[]; onChange: (claims: WritingClaim[]) => void; disabled: boolean }) {
  function change(index: number, update: Partial<WritingClaim>) {
    onChange(claims.map((claim, position) => position === index ? { ...claim, ...update } : claim));
  }
  return (
    <section aria-label="Material claims" className="mt-8 border-t border-border py-6">
      <h2 className="text-lg font-semibold">Material claims</h2>
      {claims.map((claim, index) => (
        <fieldset key={index} disabled={disabled} className="mt-5 border-b border-border/60 pb-5">
          <legend className="text-sm font-semibold">Claim {index + 1}</legend>
          <label className="mt-2 block text-xs">Statement
            <textarea value={claim.statement} onChange={(event) => change(index, { statement: event.target.value })} className={`${field} mt-2 min-h-20 py-2`} />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs">Claim level
              <select value={claim.level} onChange={(event) => change(index, { level: event.target.value as WritingClaim["level"] })} className={`${field} mt-2`}>
                <option value="">Choose a level</option>
                {["Observation", "Model", "Hypothesis", "Speculation"].map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label className="text-xs">Provenance
              <select value={claim.origin} onChange={(event) => change(index, { origin: event.target.value as WritingClaim["origin"] })} className={`${field} mt-2`}>
                <option value="author_originated">Author-originated</option><option value="sourced">Sourced</option>
              </select>
            </label>
          </div>
          {claim.origin === "sourced" && <label className="mt-3 block text-xs">Source URL
            <input type="url" value={claim.source} onChange={(event) => change(index, { source: event.target.value })} className={`${field} mt-2`} />
          </label>}
          <button type="button" onClick={() => onChange(claims.filter((_, position) => position !== index))} className="mt-3 inline-flex h-8 w-8 items-center justify-center text-muted-foreground" title={`Remove claim ${index + 1}`} aria-label={`Remove claim ${index + 1}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </fieldset>
      ))}
      <button type="button" disabled={disabled} onClick={() => onChange([...claims, emptyClaim()])} className="dot-pill mt-4"><Plus className="h-4 w-4" aria-hidden="true" />Add claim</button>
    </section>
  );
}