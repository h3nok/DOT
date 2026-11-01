import { ArrowRight, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { BloomSurface } from "./BloomSurface";
import { useAuth } from "./useAuth";

interface SignInProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
  /** Present when someone arrives through an invitation link. */
  inviteToken?: string;
  /** Where to go once signed in. Defaults to reloading the current page. */
  onSignedIn?: () => void;
}

export const SignIn: React.FC<SignInProps> = ({
  origin,
  reducedMotion = false,
  onClose,
  inviteToken,
  onSignedIn,
}) => {
  const { requestCode, verifyCode } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    const result = await requestCode(email.trim(), inviteToken);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send code.");
      return;
    }
    // In dev mode the code is returned directly.
    if (result.devCode) setCode(result.devCode);
    setStep("code");
    requestAnimationFrame(() => codeRef.current?.focus());
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    const result = await verifyCode(email.trim(), code.trim(), displayName.trim() || undefined, inviteToken);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not verify.");
      if (result.codeAccepted) {
        setCode("");
        setStep("email");
      }
      return;
    }
    // Signed in — reload so every provider picks up the session.
    if (onSignedIn) onSignedIn();
    else window.location.reload();
  };

  const inputClass =
    "min-h-11 w-full rounded-lg border border-border/60 bg-background/70 px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[color:var(--organism-accent-strong)] focus:ring-1 focus:ring-[color:var(--organism-accent-soft)]";
  const submitClass =
    "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50";

  return (
    <BloomSurface
      kicker="private membership"
      title={step === "code" ? "Enter your code" : inviteToken ? "Accept your invitation" : "Sign in"}
      description={
        step === "email"
          ? "A one-time code will be sent to your email."
          : `A code was sent to ${email}.`
      }
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={50}
      size="sm"
      onClose={onClose}
    >
      {step === "email" ? (
        // The keys keep each step's DOM separate. Reusing a button across steps would
        // turn "Use a different email" into a submit button in the middle of its click.
        <form key="email" onSubmit={handleRequestCode}>
          {inviteToken && (
            <>
              <label className="mb-1.5 block text-xs text-muted-foreground" htmlFor="signin-name">
                Your name (optional)
              </label>
              <input
                id="signin-name"
                type="text"
                autoComplete="name"
                maxLength={128}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`${inputClass} mb-3`}
              />
            </>
          )}
          <label className="sr-only" htmlFor="signin-email">
            Email address
          </label>
          <input
            id="signin-email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          {error && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || !email.trim()} className={submitClass}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      ) : (
        <form key="code" onSubmit={handleVerifyCode}>
          <label className="sr-only" htmlFor="signin-code">
            One-time code
          </label>
          <input
            ref={codeRef}
            id="signin-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClass}
          />
          {error && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || !code.trim()} className={submitClass}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
          </button>
          <button
            type="button"
            onClick={() => { setStep("email"); setCode(""); setError(null); }}
            className="mt-3 min-h-11 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </form>
      )}
    </BloomSurface>
  );
};

export default SignIn;
