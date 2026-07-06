import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "./useAuth";
import { BloomSurface } from "./BloomSurface";

/**
 * SignIn — the owner's quiet door, blooming from the centre of the graph.
 *
 * A two-step surface: enter an email, receive a six-digit code, enter it. On
 * success the session cookie unlocks authoring. It wears the same
 * {@link BloomSurface} shell as every other focused surface — there is no
 * separate "login screen", only the graph opening a door at its centre. In
 * local dev the code is shown inline; in production it arrives by email.
 */

interface SignInProps {
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  onClose: () => void;
  onSignedIn?: () => void;
}

export const SignIn: React.FC<SignInProps> = ({
  origin,
  reducedMotion = false,
  onClose,
  onSignedIn,
}) => {
  const { requestCode, verifyCode } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await requestCode(email.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send code.");
      return;
    }
    setDevCode(result.devCode ?? null);
    setStep("code");
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not verify.");
      return;
    }
    onSignedIn?.();
    onClose();
  };

  return (
    <BloomSurface
      kicker={step === "email" ? "sign in" : "enter code"}
      title={step === "email" ? "Your quiet door" : "Check your inbox"}
      description={
        step === "email"
          ? "Enter your email and a one-time code will find you."
          : `A six-digit code is on its way to ${email}.`
      }
      origin={origin}
      reducedMotion={reducedMotion}
      zIndex={50}
      size="sm"
      onClose={onClose}
    >
      {step === "email" ? (
        <form onSubmit={submitEmail}>
          <input
            type="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy || email.trim().length < 3}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send code <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode}>
          {devCode && (
            <p className="mb-3 rounded-xl border border-border/50 bg-foreground/[0.04] px-3 py-2 text-xs text-muted-foreground">
              Dev code:{" "}
              <span className="font-mono text-base tracking-[0.3em] text-foreground">
                {devCode}
              </span>
            </p>
          )}
          <input
            ref={codeRef}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] outline-none transition-colors focus:border-[color:var(--organism-accent-soft)]"
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--organism-accent-soft)] bg-foreground/[0.06] px-4 py-3 text-sm font-semibold text-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Verify & sign in"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="mt-3 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Use a different email
          </button>
        </form>
      )}
    </BloomSurface>
  );
};

export default SignIn;
