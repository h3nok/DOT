import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarList, CardGrid, CycleDiagram, FlowMap, Handoff, Ledger, ScrollStory, ShareGrid } from ".";

const tiers = [{ id: "top", label: "Top", tone: "strong" as const }, { id: "bottom", label: "Bottom" }];
const links = [{ id: "between", after: "top", items: [{ direction: "down" as const, label: "Rules" }, { direction: "up" as const, label: "Fees" }] }];

describe("explainer primitives", () => {
  it("draws a share as a hundred squares and fills a fraction in part, never rounding up", () => {
    const { container } = render(<ShareGrid value={50.2} label="of the whole is held by a few" />);
    expect(container.querySelectorAll(".explainer-share-grid span")).toHaveLength(100);
    expect(container.querySelectorAll(".is-full")).toHaveLength(50);
    const part = container.querySelector("[data-part]") as HTMLElement;
    expect(part.style.getPropertyValue("--explainer-part")).toBe("20%");
    // The caption carries the fact; the squares are hidden from assistive technology.
    expect(container.querySelector(".explainer-share-grid")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("figure")).toHaveTextContent("50.2% of the whole is held by a few");
  });

  it("lights the named parts of a flow map and dims the rest; with nothing named, nothing dims", () => {
    const { container, rerender } = render(<FlowMap tiers={tiers} links={links} rail={{ id: "rail", label: "Straight up" }} lit={["bottom", "rail"]} />);
    const state = () => [...container.querySelectorAll("[data-state]")].map(node => node.getAttribute("data-state"));
    expect(state()).toEqual(["dim", "dim", "lit", "lit"]);
    // Arrow directions are spoken, not only drawn.
    expect(screen.getByText("Rules").textContent).toBe("Down: Rules");
    rerender(<FlowMap tiers={tiers} links={links} rail={{ id: "rail", label: "Straight up" }} />);
    expect(state()).toEqual([]);
  });

  it("tells a scroll story as ordinary text in order, with the first step current before any scrolling", () => {
    const steps = [{ id: "a", title: "First", text: "One.", quote: "A line.", source: "Chapter" }, { id: "b", title: "Second", text: "Two." }];
    render(<ScrollStory steps={steps} label="The map" figure={step => <p>Drawn for {step.title}</p>} />);
    const items = within(screen.getAllByRole("list")[0]).getAllByRole("listitem");
    expect(items.map(item => item.querySelector("h3")?.textContent)).toEqual(["First", "Second"]);
    expect(items[0]).toHaveAttribute("aria-current", "step");
    expect(items[1]).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("figure", { name: "The map" })).toHaveTextContent("Drawn for First");
    expect(within(items[0]).getByText("A line.").closest("blockquote")).toHaveTextContent("Chapter");
  });

  it("marks each step as read, being read or ahead, and hands the figure its progress", () => {
    const steps = ["a", "b", "c"].map(id => ({ id, title: id.toUpperCase(), text: `${id} text` }));
    const seen: number[] = [];
    render(<ScrollStory steps={steps} label="The story" figure={(step, index, position) => { seen.push(position.progress); return <p>{step.title} at {index}</p>; }} />);
    const items = within(screen.getAllByRole("list")[0]).getAllByRole("listitem");
    expect(items.map(item => item.getAttribute("data-reading"))).toEqual(["current", "next", "next"]);
    expect(seen.every(value => value >= 0 && value <= 1)).toBe(true);
    // Steps take focus when a menu jumps to them, without joining the tab order.
    expect(items[0]).toHaveAttribute("tabindex", "-1");
  });

  it("names a cycle's order for assistive technology and keeps every word in the list beside it", () => {
    const steps = ["Need", "Claim", "Power"].map(label => ({ id: label, label, title: `${label} title`, text: `${label} text` }));
    const { container } = render(<CycleDiagram steps={steps} centre="Centre" label="The loop" returnNote="It returns." />);
    expect(screen.getByRole("img")).toHaveAccessibleName("The loop: Need, then Claim, then Power, and back to Need.");
    expect(container.querySelectorAll(".explainer-cycle-list > li")).toHaveLength(3);
    expect(container.querySelectorAll(".explainer-cycle-arc--return")).toHaveLength(1);
    expect(screen.getByText("It returns.")).toBeInTheDocument();
  });

  it("measures bars from zero against the largest value", () => {
    const { container } = render(<BarList title="Three firms" rows={[{ id: "a", label: "A", value: 10, display: "10" }, { id: "b", label: "B", value: 5, display: "5" }]} />);
    expect([...container.querySelectorAll(".explainer-bars-track i")].map(bar => (bar as HTMLElement).style.width)).toEqual(["100%", "50%"]);
    expect(screen.getByRole("figure", { name: "Three firms" })).toBeInTheDocument();
  });

  it("keeps card detail folded until asked, and labels ledgers and hand-offs", () => {
    render(<>
      <CardGrid label="Cases" cards={[{ id: "rent", title: "Rent", more: { label: "How it works", body: [{ text: "Detail." }, { heading: "Leverage", text: "Pressure." }] } }]} />
      <Ledger title="You supply it" entries={[{ id: "work", term: "Work", becomes: "keeps it going" }]} />
      <Handoff id="next" label="What comes next" line="Then read on."><a href="/next">Next</a></Handoff>
    </>);
    const card = within(screen.getByRole("list", { name: "Cases" })).getByRole("listitem");
    expect(card).toHaveAttribute("id", "rent");
    expect(card.querySelector("details")).not.toHaveAttribute("open");
    expect(within(card).getByText("Leverage")).toBeInTheDocument();
    expect(within(screen.getByRole("figure", { name: "You supply it" })).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "What comes next" })).toHaveTextContent("Then read on.");
  });
});
