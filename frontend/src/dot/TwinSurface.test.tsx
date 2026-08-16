import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

/** Docking is only offered where the text still has room beside it. */
function mockViewport(wide: boolean) {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: wide,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderMinty(
  variant: "focus" | "sidecar" = "focus",
  reading: { section: string; title?: string } | null = null,
) {
  return render(
    <MemoryRouter>
      <TwinSurface
        variant={variant}
        reducedMotion
        reading={reading}
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
    delete document.documentElement.dataset.mintySidecar;
    document.documentElement.style.removeProperty("--minty-sidecar-width");
    window.localStorage.clear();
    mockViewport(false);
  });

  afterEach(() => {
    delete document.documentElement.dataset.mintyModal;
    delete document.documentElement.dataset.mintySidecar;
    document.documentElement.style.removeProperty("--minty-sidecar-width");
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
        null,
      ),
    );
  });

  it("asks from where the reader is standing in the book", async () => {
    // "What is this guy talking about?" is answerable to anyone looking at the
    // page and to nobody reading only the sentence. The open chapter travels
    // with the question so the reference has something to resolve against.
    renderMinty("sidecar", { section: "the-canvas", title: "The Canvas" });
    await waitFor(() => expect(listThreads).toHaveBeenCalled());

    const composer = screen.getByRole("textbox", { name: /Ask Minty/i });
    fireEvent.change(composer, {
      target: { value: "What is this guy talking about?" },
    });
    fireEvent.keyDown(composer, { key: "Enter" });

    await waitFor(() =>
      expect(sendMessageStream).toHaveBeenCalledWith(
        "What is this guy talking about?",
        [],
        "ground",
        expect.any(Function),
        { section: "the-canvas", title: "The Canvas" },
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

  it("publishes the dock's width, so the page it sits beside makes room", async () => {
    // Wide enough for docking to be real; below `lg` there is no width to give.
    mockViewport(true);
    const view = renderMinty("sidecar");
    const root = document.documentElement;

    await waitFor(() =>
      expect(root.style.getPropertyValue("--minty-sidecar-width")).toBe("416px"),
    );

    // The edge is a resizer, and it moves without a pointer.
    const edge = screen.getByRole("separator", { name: "Resize Minty" });
    fireEvent.keyDown(edge, { key: "ArrowLeft" });

    await waitFor(() =>
      expect(root.style.getPropertyValue("--minty-sidecar-width")).toBe("440px"),
    );
    expect(edge).toHaveAttribute("aria-valuenow", "440");
    expect(window.localStorage.getItem("dot.minty.sidecar")).toBe("440");

    fireEvent.keyDown(edge, { key: "Home" });
    await waitFor(() =>
      expect(root.style.getPropertyValue("--minty-sidecar-width")).toBe("416px"),
    );

    // Closed, the page keeps none of the dock's width.
    view.unmount();
    expect(root.style.getPropertyValue("--minty-sidecar-width")).toBe("");
    expect(root.dataset.mintySidecar).toBeUndefined();
  });

  it("reopens at the width the reader left it", async () => {
    mockViewport(true);
    window.localStorage.setItem("dot.minty.sidecar", "520");

    renderMinty("sidecar");

    await waitFor(() =>
      expect(
        document.documentElement.style.getPropertyValue("--minty-sidecar-width"),
      ).toBe("520px"),
    );
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

  it("typesets mathematical notation and structures labeled explanations", async () => {
    vi.mocked(loadEphemeralTurns).mockReturnValueOnce([
      {
        id: "mathematical-answer",
        role: "twin",
        content: [
          "**Rendering Latency:** Intent precedes bodily change, $RL \\ge 0$.",
          "",
          "$$",
          "T \\times E",
          "$$",
        ].join("\n"),
        citations: [],
        refusal_code: null,
      },
    ]);

    const { container } = renderMinty();

    await waitFor(() =>
      expect(container.querySelectorAll(".minty-answer .katex")).toHaveLength(2),
    );
    expect(container.querySelector(".minty-answer .katex-display")).toBeVisible();
    expect(screen.getByText("Rendering Latency:").parentElement).toHaveClass(
      "minty-answer-label",
    );
  });

  it("typesets complete notation while an answer is still streaming", async () => {
    let finishStream: (() => void) | undefined;
    vi.mocked(sendMessageStream).mockImplementationOnce(
      async (_question, _history, _lens, onDelta) => {
        onDelta("The state updates as $S_{t + 1} = F(S_t)$.");
        return new Promise((resolve) => {
          finishStream = () =>
            resolve({
              ephemeral: true,
              turn: {
                id: "streamed-math",
                role: "twin",
                content: "The state updates as $S_{t + 1} = F(S_t)$.",
                citations: [],
                refusal_code: null,
              },
            });
        });
      },
    );

    const { container } = renderMinty();
    await waitFor(() => expect(listThreads).toHaveBeenCalled());

    const composer = screen.getByRole("textbox", { name: /Ask Minty/i });
    fireEvent.change(composer, { target: { value: "Show the state update." } });
    fireEvent.keyDown(composer, { key: "Enter" });

    await waitFor(() =>
      expect(
        container.querySelector(".minty-answer--streaming .katex"),
      ).toBeVisible(),
    );
    expect(container.querySelector(".minty-answer--streaming")).not.toHaveTextContent(
      "$S_",
    );

    await act(async () => finishStream?.());
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
