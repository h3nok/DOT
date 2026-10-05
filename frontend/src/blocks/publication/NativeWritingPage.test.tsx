import { render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import NativeWritingPage from "./NativeWritingPage";
import { fetchWritingDelivery } from "../../services/OrchestratorWritingService";

vi.mock("../../services/OrchestratorWritingService", async (original) => ({ ...await original<typeof import("../../services/OrchestratorWritingService")>(), fetchWritingDelivery: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const open = () => render(<HelmetProvider><MemoryRouter initialEntries={["/writing/work-1/releases/2"]}><Routes><Route path="/writing/:workId/releases/:releaseNumber" element={<NativeWritingPage />} /></Routes></MemoryRouter></HelmetProvider>);

describe("NativeWritingPage", () => {
  it("reads the complete owned text, source ledger and exact release", async () => {
    vi.mocked(fetchWritingDelivery).mockResolvedValue({ delivery: { manifest: { title: "Released analysis", summary: "A summary", release: { number: 2 }, revision: { content_hash: "hash" }, claims: [{ statement: "A declared claim", epistemic_level: "Model", origin: "sourced" }], sources: [{ external_uri: "https://example.org/source", locator: "Section 1", relation: "cites" }] } }, body: "The complete author-supplied text." });
    open();
    expect(await screen.findByRole("heading", { name: "Released analysis" })).toBeInTheDocument();
    expect(screen.getByText("The complete author-supplied text.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.org/source" })).toBeInTheDocument();
    expect(fetchWritingDelivery).toHaveBeenCalledWith("work-1", 2, expect.any(AbortSignal));
    expect(screen.getByRole("link", { name: "https://dotheory.org/writing/work-1/releases/2" })).toBeInTheDocument();
  });

  it("keeps the withdrawal record without rendering the withdrawn body", async () => {
    vi.mocked(fetchWritingDelivery).mockResolvedValue({ delivery: { withdrawn: true, title: "Withdrawn analysis", reason: "Correction pending" }, body: "" });
    open();
    expect(await screen.findByText("This release has been withdrawn.")).toBeInTheDocument();
    expect(screen.getByText("Correction pending")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Share publication" })).toBeNull();
  });
});