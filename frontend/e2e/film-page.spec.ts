import { expect, test } from "@playwright/test";

test("the film's own address opens on the film, waiting for Play", async ({ page }) => {
  await page.goto("/film");
  await expect(page.getByRole("heading", { level: 1, name: "Book One, concept by concept" })).toBeVisible();
  const play = page.getByRole("button", { name: /^Play Book One, concept by concept/ });
  await expect(play).toBeVisible();
  await expect(page.getByRole("slider", { name: "Seek timeline in seconds" })).toHaveValue("0");
  await expect(page.getByRole("navigation", { name: "After the film" }).getByRole("link", { name: "Read Book One" }))
    .toHaveAttribute("href", "/book/digital-organism-theory");
  await expect(page).toHaveTitle(/^Book One, concept by concept — /);
});
