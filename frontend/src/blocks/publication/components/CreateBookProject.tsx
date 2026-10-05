import { BookPlus, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { createPublicationProject } from "../../../services/OrchestratorPublicationService";

export function CreateBookProject() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const project = await createPublicationProject({ title: title.trim(), type: "book", visibility: "private" });
      navigate(`/studio/${encodeURIComponent(project.id)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The project could not be created.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void create(event)} className="border-b border-border/60 py-8">
      <label htmlFor="new-book-title" className="block text-sm font-semibold">New book project</label>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <input id="new-book-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={256} disabled={saving}
          className="min-h-11 min-w-0 flex-1 rounded border border-border bg-background px-3 text-base text-foreground" />
        <button type="submit" disabled={saving || !title.trim()} className="dot-reading-action min-h-11 disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <BookPlus className="h-4 w-4" aria-hidden="true" />}
          Create private manuscript
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </form>
  );
}