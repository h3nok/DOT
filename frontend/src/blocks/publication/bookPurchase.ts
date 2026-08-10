import { api, ORCHESTRATOR_BASE } from "../../dot/orchestrator";

export interface BookProduct {
  id: string;
  title: string;
  edition: string;
  format: string;
  amount_minor: number;
  currency: string;
  available: boolean;
}

export interface BookCheckoutStatus {
  status: "paid" | "processing" | "expired";
  product_id: string;
}

const BOOK_SALES_PATH = "/v1/books/digital-organism-theory";

export async function fetchBookProduct(signal?: AbortSignal) {
  return api<BookProduct>(`${BOOK_SALES_PATH}/product`, { signal });
}

export async function createBookCheckout(productId: string) {
  return api<{ checkout_url: string; product: BookProduct }>(
    `${BOOK_SALES_PATH}/checkout-sessions`,
    { method: "POST", body: { product_id: productId } },
  );
}

export async function fetchBookCheckoutStatus(sessionId: string) {
  return api<BookCheckoutStatus>(
    `${BOOK_SALES_PATH}/checkout-sessions/${encodeURIComponent(sessionId)}`,
  );
}

export function bookDownloadUrl(sessionId: string): string {
  return `${ORCHESTRATOR_BASE}${BOOK_SALES_PATH}/checkout-sessions/${encodeURIComponent(sessionId)}/download`;
}
