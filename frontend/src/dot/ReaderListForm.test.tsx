import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReaderListForm } from "./ReaderListForm";

/**
 * ADR-0025 in the surface: the door is offered honestly, confirmation is not
 * optional, and nothing here counts anyone.
 */

const server = vi.hoisted(() => ({
  available: null as boolean | null,
  availabilityError: null as string | null,
  subscribe: vi.fn(),
  confirm: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("./useReaderList", () => ({
  useReaderList: () => ({
    available: server.available,
    availabilityError: server.availabilityError,
    subscribe: server.subscribe,
    confirm: server.confirm,
    unsubscribe: server.unsubscribe,
  }),
}));

afterEach(() => {
  server.available = null;
  server.availabilityError = null;
  server.subscribe.mockReset();
  server.confirm.mockReset();
  server.unsubscribe.mockReset();
});

describe("ReaderListForm", () => {
  it("lets the dedicated list page show a loading state without offering a dead form", () => {
    render(<ReaderListForm loadingFallback={<p role="status">Checking availability…</p>} />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking availability…");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("allows a corrected address to receive a new code and clears the old challenge", async () => {
    server.available = true;
    server.subscribe.mockResolvedValue({ accepted: { status: "ok", expires_in: 900 } });
    server.confirm.mockResolvedValue({ error: "Incorrect code." });
    render(<ReaderListForm source="front" />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "wrong@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send me a code" }));
    const code = await screen.findByLabelText("Confirmation code");
    expect(code).toHaveFocus();
    fireEvent.change(code, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Change address or request a new code" }));
    const address = screen.getByLabelText("Email address");
    expect(address).toHaveFocus();
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.change(address, { target: { value: "correct@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send me a code" }));
    expect(await screen.findByLabelText("Confirmation code")).toHaveValue("");
    expect(server.subscribe).toHaveBeenLastCalledWith("correct@example.com", "front");
  });

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

  it("says what a page offers instead once the list is known to be closed", () => {
    server.available = false;
    render(<ReaderListForm fallback={<p>Not open yet</p>} />);

    expect(screen.getByText("Not open yet")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("holds that back while it is still unknown whether the list is open", () => {
    server.available = null;
    const { container } = render(<ReaderListForm fallback={<p>Not open yet</p>} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not claim the list is closed when its status cannot be reached", () => {
    server.available = false;
    server.availabilityError = "The service is unreachable.";
    render(
      <ReaderListForm
        fallback={<p>Not open yet</p>}
        unavailableFallback={<p>Could not reach the list</p>}
      />,
    );

    expect(screen.getByText("Could not reach the list")).toBeInTheDocument();
    expect(screen.queryByText("Not open yet")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("keeps an unavailable optional form out of a completed reading surface", () => {
    server.available = false;
    server.availabilityError = "The service is unreachable.";
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

    expect(await screen.findByRole("status")).toHaveTextContent("You’re on the reader list.");
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
    expect(screen.queryByText("You’re on the reader list.")).not.toBeInTheDocument();
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
