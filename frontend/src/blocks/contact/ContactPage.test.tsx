import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ContactPage from "./ContactPage";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";
import { fetchContactStatus, sendContactMessage } from "../../services/OrchestratorContactService";

vi.mock("../../services/OrchestratorContactService", () => ({ fetchContactStatus: vi.fn(), sendContactMessage: vi.fn() }));
beforeEach(() => { vi.resetAllMocks(); vi.mocked(fetchContactStatus).mockResolvedValue({ available: true }); });
const open = (path = "/contact") => render(<MemoryRouter initialEntries={[path]}><ContactPage /></MemoryRouter>, { wrapper: PublicPageTestProvider });
async function fill() {
  fireEvent.change(await screen.findByRole("textbox", { name: "Your name" }), { target: { value: "Visitor" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "visitor@example.org" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Your message" }), { target: { value: "I'd like to build a useful digital product." } });
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("ContactPage", () => {
  it("opens the selected purpose and only asks project details for projects", async () => {
    open("/contact?purpose=writing");
    expect(await screen.findByRole("radio", { name: /Writing & inquiry/ })).toBeChecked();
    expect(screen.queryByRole("textbox", { name: /Budget range/ })).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: /Discuss a project/ }));
    expect(screen.getByRole("textbox", { name: /Budget range/ })).toBeVisible();
    expect(screen.getByRole("link", { name: "henok@sullix.com" })).toHaveAttribute("href", "mailto:henok@sullix.com");
  });
  it("keeps a failed message and reuses its reference, then clears only after receipt", async () => {
    vi.mocked(sendContactMessage).mockRejectedValueOnce(new Error("Please try again."))
      .mockResolvedValueOnce({ status: "received", reference: "inq_receipt" });
    open(); await fill();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again.");
    expect(screen.getByRole("textbox", { name: "Your message" })).toHaveValue("I'd like to build a useful digital product.");
    const first = vi.mocked(sendContactMessage).mock.calls[0];
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Your message was received." })).toHaveFocus());
    expect(vi.mocked(sendContactMessage).mock.calls[1][1]).toBe(first[1]);
    expect(screen.getByText("inq_receipt")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Write another message" }));
    expect(screen.getByRole("textbox", { name: "Your message" })).toHaveValue("");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });
  it("does not announce receipt when an acknowledgment is malformed", async () => {
    vi.mocked(sendContactMessage).mockResolvedValue({ status: "received", reference: "" });
    open(); await fill(); fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Receipt could not be confirmed");
    expect(screen.queryByRole("heading", { name: "Your message was received." })).toBeNull();
  });
  it("fails closed with direct email and recovers on explicit retry", async () => {
    vi.mocked(fetchContactStatus).mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce({ available: true });
    open(); expect(await screen.findByText("The form could not be reached.")).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try the form again" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Your name" })).toBeVisible());
    expect(sendContactMessage).not.toHaveBeenCalled();
  });
});
