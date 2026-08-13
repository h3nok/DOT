/**
 * The practice section is the easiest place on this site to accidentally lie.
 *
 * Its first version read as a productivity method — a clean five-step loop and
 * three exercises — which made slow, frightening work look like a technique
 * anyone could run on a lunch break. These pin the four things that must
 * survive any future tidying, because tidying is exactly what removes them.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomePractice } from "./HomePractice";

const renderSection = () => render(<HomePractice onStart={vi.fn()} />);

describe("HomePractice", () => {
  it("says the work is difficult and does not promise arrival", () => {
    renderSection();

    expect(screen.getByText(/genuinely difficult, and it is slow/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing here promises you will get there/i)).toBeInTheDocument();
  });

  it("keeps entropy off the authority of physics", () => {
    renderSection();

    // Book One is explicit: this is "not thermodynamic entropy" and "should not
    // borrow the authority of physics". Dropping that caveat would let the page
    // dress a conceptual principle as a physical law.
    expect(
      screen.getByText(/not the physicist's entropy, and it must not borrow the authority of physics/i),
    ).toBeInTheDocument();
  });

  it("names what the practice costs rather than only its steps", () => {
    renderSection();

    expect(screen.getByText(/It is unlearning/i)).toBeInTheDocument();
    expect(screen.getByText(/unwillingness to keep learning/i)).toBeInTheDocument();
  });

  it("places the author inside the work, not on the far side of it", () => {
    renderSection();

    expect(screen.getByText(/not from having finished/i)).toBeInTheDocument();
  });

  it("always carries the safety caveat with the exercises", () => {
    renderSection();

    // The chapter that gives the practice gives this too. Exercises without it
    // would invite someone to walk into material that needs support.
    expect(screen.getByText(/should not be confronted recklessly/i)).toBeInTheDocument();
    expect(screen.getByText(/professional care/i)).toBeInTheDocument();
  });

  it("hands each exercise to the companion with a grounded prompt", () => {
    const onStart = vi.fn();
    render(<HomePractice onStart={onStart} />);

    const walkthroughs = screen.getAllByRole("button", { name: /walk me through this/i });
    expect(walkthroughs).toHaveLength(3);

    walkthroughs[0].click();
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.stringContaining("pausing") }),
    );
  });
});
