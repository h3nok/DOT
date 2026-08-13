import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TwinSurface } from "./TwinSurface";
import { listThreads, loadEphemeralTurns, sendMessageStream } from "./twinChat";

vi.mock("../organism", () => ({
  staggerChild: {},
  staggerContainer: {},
  useOrganismPulse: () => vi.fn(),
}));

vi.mock("./TwinFeedback", () => ({ TwinFeedback: () => null }));

vi.mock("./twinChat", () => ({
  clearEphemeralTurns: vi.fn(),
  deleteThread: vi.fn(async () => true),
  listThreads: vi.fn(async () => ({ threads: [], authenticated: false })),
  loadEphemeralTurns: vi.fn(() => []),
  loadThread: vi.fn(async () => []),
  saveEphemeralTurns: vi.fn(),
  sendMessage: vi.fn(),
  sendMessageStream: vi.fn(async () => ({
    ephemeral: true,
    turn: {
      id: "answer-1",
      role: "twin",
      content: "A grounded answer.",
      citations: [],
      refusal_code: null,
    },
  })),
}));

function renderMinty(variant: "focus" | "sidecar" = "focus") {
  return render(
    <MemoryRouter>
      <TwinSurface
        variant={variant}
        reducedMotion
        onClose={vi.fn()}
        onOpenNode={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe("TwinSurface", () => {
  beforeEach(() => {
    vi.mocked(listThreads).mockResolvedValue({
      threads: [],
      authenticated: false,
    });
    vi.mocked(sendMessageStream).mockClear();
    delete document.documentElement.dataset.mintyModal;
  });

  afterEach(() => {
    delete document.documentElement.dataset.mintyModal;
  });

  it("sends with Enter and keeps Shift+Enter for a new line", async () => {
    renderMinty();
    await waitFor(() => expect(listThreads).toHaveBeenCalled());

    const composer = screen.getByRole("textbox", { name: /Ask Minty/i });
    fireEvent.change(composer, { target: { value: "What does DOT claim?" } });
    fireEvent.keyDown(composer, { key: "Enter", shiftKey: true });
    expect(sendMessageStream).not.toHaveBeenCalled();

    fireEvent.keyDown(composer, { key: "Enter" });
    await waitFor(() =>
      expect(sendMessageStream).toHaveBeenCalledWith(
        "What does DOT claim?",
        [],
        "ground",
        expect.any(Function),
      ),
    );
  });

  it("treats a viewport-filling mobile sidecar as a modal", async () => {
    const view = renderMinty("sidecar");

    expect(screen.getByRole("dialog", { name: /Minty/i })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    await waitFor(() =>
      expect(document.documentElement.dataset.mintyModal).toBe("true"),
    );

    view.unmount();
    expect(document.documentElement.dataset.mintyModal).toBeUndefined();
  });

  it("renders a Markdown comparison table exactly once", async () => {
    vi.mocked(loadEphemeralTurns).mockReturnValueOnce([
      {
        id: "comparison",
        role: "twin",
        content: "| Model | Boundary |\n| --- | --- |\n| DOT | Held as a model |",
        citations: [],
        refusal_code: null,
      },
    ]);

    renderMinty();

    await waitFor(() => expect(screen.getAllByRole("table")).toHaveLength(1));
    expect(screen.getByRole("columnheader", { name: "Model" })).toBeVisible();
  });

  it("keeps book and academic provenance distinct", async () => {
    vi.mocked(loadEphemeralTurns).mockReturnValueOnce([
      {
        id: "research-answer",
        role: "twin",
        content: "Book One proposes a model. A paper reports a related result.",
        citations: [
          {
            node_id: "book-1",
            kind: "chunk",
            label: "Book One · The Painting",
            locator: {
              section: "the-painting",
              heading: "the-first-painting",
            },
          },
          {
            node_id: "crossref:10.1000/example",
            kind: "scholarly_work",
            label: "A. Researcher (2025) · A related paper",
            locator: {
              provider: "Crossref",
              href: "https://doi.org/10.1000/example",
              scholar_url: "https://scholar.google.com/scholar?q=example",
            },
          },
        ],
        refusal_code: null,
      },
    ]);

    renderMinty();

    await waitFor(() => expect(screen.getByText("Crossref abstract")).toBeVisible());
    expect(screen.getByText("Book One")).toBeVisible();
    expect(screen.getByRole("link", { name: /Open paper/i })).toHaveAttribute(
      "href",
      "https://doi.org/10.1000/example",
    );
    expect(screen.getByRole("link", { name: /Check Google Scholar/i })).toHaveAttribute(
      "href",
      "https://scholar.google.com/scholar?q=example",
    );
  });
});
