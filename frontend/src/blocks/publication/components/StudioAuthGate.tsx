import { Loader2, LogIn } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { SignIn } from "../../../dot/SignIn";
import { useAuth } from "../../../dot/useAuth";
import { DotWordmark } from "../../../shared/DotWordmark";

export function StudioAuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="sr-only">Checking your session</span>
      </div>
    );
  }

  if (user) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-md border-block border-border/60 py-10 text-center">
        <Link to="/" className="font-mono text-xs uppercase text-muted-foreground">
          <DotWordmark />
        </Link>
        <p className="mt-8 font-mono dot-micro uppercase text-[color:var(--organism-accent-strong)]">
          Private workspace
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">Publication Studio</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Sign in to open the private workspace. Public reading remains
          available without an account.
        </p>
        <button
          type="button"
          onClick={() => setSignInOpen(true)}
          className="mt-7 inline-flex min-h-11 items-center gap-2 bg-foreground px-5 text-sm font-semibold text-background"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in
        </button>
      </section>

      {signInOpen && (
        <SignIn onClose={() => setSignInOpen(false)} />
      )}
    </main>
  );
}
