import { expect, test } from "@playwright/test";

type SoundProbeWindow = Window & { filmSoundProbe: { audio: number; contexts: number } };

test("the homepage film moves through every concept in silence, and only when asked", async ({ page }) => {
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

  await page.goto("/#visual-inquiry");
  const section = page.locator("#visual-inquiry");
  await expect(section.getByRole("heading", { level: 2, name: "Book One, concept by concept" })).toBeVisible();
  const stage = section.locator(".concept-film-stage");
  const shown = section.locator(".concept-film-copy:not(.concept-tour-sizer)");
  const timeline = section.getByRole("slider", { name: "Seek timeline in seconds" });
  await expect(timeline).toHaveValue("0");

  await section.getByRole("button", { name: /^Play Book One, concept by concept/ }).click();
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(0.5);
  await stage.click();
  await expect(section.getByRole("button", { name: "Play film", exact: true })).toBeAttached();

  // Moving to a concept shows it in the Concept Map's words, at the same height.
  const height = (await stage.boundingBox())!.height;
  await timeline.fill("71");
  await expect(shown.getByRole("heading", { level: 3 })).toHaveText("Physical Sciences as Frame Derivations");
  await expect(timeline).toHaveAttribute("aria-valuetext", /Concept 7 of 17/);
  expect(Math.abs((await stage.boundingBox())!.height - height)).toBeLessThan(1);

  // The film plays out and stops on its closing title.
  await timeline.fill("180");
  await stage.click();
  await expect(timeline).toHaveValue("181", { timeout: 5000 });
  await expect(shown.getByRole("heading", { level: 3 })).toHaveText("Consciousness: A Digital Organism");
  await expect(section.getByRole("button", { name: "Play film", exact: true })).toBeAttached();

  const probe = await page.evaluate(() => (window as SoundProbeWindow).filmSoundProbe);
  expect(probe).toEqual({ audio: 0, contexts: 0 });
});
