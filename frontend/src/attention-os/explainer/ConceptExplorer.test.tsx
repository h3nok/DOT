import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ConceptExplorer } from "./ConceptExplorer";

const items = [
  { id: "first", label: "First concept", hint: "A hint", title: "First explanation", text: "First definition", question: "First question?" },
  { id: "second", label: "Second concept", hint: "Another hint", title: "Second explanation", text: "Second definition", question: "Second question?" },
  { id: "third", label: "Third concept", hint: "Last hint", title: "Third explanation", text: "Third definition", question: "Third question?" },
];

it("keeps one panel exposed and preserves focus through pointer and keyboard selection", () => {
  render(<ConceptExplorer label="Ideas" questionLabel="Consider" items={items} />);
  const tabs = screen.getAllByRole("tab");
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("First concept");
  tabs[0].focus();
  fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
  expect(tabs[1]).toHaveFocus();
  expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  expect(tabs[0]).toHaveAttribute("tabindex", "-1");
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Second concept");
  expect(screen.getByRole("tabpanel").id).toBe(tabs[1].getAttribute("aria-controls"));
  fireEvent.keyDown(tabs[1], { key: "End" });
  expect(tabs[2]).toHaveFocus();
  fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
  expect(tabs[0]).toHaveFocus();
  fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });
  expect(tabs[2]).toHaveFocus();
  fireEvent.keyDown(tabs[2], { key: "Home" });
  expect(tabs[0]).toHaveFocus();
  fireEvent.click(tabs[2]);
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Third question?");
});

it("updates published wording without losing the reader's selected concept", () => {
  const { rerender } = render(<ConceptExplorer label="Ideas" questionLabel="Consider" items={items} />);
  fireEvent.click(screen.getByRole("tab", { name: "Second concept" }));
  rerender(<ConceptExplorer label="Ideas" questionLabel="Consider" items={items.map(item => ({ ...item, text: `Edited ${item.text}` }))} />);
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Second concept");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Edited Second definition");
});
