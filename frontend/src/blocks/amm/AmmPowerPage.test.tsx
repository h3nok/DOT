import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { expect, it, vi } from "vitest";
import AmmPowerPage from "./AmmPowerPage";
import AMM from "../../content/amm.json";
import MODEL from "../../content/amm-model.json";

vi.mock("../../shared/PageShell", () => ({ PageHeader: () => null, PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("../../shared/SiteColophon", () => ({ SiteColophon: () => null }));
vi.mock("../../organism/AppearanceControl", () => ({ AppearanceControl: () => null }));

const P = AMM.power;
const W = MODEL.power;
const open = () => render(<HelmetProvider><MemoryRouter initialEntries={[P.route]}><AmmPowerPage /></MemoryRouter></HelmetProvider>);
const region = (id: keyof typeof P.screens) => screen.getByRole("region", { name: P.screens[id] });
/** A published sentence, whole, even where its key phrase is marked inside it. */
const sentence = (text: string) => (_: string, element: Element | null) => element?.tagName === "P" && element.textContent === text;

it("leads with disparity and dependence, then the other powers, and returns to the reader", () => {
  const { container } = open();
  const ids = Array.from(container.querySelectorAll("section[id]")).map(el => el.id);
  expect(ids).toEqual(["organized-power", "wealth", "equity", "savings", "income", "housing", "powers", "necessity", "choices", "enters", "anchor", "next"]);
  expect(screen.getByRole("heading", { level: 1, name: P.title })).toBeVisible();
  expect(screen.getByRole("group", { name: P.loopLabel })).toBeInTheDocument();
  // The loop doubles as the contents: each step links to its screen.
  for (const step of P.steps) expect(screen.getByRole("link", { name: step.title })).toHaveAttribute("href", `#${step.id}`);
  // Headings are plain labels; the published sentences sit beneath them.
  for (const id of ids.slice(1)) expect(container.querySelector(`#${id} h2`)?.textContent).toBe(P.screens[id as keyof typeof P.screens]);
});

it("shows who holds the wealth and the companies, keeping one figure per screen and the bottom half in one colour throughout", () => {
  open();
  const wealth = region("wealth");
  expect(within(wealth).getByText("2.5%", { selector: ".amm-power-sum strong" })).toBeVisible();
  expect(within(wealth).getByText(P.wealthBottom)).toBeVisible();
  expect(within(wealth).queryByText("2.5%", { selector: ".explainer-share strong" })).toBeNull();
  const wealthBars = within(wealth).getByRole("figure", { name: P.wealthTitle });
  expect(wealthBars.querySelector<HTMLElement>("li:first-child i")?.style.background).toBe("var(--amm-most)");
  expect(wealthBars.querySelector<HTMLElement>("li:last-child i")?.style.background).toBe("var(--amm-top)");
  const equity = region("equity");
  expect(within(equity).getByText("50.2%", { selector: ".explainer-share strong" })).toBeVisible();
  expect(within(equity).getByText("1.1%", { selector: ".explainer-share strong" })).toBeVisible();
  expect(Array.from(equity.querySelectorAll<HTMLElement>(".explainer-share")).map(el => el.style.getPropertyValue("--ex-fill"))).toEqual(["var(--amm-top)", "var(--amm-most)"]);
});

it("follows the money into savings, income and the home, each figure with its source", () => {
  open();
  expect(within(region("savings")).getByText("$32 trillion")).toBeVisible();
  const income = region("income");
  expect(within(income).getByText(sentence(W.income.drain.text))).toBeVisible();
  for (const word of [...W.income.upWords.words, ...W.income.downWords.words]) expect(within(income).getByText(word)).toBeVisible();
  const housing = region("housing");
  expect(within(housing).getByText("446,000")).toBeVisible();
  expect(within(housing).getByText("22%")).toBeVisible();
  expect(within(housing).getByText(W.housing.caveat.text)).toBeVisible();
  expect(within(housing).queryByRole("img")).toBeNull();
  expect(screen.getByRole("link", { name: /GAO-26-108675/ })).toHaveAttribute("href", W.housing.sources.gao);
});

it("explains what dependence does to a person's choices in the chapters' words", () => {
  open();
  const necessity = region("necessity");
  for (const need of ["shelter", "medical care", "the market", "other people"]) expect(within(necessity).getByText(need)).toBeVisible();
  for (const line of W.choices.lines) expect(within(region("choices")).getByText(sentence(line.text))).toBeVisible();
});

it("keeps the Leech the attitude, names the other powers with their records, and leads to Big C and the diagnosis", () => {
  open();
  const powers = region("powers");
  expect(within(powers).getByText(sentence(W.concentrated.lines[0].text))).toBeVisible();
  const list = within(powers).getByLabelText(P.powersLabel);
  expect(within(list).getAllByRole("term").map(term => term.textContent)).toEqual(P.powers.slice(1).map(power => power.term));
  expect(within(list).getByRole("link", { name: /Thunderforge/ })).toHaveAttribute("href", expect.stringContaining("diu.mil"));
  const anchor = region("anchor");
  for (const line of W.anchor.lines) expect(within(anchor).getByText(sentence(line.text))).toBeVisible();
  expect(within(anchor).getByRole("link", { name: P.anchorAction })).toHaveAttribute("href", "/doctrine/big-c");
  expect(screen.getByRole("link", { name: P.carryAction })).toHaveAttribute("href", AMM.reflect.route);
  expect(screen.getByRole("link", { name: P.chapterAction })).toHaveAttribute("href", "/essays/amm-book-chapter-two-the-anatomy-of-dominance");
  expect(screen.getAllByText(AMM.reflect.disclosure)).toHaveLength(4);
});

it("names its colours once, marks each screen's place in the loop, and marks the key phrase of a sentence", () => {
  const { container } = open();
  const key = screen.getByLabelText(P.keyLabel);
  expect(within(key).getAllByRole("listitem").map(item => item.textContent)).toEqual([P.roles.most.label, P.roles.top.label, P.roles.gate.label]);
  // The opening figure: what flows down through the layers to you, and how you send it back up, in the chapter's words.
  const loop = screen.getByRole("group", { name: P.loopLabel });
  expect(loop).toHaveTextContent(P.loopCentre);
  for (const line of [...W.citizen.carrier, ...W.citizen.enforcer, W.citizen.protects]) expect(loop).toHaveTextContent(line.text);
  for (const step of P.steps) expect(within(loop).getByRole("link", { name: step.title })).toHaveAttribute("href", `#${step.id}`);
  // Each layer wears its colour from the key; the person is the colour of most people.
  expect(Array.from(loop.querySelectorAll<HTMLElement>(".explainer-reach-layer")).map(layer => layer.style.getPropertyValue("--reach-fill"))).toEqual(["var(--amm-top)", "var(--amm-gate)", "", "var(--amm-most)"]);
  expect(container.querySelector("#necessity .explainer-cyclemark")).toHaveTextContent(P.steps[1].title);
  expect(container.querySelector("#next .explainer-cyclemark")).toHaveTextContent(P.steps[4].title);
  expect(container.querySelector("#anchor .explainer-cyclemark")).toBeNull();
  expect(container.querySelector("#wealth mark")).toHaveTextContent("distribution and control");
  // The gate diagram is a picture of the chapter's sentences; assistive technology reads the sentences.
  for (const line of W.necessity.between) expect(within(region("necessity")).getByText(line.text)).toBeInTheDocument();
});
