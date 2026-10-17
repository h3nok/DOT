import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import MEDIA from "../../content/amm-media.json";
import { AmmFeature } from "./AmmFeature";

it("uses the supplied Host artwork responsively, with an inspection control and no video", () => {
  const { container } = render(<AmmFeature />);
  expect(screen.getByRole("img")).toHaveAttribute("src", MEDIA.illustration.fallback);
  expect(container.querySelector("source")).toHaveAttribute("srcset", MEDIA.illustration.sources[0].srcset);
  expect(screen.getByRole("button", { name: "Inspect The Host" })).toHaveAttribute("aria-haspopup", "dialog");
  expect(container.querySelector("video")).toBeNull();
});
