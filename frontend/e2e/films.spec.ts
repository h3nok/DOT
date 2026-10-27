import { expect, test } from "@playwright/test";

type SoundProbeWindow = Window & { filmSoundProbe: { audio: number; contexts: number } };

test("concept films play silently, only when asked, and stop on their last frame", async ({ page }) => {
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

  await page.goto("/academy/films?concept=experience-loop#screening-room");
  const film = page.locator(".concept-film");
  await expect(film.getByRole("heading", { level: 3, name: "The Experience Loop" })).toBeVisible();
  await expect(page.locator("audio, video, iframe")).toHaveCount(0);

  const timeline = page.getByRole("slider", { name: "Seek timeline in seconds" });
  await expect(timeline).toHaveValue("0");
  await page.getByRole("button", { name: "Play film", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause film", exact: true })).toBeVisible();
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(0.5);

  // Jump near the end: the film finishes on its own frame and stays on this concept.
  await page.getByRole("button", { name: "Pause film", exact: true }).click();
  await timeline.fill("15.5");
  await page.getByRole("button", { name: "Play film", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play film", exact: true })).toBeVisible({ timeout: 5000 });
  await expect(timeline).toHaveValue("16");
  await expect(film.getByRole("heading", { level: 3, name: "The Experience Loop" })).toBeVisible();

  const probe = await page.evaluate(() => (window as SoundProbeWindow).filmSoundProbe);
  expect(probe).toEqual({ audio: 0, contexts: 0 });
});

test("the concept index switches films and keeps the choice in the address", async ({ page }) => {
  await page.goto("/academy/films");
  const index = page.getByRole("navigation", { name: "Concept films" });
  await index.getByRole("button", { name: /The Fear-Gating Principle/ }).click();
  await expect(page.locator(".concept-film").getByRole("heading", { level: 3, name: "The Fear-Gating Principle" })).toBeVisible();
  await expect(page).toHaveURL(/[?&]concept=fear-gating/);
  await expect(page.locator(".concept-film")).toBeInViewport();
});
