import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PrivateReaderNote } from "./PrivateReaderNote";

describe("PrivateReaderNote", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps a section note on the reader's device", () => {
    const { unmount } = render(<PrivateReaderNote storageId="book-one.preface" />);
    const note = screen.getByRole("textbox", {
      name: "Private note for this section",
    });

    fireEvent.change(note, { target: { value: "Return to this distinction." } });
    expect(screen.getByText("Saved on this device")).toBeInTheDocument();
    unmount();

    render(<PrivateReaderNote storageId="book-one.preface" />);
    expect(
      screen.getByRole("textbox", { name: "Private note for this section" }),
    ).toHaveValue("Return to this distinction.");
  });

  it("lets the reader clear a saved note", () => {
    window.localStorage.setItem(
      "dot.reader-note.v1.book-one.preface",
      "Temporary note",
    );
    render(<PrivateReaderNote storageId="book-one.preface" />);

    fireEvent.click(screen.getByRole("button", { name: "Clear this private note" }));

    expect(
      screen.getByRole("textbox", { name: "Private note for this section" }),
    ).toHaveValue("");
    expect(window.localStorage.getItem("dot.reader-note.v1.book-one.preface")).toBeNull();
  });
});
