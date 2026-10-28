import { expect, test } from "@playwright/test";

type SoundProbeWindow = Window & { filmSoundProbe: { audio: number; contexts: number } };

test("the homepage film types every concept only when asked, and its sound is one click from off", async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { audio: 0, contexts: 0 };
    (window as SoundProbeWindow).filmSoundProbe = probe;
    const NativeAudio = window.Audio;
    window.Audio = function (src?: string) {
      probe.audio += 1;
      return new NativeAudio(src);
    } as typeof Audio;
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts += 1;
      }
    };
  });
  const probe = () => page.evaluate(() => (window as SoundProbeWindow).filmSoundProbe);

  await page.goto("/#visual-inquiry");
  const section = page.locator("#visual-inquiry");
  await expect(section.getByRole("heading", { level: 2, name: "Book One, concept by concept" })).toBeVisible();
  const stage = section.locator(".concept-film-stage");
  const shown = section.locator(".concept-film-copy:not(.concept-tour-sizer)");
  const timeline = section.getByRole("slider", { name: "Seek timeline in seconds" });
  await expect(timeline).toHaveValue("0");
  expect(await probe()).toEqual({ audio: 0, contexts: 0 });

  await section.getByRole("button", { name: /^Play Book One, concept by concept/ }).click();
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(0.5);
  expect(await probe()).toEqual({ audio: 0, contexts: 1 });
  const sound = section.getByRole("button", { name: "Typewriter sound" });
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await stage.click();
  await expect(section.getByRole("button", { name: "Play film", exact: true })).toBeAttached();

  // Moving to a concept shows it in the Concept Map's words, at the same height.
  const height = (await stage.boundingBox())!.height;
  await timeline.fill("155");
  await expect(shown.getByRole("heading", { level: 3 })).toHaveAccessibleName("Physical Sciences as Frame Derivations");
  await expect(timeline).toHaveAttribute("aria-valuetext", /Concept 7 of 17/);
  await expect(shown.locator(".concept-film-analogy")).toContainText("Like timing a pendulum");
  expect(Math.abs((await stage.boundingBox())!.height - height)).toBeLessThan(1);

  // Stepping to the next concept plays it from its start.
  await section.getByRole("button", { name: "Next concept" }).click();
  await expect(shown.getByRole("heading", { level: 3 })).toHaveAccessibleName("Reality Stream");
  await expect(timeline).toHaveAttribute("aria-valuetext", /Concept 8 of 17/);

  // Scrolled out of sight, it pauses itself rather than playing to no one.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(section.getByRole("button", { name: "Play film", exact: true })).toBeAttached();

  // The film plays out and stops on its closing title, with the way into the book.
  await timeline.fill("342");
  await section.getByRole("button", { name: "Play film", exact: true }).click();
  await expect(timeline).toHaveValue("343", { timeout: 10_000 });
  await expect(shown.getByRole("heading", { level: 3 })).toHaveAccessibleName("Consciousness: A Digital Organism");
  await expect(shown.getByRole("link", { name: "Read Book One" })).toHaveAttribute("href", "/book/digital-organism-theory");
  await expect(section.getByRole("button", { name: "Play film", exact: true })).toBeAttached();

  expect(await probe()).toEqual({ audio: 0, contexts: 1 });
});
