import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicationSharing } from "./PublicationSharing";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("PublicationSharing", () => {
  it("lets readers choose any supported app through their device share sheet", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    render(<PublicationSharing title="Released letter" path="/writing/work-1/releases/1" />);
    fireEvent.click(screen.getByRole("button", { name: "Share…" }));
    expect(share).toHaveBeenCalledWith({ title: "Released letter", url: "https://dotheory.org/writing/work-1/releases/1/" });
  });
  it("shares the owned URL, not an external article or localhost", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<PublicationSharing title="My analysis" path="/essays/my-analysis" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Copied.");
    expect(writeText).toHaveBeenCalledWith("https://dotheory.org/essays/my-analysis/");
    expect(screen.getByRole("link", { name: "Share on LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fdotheory.org%2Fessays%2Fmy-analysis%2F");
    expect(screen.queryByRole("button", { name: "Copy title and link" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Export sharing text" })).toBeNull();
  });

  it("keeps distribution packages available in the author's workspace", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<PublicationSharing title="My analysis" path="/essays/my-analysis" distributionTools />);
    fireEvent.click(screen.getByRole("button", { name: "Copy title and link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Copied.");
    expect(writeText).toHaveBeenCalledWith("My analysis\n\nhttps://dotheory.org/essays/my-analysis/\n");
    expect(screen.getByRole("button", { name: "Export sharing text" })).toBeInTheDocument();
  });

  it("offers the visible address if clipboard access fails", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
    render(<PublicationSharing title="My analysis" path="/essays/my-analysis" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Clipboard unavailable");
    expect(screen.getByRole("link", { name: "https://dotheory.org/essays/my-analysis/" })).toBeInTheDocument();
  });
});
