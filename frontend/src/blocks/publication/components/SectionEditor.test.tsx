import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicationSectionRead } from "../../../services/OrchestratorPublicationService";
import { SectionEditor } from "./SectionEditor";

const publicationApi = vi.hoisted(() => ({
  fetchPublicationSectionBody: vi.fn(),
  setPublicationSectionBody: vi.fn(),
  updatePublicationSection: vi.fn(),
}));

vi.mock("../../../services/OrchestratorPublicationService", async () => {
  const actual = await vi.importActual<
    typeof import("../../../services/OrchestratorPublicationService")
  >("../../../services/OrchestratorPublicationService");
  return { ...actual, ...publicationApi };
});

const section: PublicationSectionRead = {
  id: "sec_1",
  project_id: "pub_1",
  parent_id: null,
  section_order: 0,
  title: "The First Painting",
  body_ref: "drafts/pub_1/sections/sec_1/rev_1.md",
  status: "draft",
  created_at: "2026-08-13T00:00:00Z",
  updated_at: null,
};

describe("SectionEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publicationApi.fetchPublicationSectionBody.mockResolvedValue(
      "A reader begins with an inherited interpretation.",
    );
    publicationApi.setPublicationSectionBody.mockResolvedValue(section);
    publicationApi.updatePublicationSection.mockResolvedValue(section);
  });

  it("loads private draft text instead of displaying its storage reference", async () => {
    render(<SectionEditor section={section} onRefresh={vi.fn()} />);

    expect(
      await screen.findByDisplayValue("A reader begins with an inherited interpretation."),
    ).toBeInTheDocument();
    expect(screen.queryByDisplayValue(section.body_ref ?? "")).not.toBeInTheDocument();
  });

  it("saves edited Markdown through the manuscript-body endpoint", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<SectionEditor section={section} onRefresh={onRefresh} />);

    const editor = await screen.findByDisplayValue(
      "A reader begins with an inherited interpretation.",
    );
    fireEvent.change(editor, {
      target: { value: "A reader can revise an inherited interpretation." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save revision" }));

    await waitFor(() =>
      expect(publicationApi.setPublicationSectionBody).toHaveBeenCalledWith(
        section.id,
        "A reader can revise an inherited interpretation.",
      ),
    );
    expect(onRefresh).toHaveBeenCalled();
  });

  it("previews the same editorial form the public reader will render", async () => {
    publicationApi.fetchPublicationSectionBody.mockResolvedValue(
      ["> **In plain language**", ">", "> Experience changes what comes next."].join(
        "\n",
      ),
    );
    const { container } = render(
      <SectionEditor section={section} onRefresh={vi.fn()} />,
    );

    await screen.findByDisplayValue(/Experience changes what comes next/);
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(
      container.querySelector('[data-editorial-form="plain-language"]'),
    ).toHaveTextContent("Experience changes what comes next.");
  });
});
