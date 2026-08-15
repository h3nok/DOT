import { authedFetch } from "./orchestratorHttp";

const ORCHESTRATOR_BASE = (
  import.meta.env.VITE_ORCHESTRATOR_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const PRODUCT_PATH = "/v1/commerce/products/book-one-pdf";

export interface BookOneProduct {
  id: string;
  title: string;
  amount_minor: number;
  currency: string;
  available: boolean;
}

export interface BookOneEntitlement {
  product_id: string;
  entitled: boolean;
  status: string;
}

async function responseError(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => ({}));
  return typeof payload?.detail === "string" ? payload.detail : fallback;
}

export async function getBookOneProduct(): Promise<BookOneProduct> {
  const response = await fetch(`${ORCHESTRATOR_BASE}${PRODUCT_PATH}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Book purchase details are unavailable.");
  return response.json() as Promise<BookOneProduct>;
}

export async function getBookOneEntitlement(): Promise<BookOneEntitlement> {
  const response = await authedFetch(
    `${ORCHESTRATOR_BASE}${PRODUCT_PATH}/entitlement`,
    { sessionOnly: true },
  );
  if (!response.ok) {
    throw new Error(await responseError(response, "Could not verify book ownership."));
  }
  return response.json() as Promise<BookOneEntitlement>;
}

export async function createBookOneCheckout(): Promise<string> {
  const response = await authedFetch(`${ORCHESTRATOR_BASE}${PRODUCT_PATH}/checkout`, {
    method: "POST",
    sessionOnly: true,
  });
  if (!response.ok) {
    throw new Error(await responseError(response, "Could not start book purchase."));
  }
  const payload = (await response.json()) as { checkout_url?: string };
  if (!payload.checkout_url) throw new Error("Checkout response was incomplete.");
  return payload.checkout_url;
}

export async function downloadBookOnePdf(): Promise<void> {
  const response = await authedFetch(`${ORCHESTRATOR_BASE}${PRODUCT_PATH}/download`, {
    sessionOnly: true,
  });
  if (!response.ok) {
    throw new Error(await responseError(response, "Could not download the digital edition."));
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Digital-Organism-Theory-Book-One-Digital-Edition.pdf";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
