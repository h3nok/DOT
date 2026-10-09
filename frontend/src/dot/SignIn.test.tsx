import { fireEvent, render, screen } from "@testing-library/react";
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
