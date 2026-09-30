import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import ReaderLeavePage from "./ReaderLeavePage";
import ReadersPage from "./ReadersPage";

const server = vi.hoisted(() => ({
  available: null as boolean | null,
  leave: vi.fn<(token: string) => Promise<boolean>>(),
}));

vi.mock("../../dot/useReaderList", () => ({
  useReaderList: () => ({
    available: server.available,
    subscribe: vi.fn(),
    confirm: vi.fn(),
    unsubscribe: server.leave,
  }),
  leaveReaderList: server.leave,
}));

afterEach(() => {
  server.available = null;
  server.leave.mockReset();
  window.history.replaceState(null, "", "/");
});

const inRouter = (element: ReactElement) => render(<MemoryRouter>{element}</MemoryRouter>);
const TOKEN = "a".repeat(64);

describe("ReadersPage", () => {
  it("states its commitments before asking for anything", () => {
    server.available = true;
    inRouter(<ReadersPage />);

    expect(screen.getByRole("heading", { level: 1, name: "The reader list" })).toBeInTheDocument();
    expect(screen.getByText(/Nothing is sent until you confirm/)).toBeInTheDocument();
    expect(screen.getByText(/removes you in one click/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email address" })).toBeInTheDocument();
  });

  it("says the list is not open rather than showing a form that cannot work", () => {
    server.available = false;
    inRouter(<ReadersPage />);

    expect(screen.getByText("The list is not open yet.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("link", { name: "Book One" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory",
    );
  });
});

describe("ReaderLeavePage", () => {
  it("removes the reader on arrival, once, and keeps the token out of history", async () => {
    server.leave.mockResolvedValue(true);
    window.history.replaceState(null, "", `/readers/leave#${TOKEN}`);
    inRouter(<ReaderLeavePage />);

    expect(
      await screen.findByRole("heading", { name: "You have left the reader list." }),
    ).toBeInTheDocument();
    expect(server.leave).toHaveBeenCalledTimes(1);
    expect(server.leave).toHaveBeenCalledWith(TOKEN);
    expect(window.location.hash).toBe("");
  });

  it("offers a person to write to when the server cannot be reached", async () => {
    server.leave.mockResolvedValue(false);
    window.history.replaceState(null, "", `/readers/leave#${TOKEN}`);
    inRouter(<ReaderLeavePage />);

    expect(await screen.findByRole("heading", { name: "That did not go through." })).toBeInTheDocument();
    expect(screen.getByText(/removed by hand/)).toBeInTheDocument();
  });

  it("does nothing with an incomplete link except say so", async () => {
    window.history.replaceState(null, "", "/readers/leave#short");
    inRouter(<ReaderLeavePage />);

    expect(screen.getByRole("heading", { name: "This link is incomplete." })).toBeInTheDocument();
    await waitFor(() => expect(server.leave).not.toHaveBeenCalled());
  });
});
