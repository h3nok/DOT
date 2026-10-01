import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DotButton } from "./DotButton";

describe("DotButton", () => {
  it("uses a native command button without accidentally submitting a form", () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const ref = createRef<HTMLButtonElement>();
    render(
      <form onSubmit={onSubmit}>
        <DotButton label="Save notes" onClick={onClick} ref={ref} />
      </form>,
    );
    const button = screen.getByRole("button", { name: "Save notes" });
    expect(button).toHaveAttribute("type", "button");
    expect(ref.current).toBe(button);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("supports intentional form submission and native disabled behaviour", () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onClick = vi.fn();
    const { rerender } = render(<DotButton label="Save notes" disabled onClick={onClick} />);
    const disabled = screen.getByRole("button", { name: "Save notes" });
    expect(disabled).toBeDisabled();
    fireEvent.click(disabled);
    expect(onClick).not.toHaveBeenCalled();

    rerender(<form onSubmit={onSubmit}><DotButton type="submit" label="Save notes" /></form>);
    fireEvent.click(screen.getByRole("button", { name: "Save notes" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("navigates through the router with a separate accessible description", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={
            <DotButton
              to="/book/preface"
              label="Read Book One"
              description="Begin with the preface · Free to read"
              icon={<svg><title>Decorative cover mark</title></svg>}
              endIcon={<svg><title>Decorative arrow</title></svg>}
            />
          } />
          <Route path="/book/preface" element={<h1>The preface</h1>} />
        </Routes>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Read Book One" });
    expect(link).toHaveAttribute("href", "/book/preface");
    expect(link).toHaveAccessibleDescription("Begin with the preface · Free to read");
    fireEvent.click(link);
    expect(screen.getByRole("heading", { name: "The preface" })).toBeVisible();
  });

  it("keeps external destinations as real anchors with native link attributes", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<DotButton href="https://example.org/book" label="Open book" target="_blank" rel="noreferrer" ref={ref} />);
    const link = screen.getByRole("link", { name: "Open book" });
    expect(link).toHaveAttribute("href", "https://example.org/book");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(ref.current).toBe(link);
  });
});
