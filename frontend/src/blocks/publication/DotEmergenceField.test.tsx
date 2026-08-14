import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DotEmergenceField from "./DotEmergenceField";

describe("DotEmergenceField", () => {
  it("marks each field variant for theme and presentation rules", () => {
    const { container, rerender } = render(<DotEmergenceField />);

    expect(container.firstElementChild).toHaveAttribute(
      "data-emergence-variant",
      "hero",
    );
    expect(container.querySelector(".dot-emergence-life-thread")).toBeInTheDocument();
    expect(container.querySelector(".dot-emergence-aura")).toBeInTheDocument();

    rerender(<DotEmergenceField variant="cover" />);
    expect(container.firstElementChild).toHaveAttribute(
      "data-emergence-variant",
      "cover",
    );
    expect(container.querySelector(".dot-emergence-return")).toBeInTheDocument();
  });

  it("keeps color out of the artwork so the book theme owns it", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "blocks", "publication", "DotEmergenceField.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
  });
});
