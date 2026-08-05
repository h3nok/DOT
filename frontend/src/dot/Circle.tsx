import { motion } from "framer-motion";
import { Loader2, Users } from "lucide-react";
import { staggerChild } from "../organism";
import { BloomSurface } from "./BloomSurface";
import { useCircle, type CircleMember } from "./useCircle";

/**
 * Circle — the networking surface, personal-first.
 *
 * Who is connected to this person. The circle begins with just the owner and
 * grows one accepted invitation at a time, so on a fresh profile it is quiet by
 * design — a held space, not a follower count. Each member is a presence, not a
 * metric. It wears the same {@link BloomSurface} shell as everything else.
 */

interface CircleSurfaceProps {
  ownerName: string;
  isOwner: boolean;
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onInvite?: () => void;
  onClose: () => void;
}

function initialOf(name: string): string {
  return (name.trim()[0] ?? "·").toUpperCase();
}

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

const MemberRow: React.FC<{ member: CircleMember; reducedMotion: boolean }> = ({
  member,
  reducedMotion,
}) => (
  <motion.li
    variants={staggerChild}
    custom={reducedMotion}
    className="flex items-center gap-3 rounded-2xl border border-border/50 bg-foreground/[0.02] px-4 py-3"
  >
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold"
      style={{
        border: "1px solid var(--organism-accent-soft)",
        color: "var(--organism-accent-strong)",
      }}
    >
      {initialOf(member.display_name ?? "")}
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-foreground">
        {member.display_name ?? "A member"}
      </p>
    </div>
    {member.joined_at && (
      <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {formatDate(member.joined_at)}
      </span>
    )}
  </motion.li>
);

export const CircleSurface: React.FC<CircleSurfaceProps> = ({
  ownerName,
  isOwner,
  origin,
  reducedMotion = false,
  onInvite,
  onClose,
}) => {
  // A circle is private to the member who holds it, so only the owner reads it.
  const { circle, loading } = useCircle(Boolean(isOwner));
  const count = circle?.count ?? 0;

  return (
    <BloomSurface
      kicker="circle"
      title={count === 0 ? `${ownerName}, for now` : `A circle of ${count}`}
      description="People connected by invitation — a held space, not a follower count."
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={55}
      size="md"
      onClose={onClose}
      footer={
        isOwner ? (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/[0.1]"
          >
            <Users className="h-3.5 w-3.5" />
            Invite someone
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Users className="h-7 w-7 text-muted-foreground/60" />
          <p className="max-w-xs text-sm italic leading-relaxed text-muted-foreground">
            The circle begins with one. It grows only by invitation — slowly, on
            purpose.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {circle?.members.map((m, i) => (
            <MemberRow
              key={`${m.display_name ?? "member"}-${i}`}
              member={m}
              reducedMotion={reducedMotion}
            />
          ))}
        </ul>
      )}
    </BloomSurface>
  );
};

export default CircleSurface;
