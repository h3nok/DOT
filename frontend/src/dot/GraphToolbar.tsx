import { Check, LogIn, Pencil, RotateCcw, UserPlus } from "lucide-react";
import type React from "react";

interface GraphToolbarProps {
  owner: boolean;
  isOwner: boolean;
  editing: boolean;
  status: string;
  onToggleEdit: () => void;
  onReset: () => void;
  onInvite: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  owner,
  isOwner,
  editing,
  status,
  onToggleEdit,
  onReset,
  onInvite,
  onSignOut,
  onSignIn,
}) => {
  if (owner) {
    return (
      <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
        {editing && status !== "idle" && (
          <span className="dot-pill text-muted-foreground" aria-live="polite">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  status === "error"
                    ? "#ef4444"
                    : status === "saved"
                      ? "var(--organism-accent-strong)"
                      : "var(--organism-accent-soft)",
              }}
            />
            {status === "saving"
              ? "Publishing…"
              : status === "saved"
                ? "Published"
                : status === "loading"
                  ? "Syncing…"
                  : "Offline"}
          </span>
        )}
        {editing && (
          <button
            type="button"
            onClick={onReset}
            title="Reset the graph to its seed"
            className="dot-pill text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={onToggleEdit}
          aria-pressed={editing}
          title={editing ? "Done editing" : "Edit the graph"}
          className="dot-pill text-foreground/80"
        >
          {editing ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Done
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </>
          )}
        </button>
        {!editing && isOwner && (
          <button
            type="button"
            onClick={onInvite}
            title="Invite someone"
            className="dot-pill border-[color:var(--organism-accent-soft)] text-foreground"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </button>
        )}
        {!editing && isOwner && (
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            className="dot-pill text-muted-foreground"
          >
            Sign out
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSignIn}
      title="Sign in"
      className="dot-pill absolute right-5 top-5 z-20 h-8 w-8 justify-center p-0 text-muted-foreground/60"
      aria-label="Sign in"
    >
      <LogIn className="h-3.5 w-3.5" />
    </button>
  );
};
