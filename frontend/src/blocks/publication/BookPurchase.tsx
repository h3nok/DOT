import { Check, Download, FileText, Loader2, LockKeyhole, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { bookReleaseAssetUrl } from "../../content/publications/dotBookOne";
import { formatAmount } from "../../dot/useSupport";
import NucleusMark from "../../dot/NucleusMark";
import { BookAction, BookCard } from "./BookPrimitives";
import {
  bookDownloadUrl,
  createBookCheckout,
  fetchBookCheckoutStatus,
  fetchBookProduct,
  type BookProduct,
} from "./bookPurchase";

type PurchaseState = "idle" | "checking" | "paid" | "processing" | "expired" | "cancelled";

interface BookPurchaseProps {
  onProduct?: (product: BookProduct | null) => void;
}

export default function BookPurchase({ onProduct }: BookPurchaseProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const returnParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnedSession = returnParams.get("session_id");
  const purchaseReturn = returnParams.get("purchase");
  const [product, setProduct] = useState<BookProduct | null>(null);
  const [productResolved, setProductResolved] = useState(false);
  const [state, setState] = useState<PurchaseState>(
    purchaseReturn === "cancelled" ? "cancelled" : returnedSession ? "checking" : "idle",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 5_000);
    void fetchBookProduct(controller.signal).then((result) => {
      if (!active) return;
      const nextProduct = result.ok && result.data ? result.data : null;
      setProduct(nextProduct);
      setProductResolved(true);
      onProduct?.(nextProduct);
    });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [onProduct]);

  useEffect(() => {
    if (!product) return;
    const script = document.createElement("script");
    script.id = "book-one-product-schema";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Book",
      name: product.title,
      author: { "@type": "Person", name: "Henok Ghebrechristos" },
      bookFormat: "https://schema.org/EBook",
      image: new URL(bookReleaseAssetUrl("cover.png"), window.location.origin).href,
      inLanguage: "en",
      offers: {
        "@type": "Offer",
        price: (product.amount_minor / 100).toFixed(2),
        priceCurrency: product.currency.toUpperCase(),
        availability: product.available
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: `${window.location.origin}/book/digital-organism-theory#own-the-edition`,
      },
    });
    document.getElementById(script.id)?.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, [product]);

  useEffect(() => {
    if (!returnedSession || purchaseReturn !== "thanks") return;
    setState("checking");
    void fetchBookCheckoutStatus(returnedSession).then((result) => {
      if (!result.ok || !result.data) {
        setError(result.error ?? "The purchase could not be confirmed.");
        setState("idle");
        return;
      }
      setState(result.data.status);
    });
  }, [purchaseReturn, returnedSession]);

  useEffect(() => {
    if (!purchaseReturn) return;
    const frame = window.requestAnimationFrame(() => {
      if (typeof sectionRef.current?.scrollIntoView === "function") {
        sectionRef.current.scrollIntoView({ block: "start", behavior: "auto" });
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("purchase");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [purchaseReturn]);

  const beginPurchase = async () => {
    if (!product?.available || busy) return;
    setBusy(true);
    setError(null);
    const result = await createBookCheckout(product.id);
    if (!result.ok || !result.data) {
      setError(result.error ?? "Checkout is unavailable right now.");
      setBusy(false);
      return;
    }
    window.location.assign(result.data.checkout_url);
  };

  return (
    <section
      ref={sectionRef}
      id="own-the-edition"
      className="book-purchase mx-auto mt-16 max-w-7xl scroll-mt-24 px-5 sm:px-8"
      aria-labelledby="book-purchase-title"
    >
      <BookCard className="book-purchase-layout">
        <div className="book-purchase-object" aria-hidden="true">
          <div className="book-purchase-spine" />
          <div className="book-purchase-cover">
            <NucleusMark size={130} reducedMotion className="book-manuscript-mark" />
          </div>
        </div>

        <div className="book-purchase-copy">
          <p className="book-overline">Keep the edition</p>
          <h2 id="book-purchase-title" className="book-section-title">
            Own a copy without losing the open reader.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--book-muted)]">
            Read the complete web edition here for free. Your purchase gives you the fixed,
            line-edited v2 PDF for offline reading and directly funds the work around it.
          </p>

          <dl className="book-purchase-details">
            <div>
              <FileText aria-hidden="true" />
              <dt>Format</dt>
              <dd>{product?.format ?? "PDF"} · digital download</dd>
            </div>
            <div>
              <LockKeyhole aria-hidden="true" />
              <dt>Checkout</dt>
              <dd>Hosted and receipted by Stripe</dd>
            </div>
            <div>
              <Check aria-hidden="true" />
              <dt>Edition</dt>
              <dd>{product?.edition ?? "Line-edited edition · v2"}</dd>
            </div>
          </dl>

          <div className="book-purchase-action" aria-live="polite">
            {state === "paid" && returnedSession ? (
              <BookAction asChild>
                <a href={bookDownloadUrl(returnedSession)} rel="noreferrer">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download your copy
                </a>
              </BookAction>
            ) : state === "checking" ? (
              <span className="book-purchase-status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Confirming payment with Stripe
              </span>
            ) : (
              <BookAction
                type="button"
                onClick={() => void beginPurchase()}
                disabled={!product?.available || busy}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                )}
                {product
                  ? `Buy the PDF · ${formatAmount(product.amount_minor, product.currency)}`
                  : productResolved
                    ? "Checkout unavailable"
                    : "Loading edition"}
              </BookAction>
            )}

            {state === "cancelled" && (
              <p>Nothing was charged. The complete web edition remains open to you.</p>
            )}
            {state === "processing" && (
              <p>Stripe is still confirming the payment. Return to this page in a moment.</p>
            )}
            {state === "expired" && <p>The checkout expired. Nothing was charged.</p>}
            {!product?.available && product && (
              <p>Checkout is being configured. You can read the complete edition now.</p>
            )}
            {productResolved && !product && (
              <p>Checkout is currently unavailable. The complete edition remains open.</p>
            )}
            {error && <p className="text-destructive">{error}</p>}
          </div>
        </div>
      </BookCard>
    </section>
  );
}
