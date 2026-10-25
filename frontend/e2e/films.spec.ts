import { expect, test } from "@playwright/test";
import { INQUIRY_VIDEOS } from "../scripts/channel-inquiry-video.mjs";

test("film claims stay optional and the complete transcript can seek the paused film", async ({ page }) => {
  await page.goto("/films");
  const claims = page.locator("details.films-claims");
  const summary = claims.locator("summary");
  await expect(summary).toHaveText("About this film’s claims");
  await expect(claims).not.toHaveAttribute("open");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(claims).toHaveAttribute("open");
  await expect(claims.locator(".films-claims-copy")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(claims).not.toHaveAttribute("open");

  await page.getByText("Read the transcript", { exact: true }).click();
  const transcript = page.getByRole("list", { name: "Film transcript" });
  const trailer = INQUIRY_VIDEOS.find((video) => video.name === "inquiry-trailer")!;
  const passages = transcript.locator(".films-transcript-line");
  await expect(passages).toHaveCount(trailer.captions.length);
  for (const [index, caption] of trailer.captions.entries()) {
    await expect(passages.nth(index)).toHaveText(caption.primaryStatement!);
  }

  // Reading the transcript does not start the film. A timestamp explicitly does.
  await expect(page.getByRole("button", { name: "Play film", exact: true })).toBeVisible();
  await transcript.getByRole("button").first().click();
  await expect(page.getByRole("button", { name: "Pause film", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause film", exact: true }).click();
});
