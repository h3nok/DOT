import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignIn } from "./SignIn";

describe("SignIn", () => {
  it("presents membership honestly without exposing an inactive sign-in form", () => {
    render(<SignIn reducedMotion onClose={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "Sign in is coming soon." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No account is needed/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/send code/i)).not.toBeInTheDocument();
  });

  it("returns to the public work from its primary action", () => {
    const onClose = vi.fn();
    render(<SignIn reducedMotion onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /Continue exploring/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
