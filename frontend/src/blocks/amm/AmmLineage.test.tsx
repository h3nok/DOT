import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import AMM from "../../content/amm.json";
import { getDoctrineNode } from "../../content/doctrine/doctrineData";
import { AmmDotLineage, AmmSponsor } from "./AmmLineage";

it("quotes Digital Organism Theory in its own words and links each idea back to it", () => {
  render(<MemoryRouter><AmmDotLineage /></MemoryRouter>);
  expect(screen.getByRole("heading", { level: 2, name: AMM.dot.title })).toBeVisible();
  expect(screen.getByRole("link", { name: AMM.dot.action })).toHaveAttribute("href", "/");
  const chain = screen.getByRole("list", { name: "From Digital Organism Theory to AMM and 4Us" });
  for (const item of AMM.dot.links) {
    // DOT is quoted, never paraphrased: each line must stay word for word in the doctrine.
    const node = getDoctrineNode(item.id)!;
    expect(node.title).toBe(item.title);
    expect(`${node.oneLine}\n\n${node.body}`).toContain(item.quote);
    expect(within(chain).getByRole("link", { name: item.title })).toHaveAttribute("href", `/doctrine/${item.id}`);
    expect(within(chain).getByText(item.quote)).toBeVisible();
    expect(within(chain).getByText(item.applies)).toBeVisible();
  }
});

it("says plainly that AMM sponsors 4Us and links to it", () => {
  render(<MemoryRouter><AmmSponsor /></MemoryRouter>);
  expect(screen.getByText(AMM.movement.sponsor)).toBeVisible();
  expect(screen.getByRole("heading", { level: 2, name: AMM.movement.title })).toBeVisible();
  expect(screen.getByRole("link", { name: AMM.movement.action })).toHaveAttribute("href", "https://sullix.com/venture");
  expect(screen.getByRole("img", { name: AMM.movement.artworkAlt })).toBeVisible();
});
