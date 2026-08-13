import { ArrowRight, LogOut, MessageSquare, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

import type { AuthUser } from "./useAuth";

/**
 * PresenceSurface — the member, present on the field.
 *
 * When someone is signed in, they are not a corner avatar; the organism knows
 * who is here. This surface is the member's own node opened: who is present,
 * the conversations they are holding, and the doors only a member has (invite,
 * sign out). It wears the same receded-field state as Minty — a focus, not a
 * window — so identity lives inside the graph's vocabulary, not above it.
 */

interface PresenceSurfaceProps {
  user: AuthUser;
  reducedMotion?: boolean;
  onClose: () => void;
  /** Open the member's saved conversations (Minty). */
  onOpenConversations: () => void;
  onInvite: () => void;
  onSignOut: () => void;
}

export const PresenceSurface: React.FC<PresenceSurfaceProps> = ({
  user,
  reducedMotion = false,
  onClose,
  onOpenConversations,
  onInvite,
  onSignOut,
}) => {
  const name = user.display_name?.trim() || "You";
  const initial = (name[0] ?? "Y").toUpperCase();

  return (
    <motion.div
      role="dialog"
      aria-label="Your presence"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: "easeOut" }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-md"
      />

      <div className="pointer-events-none relative flex min-h-0 flex-1 items-start justify-center overflow-y-auto">
        <div className="pointer-events-auto w-full max-w-md px-6 pb-16 pt-24">
          {/* Who is present. */}
          <div className="flex flex-col items-center text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full border font-serif text-2xl text-foreground"
              style={{
                borderColor: "var(--organism-accent-soft)",
                background: "color-mix(in oklch, var(--organism-accent) 8%, transparent)",
              }}
              aria-hidden="true"
            >
              {initial}
            </span>
            <p className="dot-label mt-4">
              Present
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground">
              {name}
            </h2>
            {user.is_owner && (
              <p className="mt-1 dot-label">
                Steward of this field
              </p>
            )}
          </div>

          {/* The doors a member has. */}
          <div className="mt-10 space-y-2">
            <PresenceAction
              icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
              label="Your conversations"
              hint="Pick up a thread with Minty"
              onClick={onOpenConversations}
            />
            {user.is_owner && (
              <PresenceAction
                icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
                label="Invite someone"
                hint="Grow the circle, one trusted invitation at a time"
                onClick={onInvite}
              />
            )}
            <PresenceAction
              icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
              label="Sign out"
              hint="Leave this field; your session ends here"
              onClick={onSignOut}
              muted
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PresenceAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  muted?: boolean;
}> = ({ icon, label, hint, onClick, muted }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
      muted
        ? "border-border/40 text-muted-foreground hover:text-foreground"
        : "border-border/50 text-foreground hover:border-[color:var(--organism-accent-soft)] hover:bg-foreground/[0.03]"
    }`}
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition-colors group-hover:text-foreground">
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium">{label}</span>
      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
        {hint}
      </span>
    </span>
    <ArrowRight
      className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
      aria-hidden="true"
    />
  </button>
);

export default PresenceSurface;
