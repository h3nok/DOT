import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AutomataLoop } from "./AutomataLoop";

describe("AutomataLoop", () => {
  it("lets readers choose a phase via the dot indicators", async () => {
    render(<AutomataLoop />);

    fireEvent.click(screen.getByRole("button", { name: /Filtered/ }));
    expect(
      await screen.findByText("The Painting interprets the stream before you decide."),
    ).toBeInTheDocument();
  });

  it("renders a dot indicator for each phase", () => {
    render(<AutomataLoop />);

    for (const step of ["Shaped", "Filtered", "Acted", "Changed"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(step) }),
      ).toBeInTheDocument();
    }
  });
});
