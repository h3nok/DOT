/** Render the publication's share card from its real mark, fonts, and wording.
 * With Vite running: node scripts/generate-amm-share.mjs http://127.0.0.1:5210
 */
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const content = JSON.parse(await readFile(new URL("../src/content/amm.json", import.meta.url), "utf8"));
const origin = process.argv[2] || "http://127.0.0.1:5173";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(`${origin}/amm`);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.evaluate(async ({ title, headline }) => {
    await document.fonts.ready;
    const card = document.createElement("div");
    card.id = "amm-social-card";
    card.style.cssText = "position:fixed;inset:0;z-index:2147483647;width:1200px;height:630px;padding:56px 64px;background:#f6f1e7;color:#232525;box-sizing:border-box;";
    card.innerHTML = '<header style="display:flex;align-items:center;gap:22px;border-bottom:2px solid #232525;padding-bottom:30px"><img src="/amm/mark.svg" width="64" height="64" alt=""><span style="font:500 20px/1.4 var(--font-sans);letter-spacing:2px;text-transform:uppercase"></span></header><h1 style="font:500 80px/1.04 var(--font-serif);letter-spacing:-4px;margin:42px 0 28px"><span></span><br><em style="color:#a73524;font-weight:400"></em></h1><footer style="display:flex;justify-content:space-between;border-top:1px solid #d3cbbd;padding-top:24px;font:400 16px/1.6 var(--font-sans);letter-spacing:1px"><span>POWER. CULTURE. PUBLIC LIFE.</span><span>dotheory.org/amm</span></footer>';
    card.querySelector("header span").textContent = title;
    card.querySelector("h1 span").textContent = headline[0];
    card.querySelector("h1 em").textContent = headline[1];
    document.body.append(card);
    await card.querySelector("img").decode();
    await document.fonts.ready;
  }, content);
  await page.locator("#amm-social-card").screenshot({ path: fileURLToPath(new URL("../public/og/amm.png", import.meta.url)) });
} finally {
  await browser.close();
}
