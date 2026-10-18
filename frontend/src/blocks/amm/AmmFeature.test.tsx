import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import MEDIA from "../../content/amm-media.json";
import { AmmFeature } from "./AmmFeature";

vi.mock("../../organism/OrganismContext", () => ({ useOrganism: () => ({ config: { enabled: true, stillness: false }, reducedMotion: true }) }));

it("keeps the supplied Host artwork inspectable and requests no video in reduced motion", () => {
  const { container } = render(<AmmFeature />);
  expect(screen.getByRole("img")).toHaveAttribute("src", MEDIA.illustration.fallback);
  expect(container.querySelector("source")).toHaveAttribute("srcset", MEDIA.illustration.sources[0].srcset);
  expect(screen.getByRole("button", { name: "Inspect The Host" })).toHaveAttribute("aria-haspopup", "dialog");
  expect(container.querySelector("video")).toBeNull();
});
