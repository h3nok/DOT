import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import ReaderLeavePage from "./ReaderLeavePage";
import ReadersPage from "./ReadersPage";
import READERS from "../../content/readers.json";
import { OrganismProvider } from "../../organism/OrganismContext";
import { ThemeProvider } from "../../shared/contexts/SimpleThemeContext";

const server = vi.hoisted(() => ({
  available: null as boolean | null,
  availabilityError: null as string | null,
  leave: vi.fn<(token: string) => Promise<boolean>>(),
}));

vi.mock("../../dot/useReaderList", () => ({
  useReaderList: () => ({
    available: server.available,
    availabilityError: server.availabilityError,
    subscribe: vi.fn(),
    confirm: vi.fn(),
    unsubscribe: server.leave,
  }),
  leaveReaderList: server.leave,
}));

afterEach(() => {
  server.available = null;
  server.availabilityError = null;
  server.leave.mockReset();
  window.history.replaceState(null, "", "/");
});

const inRouter = (element: ReactElement) => render(
  <ThemeProvider><OrganismProvider><MemoryRouter>{element}</MemoryRouter></OrganismProvider></ThemeProvider>,
);
const TOKEN = "a".repeat(64);

describe("ReadersPage", () => {
  it("explains the full writing scope and its commitments before asking for an address", () => {
    server.available = true;
    inRouter(<ReadersPage />);

    expect(screen.getByRole("heading", { level: 1, name: READERS.heading })).toBeInTheDocument();
    for (const topic of READERS.topics) expect(screen.getByRole("heading", { name: topic.label })).toBeInTheDocument();
    expect(screen.queryByText(/Book Two is being written/)).not.toBeInTheDocument();
    expect(screen.getByText(/Nothing is sent until you confirm/)).toBeInTheDocument();
    expect(screen.getByText(/removes you in one click/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email address" })).toBeInTheDocument();
  });

  it("says the list is not open rather than showing a form that cannot work", () => {
    server.available = false;
    inRouter(<ReadersPage />);

    expect(screen.getByText("The list is not open yet.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Book One" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory",
    );
  });

  it("reports an availability failure without saying the list is closed", () => {
    server.available = false;
    server.availabilityError = "The service is unreachable.";
    inRouter(<ReadersPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The reader list could not be reached.",
    );
    expect(screen.queryByText("The list is not open yet.")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(within(screen.getByRole("main")).getByRole("link", { name: "Book One" })).toHaveAttribute(
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
