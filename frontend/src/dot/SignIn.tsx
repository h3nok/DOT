import { ArrowRight, Orbit } from "lucide-react";

import { BloomSurface } from "./BloomSurface";

/**
 * The public doorway for the private layer of DOT.
 *
 * Membership is deliberately not available in this release. Keeping the
 * notice in the shared BloomSurface means every old sign-in entry point tells
 * the same truth, with no inactive form or implied wait-list.
 */

interface SignInProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
}

export const SignIn: React.FC<SignInProps> = ({
  origin,
  reducedMotion = false,
  onClose,
}) => (
  <BloomSurface
    kicker="private membership"
    title="Sign in is coming soon."
    description="The private layer is being prepared with the same care as the public work."
    origin={origin}
    reducedMotion={reducedMotion}
    zIndex={50}
    size="sm"
    onClose={onClose}
  >
    <div className="flex flex-col items-center text-center">
      <div
        className="relative grid h-24 w-24 place-items-center rounded-full border border-[color:var(--organism-accent-soft)] bg-background/35 shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_18px_48px_var(--organism-accent-soft)]"
        aria-hidden="true"
      >
        <span className="absolute inset-2 rounded-full border border-[color:var(--organism-accent-soft)]/70" />
        <span className="absolute inset-5 rounded-full bg-[color:var(--organism-accent-soft)]/45 blur-md" />
        <Orbit className="relative h-8 w-8 text-[color:var(--organism-accent-strong)]" />
      </div>

      <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Book One, the concept library, and Minty remain open. No account is
        needed to explore the public work.
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.07] px-4 text-sm font-semibold text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] transition-[background-color,transform] hover:bg-foreground/[0.11] active:translate-y-px"
      >
        Continue exploring
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </BloomSurface>
);

export default SignIn;
