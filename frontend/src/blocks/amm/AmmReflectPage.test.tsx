import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { expect, it, vi } from "vitest";
import AmmReflectPage from "./AmmReflectPage";
import { AmmReflectInvite } from "./reflect/AmmReflectInvite";
import AMM from "../../content/amm.json";
import { AMM_MODEL } from "../../content/ammModel";
import MEDIA from "../../content/amm-media.json";

vi.mock("../../shared/PageShell", () => ({ PageHeader: () => null, PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("../../shared/SiteColophon", () => ({ SiteColophon: () => null }));
vi.mock("../../organism/AppearanceControl", () => ({ AppearanceControl: () => null }));

const R = AMM.reflect;
const open = () => render(<HelmetProvider><MemoryRouter initialEntries={[R.route]}><AmmReflectPage /></MemoryRouter></HelmetProvider>);

/** Matches the element whose own text is exactly this sentence, even when styled in parts. */
const sentence = (text: string) => (_: string, element: Element | null) => element?.tagName === "P" && element.textContent === text;

it("moves from the Root Cause to Two Countries to the Host's cognitive, mental, and moral infection", () => {
  const { container } = open();
  const sectionIds = Array.from(container.querySelectorAll("section[id]")).map(el => el.id);
  expect(sectionIds).toEqual([
    "inversion",
    "civilization",
    "origin",
    "claimed",
    "practiced",
    "amm-attention",
    "amm-mind",
    "crushing",
    "thoughts",
    "not-your-nature",
    "begin",
  ]);

  expect(screen.getByRole("heading", { level: 1, name: R.title })).toBeVisible();
  for (const line of R.lead) expect(screen.getByText(line.text)).toBeVisible();
  const path = screen.getByRole("navigation", { name: "Diagnosis path" });
  expect(within(path).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["#civilization", "#claimed", "#amm-attention"]);

  // The Root Cause (Western Civilization)
  const origin = screen.getByRole("region", { name: R.origin.eyebrow });
  expect(within(origin).getByRole("heading", { name: R.origin.title })).toBeVisible();
  for (const line of R.origin.lines) expect(within(origin).getByText(line.text)).toBeVisible();
  expect(within(origin).getByText(R.origin.lineage, { exact: false })).toBeVisible();
  expect(within(origin).getByText(R.origin.quote.text)).toBeVisible();
  expect(within(origin).getByText(R.origin.quote.source)).toBeVisible();
  expect(within(origin).getByText(R.origin.close)).toBeVisible();

  // Two Countries side-by-side without 9 duplicate full-screen repeats
  const claimed = screen.getByRole("region", { name: R.claimed.title });
  expect(within(claimed).getByRole("heading", { name: R.claimed.title })).toBeVisible();
  const claims = within(claimed).getByRole("list", { name: R.claimed.eyebrow });
  expect(within(claims).getAllByRole("listitem")).toHaveLength(R.claimed.items.length);
  for (const item of R.claimed.items) expect(within(claims).getByText(item.source)).toBeVisible();

  const practiced = screen.getByRole("region", { name: R.practiced.eyebrow });
  const symptoms = within(practiced).getByRole("list", { name: R.practiced.eyebrow });
  expect(within(symptoms).getAllByRole("listitem")).toHaveLength(R.practiced.pairs.length);
  for (const pair of R.practiced.pairs) {
    const row = container.querySelector<HTMLElement>(`#practice-${pair.id}`)!;
    expect(row).not.toBeNull();
    expect(within(row).getByText(pair.practice)).toBeVisible();
    expect(within(row).getByText(`${pair.claim} · ${pair.enforce}`)).toBeVisible();
  }

  // Cognitive, mental, and moral health damage to the Host
  const attention = container.querySelector<HTMLElement>("#amm-attention")!;
  expect(within(attention).getByRole("heading", { name: AMM_MODEL.home.attention.heading.text })).toBeVisible();
  for (const cut of AMM_MODEL.home.attention.thread.interruptions) expect(within(attention).getByText(cut)).toBeVisible();

  const mind = container.querySelector<HTMLElement>("#amm-mind")!;
  expect(within(mind).getByRole("heading", { name: AMM_MODEL.home.mind.heading.text })).toBeVisible();
  for (const row of AMM_MODEL.home.mind.rows) {
    expect(within(mind).getByText(row.before)).toBeVisible();
    expect(within(mind).getByText(row.after)).toBeVisible();
  }

  const crushing = screen.getByRole("region", { name: R.crushing.eyebrow });
  expect(within(crushing).getByRole("heading", { level: 2, name: R.crushing.title })).toBeVisible();
  expect(within(crushing).getByText(sentence(R.crushing.lines[0].text))).toBeVisible();
  expect(within(crushing).getByText(sentence(R.crushing.lines[1].text))).toBeVisible();
  expect(within(crushing).getByText(sentence(R.crushing.lines[4].text))).toBeVisible();
  expect(crushing.querySelector(".explainer-rename")).toHaveTextContent(AMM_MODEL.home.us.renamed.text);
  const callouts = within(crushing).getByRole("list", { name: R.crushing.calloutsLabel });
  expect(within(callouts).getAllByRole("listitem").map(item => item.textContent?.replace(/^\d+/, ""))).toEqual(R.crushing.callouts.map(item => item.label));
  expect(within(crushing).getByRole("heading", { name: R.crushing.hollowLabel })).toBeVisible();
  for (const item of R.crushing.hollowed) {
    expect(within(crushing).getAllByText(item.word)).toHaveLength(2);
    expect(within(crushing).getByText(item.effect)).toBeVisible();
  }
});

it("shows peer enforcement via the erosion spiral and separates character from infection without asking the reader to mark anything", () => {
  const { container } = open();
  const thoughts = container.querySelector<HTMLElement>("#thoughts")!;
  expect(within(thoughts).getByRole("heading", { name: R.enforce.title })).toBeVisible();
  for (const voice of [...AMM_MODEL.home.spiral.carrier, ...AMM_MODEL.home.spiral.enforcer, AMM_MODEL.home.spiral.inversion]) {
    expect(within(thoughts).getByText(voice.text)).toBeVisible();
  }
  expect(within(thoughts).getByText(R.alibi.line)).toBeVisible();
  expect(screen.getByRole("heading", { name: R.separate.title })).toBeVisible();
  for (const line of R.separate.lines) expect(screen.getByText(line.text)).toBeVisible();
  expect(screen.queryAllByRole("button").filter(button => button.hasAttribute("aria-pressed"))).toHaveLength(0);
  expect(screen.queryByRole("region", { name: "Self-diagnosis readout" })).toBeNull();
});

it("collects no text input from the reader and ends in the book", () => {
  open();
  expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  expect(screen.getByText(R.end.line)).toBeVisible();
  expect(screen.getByRole("link", { name: R.end.chapterAction })).toHaveAttribute("href", R.end.chapterRoute);
  expect(screen.getByRole("link", { name: R.end.nextAction })).toHaveAttribute("href", R.end.nextRoute);
});

it("opens the root cause by defining a civilization in ordinary words, quoted and cited, without Book One's Digital Organism definition", () => {
  open();
  const civ = AMM_MODEL.reflect.civilization;
  const scene = screen.getByRole("region", { name: R.civilization.title });
  expect(within(scene).getByRole("heading", { level: 2, name: R.civilization.title })).toBeVisible();
  expect(within(scene).getByText(civ.definition)).toBeVisible();
  expect(within(scene).getByRole("link", { name: civ.publisher })).toHaveAttribute("href", civ.href);
  for (const mark of civ.marks) expect(within(scene).getByText(mark)).toBeVisible();
  expect(document.body.textContent).not.toContain("state-bearing, information-sensitive process");
});

it("gives every painting a description and says it is AI-generated", () => {
  open();
  const paintings = MEDIA.reflect as Record<string, { alt: string }>;
  const used = [R.image, R.origin.image, R.crushing.image, R.separate.image];
  expect(new Set(used).size).toBe(used.length);
  for (const image of used) expect(screen.getAllByAltText(paintings[image].alt).length).toBeGreaterThan(0);
  expect(screen.getAllByText(R.disclosure)).toHaveLength(used.length);
});

it("invites readers from the AMM home", () => {
  render(<MemoryRouter><AmmReflectInvite /></MemoryRouter>);
  expect(screen.getByRole("heading", { level: 2, name: R.title })).toBeVisible();
  expect(screen.getByRole("link", { name: R.inviteAction })).toHaveAttribute("href", R.route);
  expect(screen.getByText(R.disclosure)).toBeVisible();
});
