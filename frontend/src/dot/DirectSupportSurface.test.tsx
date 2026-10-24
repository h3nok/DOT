import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DirectSupportMethod } from "../content/supportMethods.js";
import { DirectSupportSurface } from "./DirectSupportSurface";

const methods: DirectSupportMethod[] = [
  { id: "zelle", label: "Zelle", recipient: "author@example.com", recipientName: "Example Author" },
  { id: "cashapp", label: "Cash App", url: "https://cash.app/$example" },
];
const show = (onCard = vi.fn()) => render(<DirectSupportSurface methods={methods} onClose={vi.fn()} onCard={onCard} reducedMotion />);

describe("direct author support", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("copies the exact Zelle recipient without reporting a payment", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    show();
    expect(screen.getByText("Example Author")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy Zelle recipient" }));
    expect(writeText).toHaveBeenCalledWith("author@example.com");
    expect(await screen.findByRole("status")).toHaveTextContent("Open Zelle in your banking app");
    expect(screen.getByText(/This page cannot confirm a direct transfer/)).toBeInTheDocument();
    expect(screen.queryByText(/payment received|payment confirmed/i)).toBeNull();
  });

  it("leaves the recipient selectable when clipboard access fails", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Unavailable")) } });
    show();
    fireEvent.click(screen.getByRole("button", { name: "Copy Zelle recipient" }));
    expect(await screen.findByRole("status")).toHaveTextContent("select and copy");
    expect(screen.getByText("author@example.com")).toBeInTheDocument();
  });

  it("opens only the configured Cash App destination and offers card checkout separately", () => {
    const onCard = vi.fn();
    show(onCard);
    fireEvent.change(screen.getByRole("combobox", { name: "Support method" }), { target: { value: "cashapp" } });
    expect(screen.getByRole("link", { name: "Continue to Cash App" })).toHaveAttribute("href", "https://cash.app/$example");
    expect(screen.getByRole("link", { name: "Continue to Cash App" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("button", { name: "Copy Zelle recipient" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Use card checkout instead" }));
    expect(onCard).toHaveBeenCalledOnce();
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });
});
