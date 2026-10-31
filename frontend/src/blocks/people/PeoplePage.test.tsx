import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PeoplePage from "./PeoplePage";

const service = vi.hoisted(() => ({
  declineRequest: vi.fn(), fetchInvitations: vi.fn(), fetchJoinRequests: vi.fn(), fetchMembers: vi.fn(),
  fetchSubscribers: vi.fn(), fetchSupportTotals: vi.fn(), findMember: vi.fn(), inviteRequester: vi.fn(),
  removeSubscriber: vi.fn(), revokeInvitation: vi.fn(), setMemberStatus: vi.fn(),
}));
const auth = vi.hoisted(() => ({ createInvite: vi.fn() }));

vi.mock("../../services/OrchestratorPeopleService", () => service);
vi.mock("../../dot/useAuth", () => ({ useAuth: () => auth }));
vi.mock("../../shared/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  PageHeader: () => null,
}));

const open = (view: string) => render(<MemoryRouter initialEntries={[`/studio/people?view=${view}`]}><PeoplePage /></MemoryRouter>);
const member = (over = {}) => ({ id: "mbr_1", display_name: "Sam", role: "member", status: "active", invited_by: "Henok", joined_at: "2026-10-01T00:00:00Z", ...over });

describe("PeoplePage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("opens one view at a time and shows no counts in its navigation", async () => {
    service.fetchSubscribers.mockResolvedValue([{ id: "r1", email: "reader@example.test", publication: "amm", confirmed_at: "2026-10-01T00:00:00Z" }]);
    open("subscribers");

    expect(await screen.findByText("reader@example.test")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "People" });
    expect(within(nav).getByRole("link", { name: "Subscribers" })).toHaveAttribute("aria-current", "page");
    expect(nav.textContent).not.toMatch(/\d/);
    expect(service.fetchMembers).not.toHaveBeenCalled();
  });

  it("asks before removing a subscriber, then reloads the list", async () => {
    service.fetchSubscribers.mockResolvedValueOnce([{ id: "r1", email: "reader@example.test", publication: "all", confirmed_at: null }]).mockResolvedValueOnce([]);
    service.removeSubscriber.mockResolvedValue(undefined);
    open("subscribers");

    fireEvent.click(await screen.findByRole("button", { name: "Remove…" }));
    expect(service.removeSubscriber).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => expect(service.removeSubscriber).toHaveBeenCalledWith("r1"));
    expect(await screen.findByText("Nobody has confirmed a subscription yet.")).toBeInTheDocument();
  });

  it("answers a request by email and reports a failed send on its row", async () => {
    service.fetchJoinRequests.mockResolvedValue([{ id: "j1", email: "asker@example.test", reason: "To read.", created_at: "2026-10-01T00:00:00Z" }]);
    service.inviteRequester.mockRejectedValue(new Error("The email could not be sent. The request is still open."));
    open("requests");

    fireEvent.click(await screen.findByRole("button", { name: "Invite by email" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The request is still open.");
    expect(screen.getByText("asker@example.test")).toBeInTheDocument();
  });

  it("suspends after asking, restores directly, and offers neither for the owner", async () => {
    service.fetchMembers.mockResolvedValue([
      member(),
      member({ id: "mbr_2", display_name: "Kit", status: "suspended" }),
      member({ id: "mbr_3", display_name: "Henok", role: "owner", invited_by: null }),
    ]);
    service.setMemberStatus.mockResolvedValue({ status: "suspended" });
    open("members");

    fireEvent.click(await screen.findByRole("button", { name: "Suspend…" }));
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    await waitFor(() => expect(service.setMemberStatus).toHaveBeenCalledWith("mbr_1", "suspended"));

    fireEvent.click(await screen.findByRole("button", { name: "Restore access" }));
    await waitFor(() => expect(service.setMemberStatus).toHaveBeenCalledWith("mbr_2", "active"));
    expect(screen.getAllByRole("button", { name: /Suspend|Restore/ })).toHaveLength(2);
  });

  it("finds a member by an address already known", async () => {
    service.fetchMembers.mockResolvedValue([member(), member({ id: "mbr_2", display_name: "Kit" })]);
    service.findMember.mockResolvedValue([member({ id: "mbr_2", display_name: "Kit" })]);
    open("members");
    await screen.findByText("Sam");

    fireEvent.change(screen.getByRole("textbox", { name: "Find by email address" }), { target: { value: "kit@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Find member" }));

    await waitFor(() => expect(screen.queryByText("Sam")).toBeNull());
    expect(service.findMember).toHaveBeenCalledWith("kit@example.test");
    expect(screen.getByText("Kit")).toBeInTheDocument();
  });

  it("shows a new invitation link once, and revokes only open invitations", async () => {
    service.fetchInvitations.mockResolvedValue([
      { id: "i1", status: "open", accepted_by: null, created_at: "2026-10-01T00:00:00Z", expires_at: "2026-10-15T00:00:00Z" },
      { id: "i2", status: "accepted", accepted_by: "Sam", created_at: "2026-10-01T00:00:00Z", expires_at: "2026-10-15T00:00:00Z" },
    ]);
    auth.createInvite.mockResolvedValue({ ok: true, link: "https://dotheory.org/invite#secret" });
    open("invitations");

    expect(await screen.findAllByRole("button", { name: "Revoke…" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Create an invitation link" }));

    expect(await screen.findByText("https://dotheory.org/invite#secret")).toBeInTheDocument();
  });

  it("says plainly what the support totals leave out", async () => {
    service.fetchSupportTotals.mockResolvedValue({ supporters: 1, total_minor: 2000, currency: "usd" });
    open("support");

    expect(await screen.findByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText(/Zelle and Cash App are not included/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Stripe payments/ })).toHaveAttribute("href", "https://dashboard.stripe.com/payments");
  });
});
