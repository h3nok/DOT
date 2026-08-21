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
        <h1 className="dot-page-heading mt-2">Publication Studio</h1>
        <p className="dot-caption mx-auto mt-4 max-w-sm">
          Sign in to open the private workspace. Public reading remains
          available without an account.
        </p>
        <button
          type="button"
          onClick={() => setSignInOpen(true)}
          className="dot-reading-action mt-7"
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
