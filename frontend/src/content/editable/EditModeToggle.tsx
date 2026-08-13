/**
 * The steward's switch between reading and writing.
 *
 * Renders nothing at all for anyone else, so the public surfaces carry no trace
 * of an editing system a reader cannot use.
 */

import { PencilLine } from "lucide-react";

import { useSiteContent } from "./SiteContentProvider";

export function EditModeToggle({ className }: { className?: string }) {
  const { canEdit, editMode, setEditMode } = useSiteContent();

  if (!canEdit) return null;

  return (
    <button
      type="button"
      onClick={() => setEditMode(!editMode)}
      aria-pressed={editMode}
      title={editMode ? "Finish editing" : "Edit this page's words"}
      className={[
        "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs backdrop-blur-md transition-colors",
        editMode
          ? "border-foreground/40 bg-foreground text-background"
          : "border-border/60 bg-background/70 text-muted-foreground hover:text-foreground",
        className ?? "",
      ].join(" ")}
    >
      <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
      {editMode ? "Done" : "Edit"}
    </button>
  );
}

export default EditModeToggle;
