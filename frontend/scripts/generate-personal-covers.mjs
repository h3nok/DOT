// pnpm --dir frontend exec node scripts/generate-personal-covers.mjs
// Original SVG typography and shapes, rasterized with the installed browser.
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = new URL("../", import.meta.url);
const author = JSON.parse(await readFile(new URL("src/content/author.json", root), "utf8"));
const blog = JSON.parse(await readFile(new URL("src/content/blog.json", root), "utf8"));
const escape = text => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const output = new URL("public/og/", root);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const writing of [false, true]) {
    const titles = writing ? blog.heading : author.name.split(" ");
    const subtitle = writing ? "AI, digital products & the experience of being human." : "AI · Product architecture · Independent digital building";
    const lines = titles.map((title, index) => `<text x="70" y="${245 + index * 90}" font-family="Georgia,serif" font-size="${writing ? 70 : 76}" letter-spacing="-3">${escape(title)}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#f2f0e8"/><path d="M70 70H1130M70 550H1130" stroke="#c1ccc1"/>
      <g fill="#182c25"><text x="70" y="120" font-family="Arial,sans-serif" font-size="16" letter-spacing="3">${writing ? "HENOK GHEBRECHRISTOS · WRITING &amp; IDEAS" : "BUILDER · AUTHOR · PHD"}</text>${lines}<text x="73" y="408" font-family="Arial,sans-serif" font-size="20">${escape(subtitle)}</text><text x="70" y="595" font-family="Arial,sans-serif" font-size="18">dotheory.org${writing ? "/blog" : ""}</text></g>
      <g transform="translate(895 290)"><circle r="172" fill="none" stroke="#c1ccc1"/><circle r="130" fill="none" stroke="#c1ccc1" stroke-dasharray="2 9"/><path d="M-140 110L30-130 150 80Z" fill="none" stroke="#849a90"/>
      <g transform="translate(-128 95) rotate(-12)"><rect x="-55" y="-55" width="110" height="110" rx="18" fill="#dce4d5" stroke="#7c9c80"/><path d="M-24-22H-4V-2H-24ZM4-22H24V-2H4ZM-24 4H-4V24H-24Z" fill="none" stroke="#366b55" stroke-width="3"/></g>
      <g transform="translate(15 -123) rotate(10)"><rect x="-55" y="-55" width="110" height="110" rx="18" fill="#f0decb" stroke="#c9a583"/><path d="M-18 24L-12 3 20-29 31-18-2 14Z M-23 29H24" fill="none" stroke="#9d542e" stroke-width="3"/></g>
      <g transform="translate(142 76) rotate(12)"><rect x="-55" y="-55" width="110" height="110" rx="18" fill="#dce7e9" stroke="#88a8b9"/><path d="M-27-18H27V18H-27Z M-27-18L0 3 27-18" fill="none" stroke="#356785" stroke-width="3"/></g><circle r="9" fill="#366b55"/></g>
      <g fill="#52695c" font-family="Arial,sans-serif" font-size="16"><text x="73" y="486">WORK</text><text x="192" y="486">WRITING</text><text x="343" y="486">CONVERSATION</text></g>
    </svg>`;
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: fileURLToPath(new URL(writing ? "henok-writing.png" : "henok-platform.png", output)) });
    await page.close();
  }
} finally { await browser.close(); }
