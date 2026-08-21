import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  HeartHandshake,
  Linkedin,
  Loader2,
  LockKeyhole,
  ShoppingBag,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { DOT_BOOK_ONE_ROUTE } from "../../content/publications/dotBookOne";
import { siteConfig } from "../../content/site.config";
import { SignIn } from "../../dot/SignIn";
import { useAuth } from "../../dot/useAuth";
import {
  createBookOneCheckout,
  downloadBookOnePdf,
  getBookOneEntitlement,
  getBookOneProduct,
  type BookOneProduct,
} from "../../services/OrchestratorCommerceService";
import BookOneCover from "./BookOneCover";

const FALLBACK_PRICE = "$20.00";

/** The complete reader is public; authenticated ownership unlocks the stable PDF. */
export default function BookAccessPage() {
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<BookOneProduct | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [entitled, setEntitled] = useState(false);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState<"checkout" | "download" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  const price = product
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: product.currency.toUpperCase(),
      }).format(product.amount_minor / 100)
    : FALLBACK_PRICE;

  const checkOwnership = useCallback(async () => {
    if (!user) {
      setEntitled(false);
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const result = await getBookOneEntitlement();
      setEntitled(result.entitled);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not verify book ownership.");
    } finally {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    void getBookOneProduct()
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setProductLoading(false));
  }, []);

  useEffect(() => {
    if (!authLoading) void checkOwnership();
  }, [authLoading, checkOwnership]);

  const purchase = async () => {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    setBusy("checkout");
    setError(null);
    try {
      window.location.assign(await createBookOneCheckout());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start book purchase.");
      setBusy(null);
    }
  };

  const download = async () => {
    setBusy("download");
    setError(null);
    try {
      await downloadBookOnePdf();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not download the book.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="book-surface min-h-[100svh] bg-background px-5 pb-20 pt-6 text-foreground sm:px-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          DOT
        </Link>
        <span className="dot-label">
          Book One · Digital Edition
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center pb-12 pt-14 text-center sm:pt-20">
        <BookOneCover className="w-[min(19rem,78vw)]" />

        <p className="dot-label mt-12 text-[var(--book-cinnabar)]">
          Free complete reader · Paid digital ownership
        </p>
        <h2 className="dot-page-heading mt-4 max-w-3xl text-balance">
          Read freely. Own the digital edition for {price}.
        </h2>
        <a
          href={siteConfig.social.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
        >
          <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
          <strong>Henok Ghebrechristos, PhD</strong>
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
        <p className="book-reading-copy mt-6 max-w-xl text-balance text-lg italic leading-relaxed text-muted-foreground">
          The complete living edition remains public. Purchasing the stable PDF
          supports the movement and gives you an offline copy for study,
          annotation, and reference.
        </p>

        <div className="mt-12 w-full border-y border-border/60 text-left">
          <Link
            to={DOT_BOOK_ONE_ROUTE}
            className="group flex min-h-28 items-center gap-4 border-b border-border/60 px-2 py-6 transition-colors hover:bg-foreground/[0.03] sm:px-4"
          >
            <BookOpen className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="book-reading-heading block text-2xl font-semibold">
                Read the complete living edition
              </span>
              <span className="book-reading-copy mt-1 block text-sm leading-relaxed text-muted-foreground">
                Free, source-linked, and complete. No account or purchase required.
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>

          <button
            type="button"
            onClick={() => void (entitled ? download() : purchase())}
            disabled={
              authLoading ||
              productLoading ||
              checking ||
              busy !== null ||
              (!entitled && !product?.available)
            }
            className="group flex min-h-28 w-full items-center gap-4 px-2 py-6 text-left transition-colors hover:bg-foreground/[0.03] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
          >
            {busy || checking || authLoading || productLoading ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--book-cinnabar)]" aria-hidden="true" />
            ) : entitled ? (
              <Download className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]" aria-hidden="true" />
            ) : user ? (
              <ShoppingBag className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]" aria-hidden="true" />
            ) : (
              <LockKeyhole className="h-5 w-5 shrink-0 text-[var(--book-cinnabar)]" aria-hidden="true" />
            )}
            <span className="min-w-0 flex-1">
              <span className="book-reading-heading block text-2xl font-semibold">
                {entitled
                  ? "Download your digital edition"
                  : !product?.available
                    ? "Digital edition purchase is unavailable"
                  : user
                    ? `Purchase the PDF · ${price}`
                    : `Digital ownership coming soon · ${price}`}
              </span>
              <span className="book-reading-copy mt-1 block text-sm leading-relaxed text-muted-foreground">
                {entitled
                  ? "Your authenticated, tagged, searchable PDF is ready."
                  : user
                    ? "One-time purchase. Access is tied to your member account."
                    : "Accounts and purchasing will open with private membership."}
              </span>
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        </div>

        <p className="book-reading-copy mt-8 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Payment never changes what the public reader contains. It funds the
          work by turning the offline edition into a direct ownership purchase.
        </p>
        {error ? (
          <p className="mt-4 max-w-lg text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {user && !entitled ? (
          <button
            type="button"
            onClick={() => void checkOwnership()}
            className="mt-4 text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Already paid? Check ownership again
          </button>
        ) : null}
        <Link
          to="/support"
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[var(--book-cinnabar)]"
        >
          <HeartHandshake className="h-4 w-4" aria-hidden="true" />
          Support future books and tools
        </Link>
      </section>
      {signInOpen ? (
        <SignIn onClose={() => setSignInOpen(false)} />
      ) : null}
    </main>
  );
}
