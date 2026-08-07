import { ArrowRight } from "lucide-react";
import { BloomSurface } from "./BloomSurface";
import type { InviteArrival } from "./useInviteArrival";

/**
 * InviteWelcome — the door opening for a guest who arrived by invitation.
 *
 * Instead of a gate, an invited visitor is met with a bloom from the centre of
 * the graph: who opened the door, their note, and a single warm way in. It
 * wears the same {@link BloomSurface} shell as every other surface — arriving
 * is just the graph greeting you, not a separate landing page.
 */

interface InviteWelcomeProps {
  /** Whose graph this is, for the greeting. */
  ownerName: string;
  arrival: InviteArrival | null;
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onEnter: () => void;
  onClose: () => void;
}

export const InviteWelcome: React.FC<InviteWelcomeProps> = ({
  ownerName,
  arrival,
  origin,
  reducedMotion = false,
  onEnter,
  onClose,
}) => {
  const inviter = arrival?.invited_by ?? ownerName;

  return (
    <BloomSurface
      kicker="you're invited"
      title={`${ownerName} opened a door`}
      description={`${inviter} invited you in. DOT grows by invitation, never by broadcast.`}
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={60}
      size="sm"
      onClose={onClose}
    >
      <p className="text-sm leading-7 text-muted-foreground">
        This is {ownerName}'s living profile — a graph you can explore, where
        every dot opens into its own world. Wander it, or consult the knowledge behind it.
      </p>
      <button
        type="button"
        onClick={onEnter}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
      >
        Step inside <ArrowRight className="h-4 w-4" />
      </button>
    </BloomSurface>
  );
};

export default InviteWelcome;
