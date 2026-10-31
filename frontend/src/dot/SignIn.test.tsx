import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignIn } from "./SignIn";

const auth = vi.hoisted(() => ({ requestCode: vi.fn(), verifyCode: vi.fn() }));
vi.mock("./useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    requestCode: auth.requestCode,
    verifyCode: auth.verifyCode,
    logout: vi.fn(),
    createInvite: vi.fn(),
    refresh: vi.fn(),
    isOwner: false,
  }),
}));

beforeEach(() => {
  auth.requestCode.mockReset().mockResolvedValue({ ok: true });
  auth.verifyCode.mockReset().mockResolvedValue({ ok: true, user: { id: "1" } });
});

describe("SignIn", () => {
  it("presents an email form as the first step", () => {
    render(<SignIn reducedMotion onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("closes when the user dismisses the dialog", () => {
    const onClose = vi.fn();
    render(<SignIn reducedMotion onClose={onClose} />);

    const closeButtons = screen.getAllByRole("button", { name: /Close/i });
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("returns to the email step without sending another code", async () => {
    render(<SignIn reducedMotion onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "owner@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("textbox", { name: "One-time code" });

    const back = screen.getByRole("button", { name: "Use a different email" });
    fireEvent.click(back);

    expect(await screen.findByRole("textbox", { name: "Email address" })).toHaveValue("owner@example.test");
    expect(auth.requestCode).toHaveBeenCalledOnce();
    // A browser would submit the form if this node were reused as the next step's submit button.
    expect(back.isConnected).toBe(false);
  });

  it("redeems an invitation through both sign-in steps and goes where it is told", async () => {
    auth.requestCode.mockResolvedValue({ ok: true });
    auth.verifyCode.mockResolvedValue({ ok: true });
    const onSignedIn = vi.fn();
    render(<SignIn reducedMotion onClose={vi.fn()} inviteToken="a-secret-token" onSignedIn={onSignedIn} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Your name (optional)" }), { target: { value: "Sam" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "sam@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(auth.requestCode).toHaveBeenCalledWith("sam@example.test", "a-secret-token");
    fireEvent.change(await screen.findByRole("textbox", { name: "One-time code" }), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^Sign in$/ }));
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce());
    expect(auth.verifyCode).toHaveBeenCalledWith("sam@example.test", "123456", "Sam", "a-secret-token");
  });

  it("keeps the email and requests a new code when the verified session was not saved", async () => {
    auth.verifyCode.mockResolvedValue({ ok: false, codeAccepted: true, error: "Sign-in did not complete." });
    render(<SignIn reducedMotion onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "owner@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(await screen.findByRole("textbox", { name: "One-time code" }), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^Sign in$/ }));
    expect(await screen.findByRole("textbox", { name: "Email address" })).toHaveValue("owner@example.test");
    expect(screen.getByRole("alert")).toHaveTextContent("Sign-in did not complete.");
    expect(screen.queryByRole("textbox", { name: "One-time code" })).toBeNull();
  });
});
