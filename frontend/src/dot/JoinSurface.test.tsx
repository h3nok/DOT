import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JoinSurface } from "./JoinSurface";

// Both the static link and the server client are module-level, so the tests
// drive them through hoisted cells rather than re-importing per case.
const join = vi.hoisted(() => ({ url: null as string | null, email: false }));
vi.mock("./joinLink", () => ({
  get JOIN_URL() {
    return join.url;
  },
  get JOIN_IS_EMAIL() {
    return join.email;
  },
}));

const server = vi.hoisted(() => ({
  available: null as boolean | null,
  request: vi.fn(),
  verify: vi.fn(),
}));
vi.mock("./useJoin", () => ({
  useJoin: () => ({
    available: server.available,
    request: server.request,
    verify: server.verify,
  }),
}));

describe("JoinSurface", () => {
  afterEach(() => {
    join.url = null;
    join.email = false;
    server.available = null;
    vi.clearAllMocks();
  });

  it("fails closed when there is neither a queue nor an address to write to", () => {
    server.available = false;

    render(<JoinSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByRole("heading", { name: "Not open yet" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("falls back to writing to the steward when no server is reachable", () => {
    server.available = false;
    join.url = "mailto:henok@example.com?subject=Asking%20to%20join";
    join.email = true;

    render(<JoinSurface onClose={vi.fn()} reducedMotion />);

    const action = screen.getByRole("link", { name: "Write to Henok" });
    expect(action).toHaveAttribute("href", join.url);
    // An address opens the visitor's own mail client; forcing a new tab there
    // leaves a blank window behind.
    expect(action).not.toHaveAttribute("target");
  });

  it("collects an address and a reason once the queue is open", () => {
    server.available = true;

    render(<JoinSurface onClose={vi.fn()} reducedMotion />);

    expect(screen.getByLabelText("Your email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Why you want to join")).toBeInTheDocument();
    expect(screen.getByText(/stored encrypted/i)).toBeInTheDocument();
  });

  it("verifies the address before the request counts", async () => {
    server.available = true;
    server.request.mockResolvedValue({ accepted: { status: "awaiting_verification", expires_in: 900 } });
    server.verify.mockResolvedValue({ ok: true });

    render(<JoinSurface onClose={vi.fn()} reducedMotion />);

    fireEvent.change(screen.getByLabelText("Your email address"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask to join" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Confirm your address" })).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText("Six-digit code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Your address is confirmed" }),
      ).toBeInTheDocument(),
    );
    expect(server.verify).toHaveBeenCalledWith("reader@example.com", "123456");
  });

  it("surfaces a rejected code instead of pretending it worked", async () => {
    server.available = true;
    server.request.mockResolvedValue({ accepted: { status: "awaiting_verification", expires_in: 900 } });
    server.verify.mockResolvedValue({ ok: false, error: "Incorrect code. 4 attempts left." });

    render(<JoinSurface onClose={vi.fn()} reducedMotion />);

    fireEvent.change(screen.getByLabelText("Your email address"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask to join" }));
    await waitFor(() => screen.getByLabelText("Six-digit code"));

    fireEvent.change(screen.getByLabelText("Six-digit code"), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect code/i);
    expect(
      screen.queryByRole("heading", { name: "Your address is confirmed" }),
    ).not.toBeInTheDocument();
  });

  it("invents no queue position at any stage", () => {
    server.available = true;

    render(<JoinSurface onClose={vi.fn()} reducedMotion />);

    // ADR-0004 bans manufactured scarcity, and a position is its cheapest form.
    expect(
      screen.queryByText(/\d+ (?:people|others) (?:ahead|waiting)|spots? left|closing soon/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/no queue position to\s+watch/i)).toBeInTheDocument();
  });
});
