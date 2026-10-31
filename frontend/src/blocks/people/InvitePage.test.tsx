import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import InvitePage from "./InvitePage";

const service = vi.hoisted(() => ({ checkInvitation: vi.fn() }));
const auth = vi.hoisted(() => ({ value: { user: null as null | { id: string }, loading: false } }));
const signIn = vi.hoisted(() => vi.fn());

vi.mock("../../services/OrchestratorPeopleService", () => service);
vi.mock("../../dot/useAuth", () => ({ useAuth: () => auth.value }));
vi.mock("../../dot/SignIn", () => ({ SignIn: (props: { inviteToken?: string }) => { signIn(props); return <p>Sign-in opened</p>; } }));
vi.mock("../../shared/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
  PageHeader: () => null,
}));

const open = (hash: string) => {
  window.location.hash = hash;
  return render(<MemoryRouter><InvitePage /></MemoryRouter>);
};

describe("InvitePage", () => {
  beforeEach(() => { vi.clearAllMocks(); auth.value = { user: null, loading: false }; });
  afterEach(() => { window.location.hash = ""; });

  it("carries the token from the fragment into sign-in", async () => {
    service.checkInvitation.mockResolvedValue({ valid: true, invited_by: "Henok", expires_at: "2026-11-10T00:00:00Z" });
    open("#a-secret-token");

    expect(await screen.findByRole("heading", { name: "Henok invited you" })).toBeInTheDocument();
    expect(service.checkInvitation).toHaveBeenCalledWith("a-secret-token", expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
    expect(signIn).toHaveBeenCalledWith(expect.objectContaining({ inviteToken: "a-secret-token" }));
  });

  it("says when an invitation is closed, and offers the public door", async () => {
    service.checkInvitation.mockResolvedValue({ valid: false, invited_by: null, expires_at: null });
    open("#used-token");

    expect(await screen.findByRole("heading", { name: "This invitation is no longer open" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ask to join" })).toHaveAttribute("href", "/join");
  });

  it("does not ask the server about a link with no token", async () => {
    open("");

    expect(await screen.findByRole("heading", { name: "This invitation is no longer open" })).toBeInTheDocument();
    expect(service.checkInvitation).not.toHaveBeenCalled();
  });

  it("leaves the invitation open when someone already signed in opens it", async () => {
    auth.value = { user: { id: "mbr_1" }, loading: false };
    service.checkInvitation.mockResolvedValue({ valid: true, invited_by: null, expires_at: null });
    open("#a-secret-token");

    expect(await screen.findByRole("heading", { name: "You are already signed in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept invitation" })).toBeNull();
  });
});
