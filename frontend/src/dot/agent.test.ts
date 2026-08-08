import { describe, expect, it } from "vitest";
import { asksHowDataIsHandled, asksWhoIsSpeaking } from "./agent";

/**
 * These two predicates sit in front of Book One retrieval, so anything they
 * match is a question the book never gets to answer. The cases below are the
 * ones that regressed: both patterns used to be bare substring tests, and both
 * swallowed real questions about the manuscript.
 */

describe("asksWhoIsSpeaking", () => {
  it("matches a question about this surface", () => {
    for (const question of [
      "Who are you?",
      "who are you",
      "What are you?",
      "What is DOT?",
      "Tell me about yourself",
      "Who made this?",
      "Who is behind this?",
    ]) {
      expect(asksWhoIsSpeaking(question), question).toBe(true);
    }
  });

  it("leaves questions about the book to the book", () => {
    for (const question of [
      // Lumen's own suggested prompt. Used to return an uncited paragraph.
      "What does DOT claim about Fear and Love?",
      "Tell me about the Canvas",
      "What is this book about?",
      "What does DOT say about conditioning?",
      "Where does the observer enter the inquiry?",
      "What would distinguish Little c from a neural account?",
    ]) {
      expect(asksWhoIsSpeaking(question), question).toBe(false);
    }
  });
});

describe("asksHowDataIsHandled", () => {
  it("matches a question about what happens to what a visitor types", () => {
    for (const question of [
      "Do you store my questions?",
      "Does DOT retain my questions?",
      "What is your privacy policy?",
      "Are my questions logged?",
      "Is my conversation private?",
      "Do you track visitors?",
    ]) {
      expect(asksHowDataIsHandled(question), question).toBe(true);
    }
  });

  it("does not claim the manuscript's own vocabulary", () => {
    for (const question of [
      // The book's founding claim. Used to return the privacy notice.
      "What is the Subjective Data Principle?",
      "Is feeling data?",
      "How does DOT treat subjective data?",
      "What does the Canvas store?",
      "How does the Canvas retain experience?",
    ]) {
      expect(asksHowDataIsHandled(question), question).toBe(false);
    }
  });
});
