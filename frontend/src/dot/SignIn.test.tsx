import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignIn } from "./SignIn";

vi.mock("./useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    requestCode: vi.fn().mockResolvedValue({ ok: true }),
    verifyCode: vi.fn().mockResolvedValue({ ok: true, user: { id: "1" } }),
    logout: vi.fn(),
    createInvite: vi.fn(),
    refresh: vi.fn(),
    isOwner: false,
  }),
}));

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
});
