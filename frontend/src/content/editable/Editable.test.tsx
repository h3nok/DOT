/**
 * The property that matters most here is the fallback.
 *
 * Public copy must survive an absent orchestrator, a failed request, and an
 * empty database, because the alternative is a front door with no words on it.
 * These pin that, plus the rule that an unpublished draft never reaches a
 * reader and that editing controls never render for one.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { Editable } from "./Editable";
import { EditModeToggle } from "./EditModeToggle";
import { SiteContentProvider } from "./SiteContentProvider";
import { saveBlock } from "../../services/SiteContentService";

const RELEASED = "You were shaped by your environment, yet you must choose within your available decision space.";

const mockAuth = vi.hoisted(() => ({ isOwner: false }));
const mockService = vi.hoisted(() => ({
  published: {} as Record<string, string>,
  available: true,
}));

vi.mock("../../dot/useAuth", () => ({
  useAuth: () => ({ isOwner: mockAuth.isOwner, user: null, loading: false }),
}));

vi.mock("../../services/SiteContentService", () => ({
  siteContentAvailable: () => mockService.available,
  fetchPublishedContent: async () => mockService.published,
  fetchDrafts: async () => [],
  saveBlock: vi.fn(async () => undefined),
  revertBlock: vi.fn(async () => undefined),
}));

beforeEach(() => {
  mockAuth.isOwner = false;
  mockService.published = {};
  mockService.available = true;
  vi.mocked(saveBlock).mockClear();
});

const renderBlock = () =>
  render(
    <SiteContentProvider>
      <Editable id="home.subtitle" as="p" text={RELEASED} />
    </SiteContentProvider>,
  );

describe("Editable", () => {
  it("shows the released wording when no override is published", async () => {
    renderBlock();

    expect(await screen.findByText(RELEASED)).toBeInTheDocument();
  });

  it("shows the released wording when no orchestrator is configured", async () => {
    mockService.available = false;

    renderBlock();

    expect(await screen.findByText(RELEASED)).toBeInTheDocument();
  });

  it("prefers a published override over the released wording", async () => {
    mockService.published = { "home.subtitle": "An override that shipped." };

    renderBlock();

    expect(await screen.findByText("An override that shipped.")).toBeInTheDocument();
    expect(screen.queryByText(RELEASED)).not.toBeInTheDocument();
  });

  it("renders no editing affordance for a reader", async () => {
    mockService.published = { "home.subtitle": "Public words." };

    renderBlock();
    await screen.findByText("Public words.");

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders without a provider at all", () => {
    // A surface mounted in isolation still shows its copy rather than crashing.
    render(<Editable id="home.subtitle" as="p" text={RELEASED} />);

    expect(screen.getByText(RELEASED)).toBeInTheDocument();
  });

  it("gives the steward an edit affordance only after edit mode is on", async () => {
    mockAuth.isOwner = true;

    renderBlock();
    await screen.findByText(RELEASED);

    // Edit mode is off by default: the steward reads before they write.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Editable in edit mode", () => {
  const renderEditable = () =>
    render(
      <SiteContentProvider>
        <EditModeToggle />
        <Editable id="home.subtitle" as="p" text={RELEASED} />
      </SiteContentProvider>,
    );

  it("opens an inline editor and publishes what the steward wrote", async () => {
    mockAuth.isOwner = true;

    renderEditable();
    fireEvent.click(await screen.findByRole("button", { name: /edit/i }));

    // The copy itself becomes the control, so words are edited where they are read.
    fireEvent.click(screen.getByRole("button", { name: RELEASED }));

    const field = screen.getByLabelText("Copy for home.subtitle");
    expect(field).toHaveValue(RELEASED);

    fireEvent.change(field, { target: { value: "Rewritten in place." } });
    fireEvent.click(screen.getByRole("button", { name: /publish/i }));

    await waitFor(() =>
      expect(saveBlock).toHaveBeenCalledWith("home.subtitle", "Rewritten in place.", {
        publish: true,
      }),
    );
  });

  it("keeps the editor closed for a signed-out visitor even in edit mode", async () => {
    mockAuth.isOwner = false;

    renderEditable();
    await screen.findByText(RELEASED);

    // No toggle, therefore no way into edit mode at all.
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });
});
