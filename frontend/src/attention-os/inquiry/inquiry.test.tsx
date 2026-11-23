import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Cited, CiteThis, LevelKey, LevelMark, ModelMap, Notebook, Records, Scene, Terms, type ClaimLevel, type ModelPart } from ".";

const LEVELS: ClaimLevel[] = [
  { id: "speculation", label: "Speculative extension", rank: 4, definition: "Possible, not yet derived." },
  { id: "observation", label: "Observation", rank: 1, definition: "Encountered without accepting the theory.", source: { label: "Preface", href: "/book#levels" } },
];

const PARTS: ModelPart[] = [
  { id: "described", name: "The country described", place: "above", summary: "What it says it is.", href: "#described", members: ["Idealism", "Division"] },
  { id: "inversion", name: "The Inversion", place: "line", summary: "Professing one thing, practicing another.", href: "#inversion" },
  { id: "citizen", name: "The citizen", place: "on", summary: "Lives the contradiction.", href: "#citizen" },
  { id: "leech", name: "The Leech", place: "below", summary: "The attitude of dominance.", href: "#leech" },
];

afterEach(() => window.sessionStorage.clear());

describe("inquiry primitives", () => {
  it("mark a level by shape and always name it in words", () => {
    const { container } = render(<LevelMark level={LEVELS[0]} hideLabel />);
    expect(container.querySelector(".inq-level")).toHaveAttribute("data-rank", "4");
    expect(screen.getByText("Speculative extension")).toHaveClass("sr-only");
  });

  it("list levels from the most directly encountered to the most speculative, with their sources", () => {
    render(<LevelKey levels={LEVELS} label="Levels of claim" />);
    const rows = within(screen.getByLabelText("Levels of claim")).getAllByRole("term");
    expect(rows.map((row) => row.textContent)).toEqual(["Observation", "Speculative extension"]);
    expect(screen.getByRole("link", { name: "Preface" })).toHaveAttribute("href", "/book#levels");
  });

  it("keep a quoted heading a real heading and its passage one link away", () => {
    render(<Cited heading={2} id="q" quote={{ text: "We live in two countries at once.", source: { label: "Chapter Three", href: "/essays/c3#s3" }, level: "observation" }} levels={LEVELS} />);
    expect(screen.getByRole("heading", { level: 2, name: "We live in two countries at once." })).toHaveAttribute("id", "q");
    expect(screen.getByRole("link", { name: "Chapter Three" })).toHaveAttribute("href", "/essays/c3#s3");
    expect(screen.getByText("Observation")).toBeVisible();
  });

  it("quote a passage as a blockquote that cites its address", () => {
    const { container } = render(<Cited quote={{ text: "A line.", source: { label: "Source", href: "/s" } }} />);
    expect(container.querySelector("blockquote")).toHaveAttribute("cite", "/s");
  });

  it("give every term an address and name the concepts it applies", () => {
    const { container } = render(<Terms label="Terms" appliesLabel="Applies" terms={[{ id: "canvas", term: "Canvas", definition: "Carries state.", source: { label: "Working Definitions", href: "/c4#wd" }, applies: [{ label: "Canvas", href: "/doctrine/canvas" }] }]} />);
    expect(container.querySelector("#term-canvas")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Canvas" })).toHaveAttribute("href", "/doctrine/canvas");
  });

  it("order records oldest first", () => {
    render(<Records label="Records" records={[
      { id: "b", date: "2015-03-04", title: "Ferguson", issuer: "DOJ", href: "https://example.org/b" },
      { id: "a", date: "1606-04-10", title: "Charter", issuer: "Avalon", href: "https://example.org/a" },
    ]} />);
    expect(within(screen.getByRole("list", { name: "Records" })).getAllByRole("link").map((link) => link.textContent)).toEqual(["Charter", "Ferguson"]);
  });

  it("draw the model for the eye and list it for everyone, lighting the part in focus", () => {
    const { container } = render(<ModelMap parts={PARTS} label="The model" current="leech" />);
    expect(container.querySelector(".inq-map-figure")).toHaveAttribute("aria-hidden", "true");
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(PARTS.map((part) => part.name));
    expect(screen.getByRole("link", { name: "The Leech" })).toHaveAttribute("aria-current", "location");
    fireEvent.focus(screen.getByRole("link", { name: "The Inversion" }));
    expect(container.querySelector(".inq-map-region--line")).toHaveAttribute("data-active", "true");
    expect(container.querySelector(".inq-map-region--below")).not.toHaveAttribute("data-active");
  });

  it("keep notebook answers in this tab only, and clear them only after a second, explicit choice", () => {
    const labels = { save: "Save as a text file", clear: "Clear", confirmClear: "Clear everything", keep: "Keep", saved: "Saved.", cleared: "Cleared." };
    const prompts = [{ id: "power", label: "Power", prompt: "Who can decide what?" }];
    const { unmount } = render(<Notebook storageKey="test-notebook" title="My case" prompts={prompts} privacy="Stays here." fileName="case.txt" labels={labels} />);
    const field = screen.getByRole("textbox", { name: /Power/ });
    expect(field).toHaveAccessibleDescription("Who can decide what?");
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    fireEvent.change(field, { target: { value: "The landlord sets the terms." } });
    expect(window.sessionStorage.getItem("test-notebook")).toContain("landlord");
    expect(window.localStorage.getItem("test-notebook")).toBeNull();
    unmount();
    render(<Notebook storageKey="test-notebook" title="My case" prompts={prompts} privacy="Stays here." fileName="case.txt" labels={labels} />);
    expect(screen.getByRole("textbox", { name: /Power/ })).toHaveValue("The landlord sets the terms.");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear everything" }));
    expect(screen.getByRole("textbox", { name: /Power/ })).toHaveValue("");
    expect(window.sessionStorage.getItem("test-notebook")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Cleared.");
  });

  it("copy a citation, and say so when the clipboard is unavailable", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText } });
    render(<CiteThis citations={[{ id: "c1", label: "Chapter One", text: "Author. Title." }]} labels={{ copy: "Copy", copied: "Copied.", unavailable: "Select the text to copy it." }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy: Chapter One" }));
    expect(writeText).toHaveBeenCalledWith("Author. Title.");
    expect(await screen.findByText("Select the text to copy it.")).toBeInTheDocument();
  });

  it("name each screen by its heading", () => {
    render(<Scene id="leech" labelledBy="leech-title" tone="night"><h2 id="leech-title">The Leech</h2></Scene>);
    expect(screen.getByRole("region", { name: "The Leech" })).toHaveAttribute("data-tone", "night");
  });
});
