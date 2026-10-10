import { fireEvent, render, screen, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import NativeWritingPage from "./NativeWritingPage";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";
import { fetchWritingDelivery } from "../../services/OrchestratorWritingService";

vi.mock("../../services/OrchestratorWritingService", async (original) => ({ ...await original<typeof import("../../services/OrchestratorWritingService")>(), fetchWritingDelivery: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const open = () => render(<HelmetProvider><MemoryRouter initialEntries={["/writing/work-1/releases/2"]}><Routes><Route path="/writing/:workId/releases/:releaseNumber" element={<NativeWritingPage />} /></Routes></MemoryRouter></HelmetProvider>, { wrapper: PublicPageTestProvider });

describe("NativeWritingPage", () => {
  it("reads the complete owned text, source ledger and exact release", async () => {
    vi.mocked(fetchWritingDelivery).mockResolvedValue({ delivery: { manifest: { title: "Released analysis", summary: "A summary", release: { number: 2 }, revision: { content_hash: "hash" }, claims: [{ statement: "A declared claim", epistemic_level: "Model", origin: "sourced" }], sources: [{ external_uri: "https://example.org/source", locator: "Section 1", relation: "cites" }] } }, body: "The complete author-supplied text." });
    open();
    expect(await screen.findByRole("heading", { name: "Released analysis" })).toBeInTheDocument();
    expect(screen.getByText("The complete author-supplied text.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.org/source" })).toBeInTheDocument();
    expect(fetchWritingDelivery).toHaveBeenCalledWith("work-1", 2, expect.any(AbortSignal));
    expect(screen.getByRole("link", { name: "https://dotheory.org/writing/work-1/releases/2" })).toBeInTheDocument();
    expect(screen.getByText("End of piece")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/blog");
    expect(within(screen.getByRole("navigation", { name: "Primary" })).getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the withdrawal record without rendering the withdrawn body", async () => {
    vi.mocked(fetchWritingDelivery).mockResolvedValue({ delivery: { withdrawn: true, title: "Withdrawn analysis", reason: "Correction pending" }, body: "" });
    open();
    expect(await screen.findByText("This release has been withdrawn.")).toBeInTheDocument();
    expect(screen.getByText("Correction pending")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Share publication" })).toBeNull();
  });

  it("recovers a shared link after a network failure without exposing backend errors", async () => {
    vi.mocked(fetchWritingDelivery).mockRejectedValueOnce(new Error('{"detail":"Internal server error"}'))
      .mockResolvedValueOnce({ delivery: { manifest: { title: "Recovered letter", summary: null, release: { number: 2 }, revision: { content_hash: "hash" }, claims: [] } }, body: "The letter." });
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent("This piece could not be loaded. Please try again.");
    expect(screen.queryByText(/Internal server error/)).toBeNull();
    expect(screen.getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/blog");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Recovered letter" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("gives an unknown address a way back without offering a futile retry", async () => {
    vi.mocked(fetchWritingDelivery).mockRejectedValueOnce(new Error("404 Not Found"));
    open();
    expect(await screen.findByRole("alert")).toHaveTextContent("There is no published piece at this address.");
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/blog");
  });
});
