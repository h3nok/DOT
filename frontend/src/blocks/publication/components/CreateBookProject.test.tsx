import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CreateBookProject } from "./CreateBookProject";
import { createPublicationProject } from "../../../services/OrchestratorPublicationService";

vi.mock("../../../services/OrchestratorPublicationService", () => ({ createPublicationProject: vi.fn() }));
afterEach(() => vi.resetAllMocks());

describe("CreateBookProject", () => {
  it("creates a private manuscript and opens its editor", async () => {
    vi.mocked(createPublicationProject).mockResolvedValue({ id: "project-1" } as Awaited<ReturnType<typeof createPublicationProject>>);
    render(<MemoryRouter><Routes><Route path="/" element={<CreateBookProject />} /><Route path="/studio/project-1" element={<p>Manuscript editor</p>} /></Routes></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("New book project"), { target: { value: "The Millennial Manifesto" } });
    fireEvent.click(screen.getByRole("button", { name: "Create private manuscript" }));
    expect(await screen.findByText("Manuscript editor")).toBeInTheDocument();
    expect(createPublicationProject).toHaveBeenCalledWith({ title: "The Millennial Manifesto", type: "book", visibility: "private" });
  });

  it("keeps the title after a failed save", async () => {
    vi.mocked(createPublicationProject).mockRejectedValue(new Error("Storage unavailable"));
    render(<MemoryRouter><CreateBookProject /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("New book project"), { target: { value: "My book" } });
    fireEvent.click(screen.getByRole("button", { name: "Create private manuscript" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable");
    expect(screen.getByLabelText("New book project")).toHaveValue("My book");
  });
});