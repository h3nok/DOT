import { act, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useReveal } from "./useReveal";

let observed: Element[] = [];
let callback: IntersectionObserverCallback;
class FakeObserver {
  constructor(next: IntersectionObserverCallback) { callback = next; }
  observe(target: Element) { observed.push(target); }
  unobserve(target: Element) { observed = observed.filter(item => item !== target); }
  disconnect() { observed = []; }
}

function Page({ late = false }: { late?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  return <div ref={root}><h2 data-reveal>Claim</h2><p data-reveal="1">Argument</p>{late && <p data-reveal>Rendered later</p>}<p>Plain</p></div>;
}

const reduce = (matches: boolean) => vi.stubGlobal("matchMedia", (query: string) => ({ matches: matches && query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }));

beforeEach(() => { observed = []; vi.stubGlobal("IntersectionObserver", FakeObserver); reduce(false); });
afterEach(() => { vi.unstubAllGlobals(); delete document.documentElement.dataset.motion; });

it("holds marked content until the reader reaches it, then reveals it once", () => {
  const { getByText } = render(<Page />);
  const claim = getByText("Claim");
  expect(claim).toHaveAttribute("data-reveal-pending");
  expect(getByText("Plain")).not.toHaveAttribute("data-reveal-pending");
  act(() => callback([{ target: claim, isIntersecting: true } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(claim).not.toHaveAttribute("data-reveal-pending");
  expect(observed).not.toContain(claim);
  expect(getByText("Argument")).toHaveAttribute("data-reveal-pending");
});

it("never hides content it did not arm, such as text rendered after the page settled", () => {
  const { getByText, rerender } = render(<Page />);
  rerender(<Page late />);
  expect(getByText("Rendered later")).not.toHaveAttribute("data-reveal-pending");
});

it("hides nothing for readers who prefer stillness", () => {
  reduce(true);
  expect(render(<Page />).getByText("Claim")).not.toHaveAttribute("data-reveal-pending");
});

it("hides nothing when the site's stillness setting is on", () => {
  document.documentElement.dataset.motion = "still";
  expect(render(<Page />).getByText("Claim")).not.toHaveAttribute("data-reveal-pending");
});

it("hides nothing where the browser cannot tell when content is on screen", () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  expect(render(<Page />).getByText("Claim")).not.toHaveAttribute("data-reveal-pending");
});

it("releases everything it armed when the page leaves", () => {
  const { getByText, unmount } = render(<Page />);
  const claim = getByText("Claim");
  unmount();
  expect(claim).not.toHaveAttribute("data-reveal-pending");
});

it("reveals a keyboard destination before its intersection callback", () => {
  function Links() {
    const root = useRef<HTMLDivElement>(null);
    useReveal(root);
    return <div ref={root}><div data-reveal><a href="/amm/editions">Read editions</a></div></div>;
  }
  const { getByRole } = render(<Links />);
  const link = getByRole('link', { name: 'Read editions' });
  const target = link.parentElement!;
  expect(target).toHaveAttribute('data-reveal-pending');
  fireEvent.focusIn(link);
  expect(target).not.toHaveAttribute('data-reveal-pending');
  expect(observed).not.toContain(target);
});
