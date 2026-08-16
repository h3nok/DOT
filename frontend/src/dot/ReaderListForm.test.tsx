import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReaderListForm } from "./ReaderListForm";

/**
 * ADR-0025 in the surface: the door is offered honestly, confirmation is not
 * optional, and nothing here counts anyone.
 */

const server = vi.hoisted(() => ({
  available: null as boolean | null,
  subscribe: vi.fn(),
  confirm: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("./useReaderList", () => ({
  useReaderList: () => ({
    available: server.available,
    subscribe: server.subscribe,
    confirm: server.confirm,
    unsubscribe: server.unsubscribe,
  }),
}));

afterEach(() => {
  server.available = null;
  server.subscribe.mockReset();
  server.confirm.mockReset();
  server.unsubscribe.mockReset();
});

describe("ReaderListForm", () => {
  it("renders nothing while the list's availability is unknown", () => {
    server.available = null;
    const { container } = render(<ReaderListForm />);

    // A form that might be dead is worse than no form at the end of a book.
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the list is closed", () => {
    server.available = false;
    const { container } = render(<ReaderListForm />);

    expect(container).toBeEmptyDOMElement();
  });

  it("takes an address and asks for a code before subscribing anyone", async () => {
    server.available = true;
    server.subscribe.mockResolvedValue({ accepted: { status: "ok", expires_in: 900 } });

    render(<ReaderListForm source="book" />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send me a code/i }));

    await waitFor(() =>
      expect(server.subscribe).toHaveBeenCalledWith("reader@example.com", "book"),
    );
    // Double opt-in is the whole guarantee: nothing is subscribed yet.
    expect(await screen.findByLabelText(/confirmation code/i)).toBeInTheDocument();
  });

  it("confirms the code and tells the reader how to leave", async () => {
    server.available = true;
    server.subscribe.mockResolvedValue({ accepted: { status: "ok", expires_in: 900 } });
    server.confirm.mockResolvedValue({ token: "a".repeat(64) });

    render(<ReaderListForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send me a code/i }));

    fireEvent.change(await screen.findByLabelText(/confirmation code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(await screen.findByText(/you will hear when there is more/i)).toBeInTheDocument();
    expect(screen.getByText(/removes you in one click/i)).toBeInTheDocument();
  });

  it("reports a rejected code instead of pretending it worked", async () => {
    server.available = true;
    server.subscribe.mockResolvedValue({ accepted: { status: "ok", expires_in: 900 } });
    server.confirm.mockResolvedValue({ error: "Incorrect code. 4 attempts left." });

    render(<ReaderListForm />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send me a code/i }));

    fireEvent.change(await screen.findByLabelText(/confirmation code/i), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect code/i);
    expect(screen.queryByText(/you will hear when there is more/i)).not.toBeInTheDocument();
  });

  it("shows no subscriber count anywhere (ADR-0004 L5)", async () => {
    server.available = true;
    server.subscribe.mockResolvedValue({ accepted: { status: "ok", expires_in: 900 } });
    server.confirm.mockResolvedValue({ token: "a".repeat(64) });

    const { container } = render(<ReaderListForm />);

    // No "join 1,200 readers", no member number, at any stage.
    expect(container.textContent).not.toMatch(/\b\d[\d,]*\s*(readers|subscribers|others|people)\b/i);
    expect(container.textContent).not.toMatch(/join \d/i);
  });
});
