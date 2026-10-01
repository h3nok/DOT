import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = path.join(ROOT, "design", "youtube");
const IDENTITY = JSON.parse(readFileSync(path.join(ROOT, "frontend", "src", "content", "identity.json"), "utf8"));
const INK = IDENTITY.dark.surface;
const PAPER = IDENTITY.dark.ink;
const MINT = IDENTITY.dark.accent;
const MUTED = IDENTITY.dark.muted;

export const BANNER_SAFE_AREA = { x: 520, y: 520, width: 1520, height: 400 };

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

function text(x, y, value, size, family = "Space Grotesk", extra = "") {
  return `<text x="${x}" y="${y}" fill="${PAPER}" font-family="${family}" font-size="${size}" font-weight="${family === "Space Grotesk" ? 500 : 400}" ${extra}>${escapeXml(value)}</text>`;
}

function note(x, y, value, size = 18, extra = "") {
  return text(x, y, value, size, "JetBrains Mono", `letter-spacing="2" ${extra}`);
}

function mark(x, y, size) {
  return `<use href="#nucleus" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}"/>`;
}

function drawing(name, width, height, description, content, fontStyles) {
  // Static export of the settled NucleusMark; no React runtime or motion.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(name)}</title>
  <desc id="description">${escapeXml(description)}</desc>
  <defs>
    <style>${fontStyles}</style>
    <radialGradient id="field" cx="78%" cy="42%" r="85%">
      <stop offset="0" stop-color="#25453b"/>
      <stop offset="0.6" stop-color="#132820"/>
      <stop offset="1" stop-color="${INK}"/>
    </radialGradient>
    <symbol id="nucleus" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="44" stroke="${MINT}" stroke-width="1.35" opacity="0.32"/>
      <circle cx="50" cy="50" r="30" stroke="${MINT}" stroke-width="1.55" opacity="0.62"/>
      <path d="M 50 16 C 68 16 84 31 84 50 C 84 69 68 84 50 84" stroke="${MINT}" stroke-width="2.25" stroke-linecap="round" opacity="0.9"/>
      <path d="M 50 84 C 32 84 16 69 16 50 C 16 31 32 16 50 16" stroke="${MINT}" stroke-width="1.8" stroke-linecap="round" opacity="0.56"/>
      <circle cx="50" cy="50" r="15" stroke="${MINT}" stroke-width="1.4" opacity="0.36"/>
      <circle cx="50" cy="50" r="7.5" fill="${MINT}"/>
      <circle cx="50" cy="50" r="3.25" fill="${INK}" opacity="0.72"/>
    </symbol>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#field)"/>
  ${content}
</svg>
`;
}

export function buildChannelAssets(author, fontStyles = "") {
  assert.equal(typeof author?.name, "string", "Author name must be a string");
  assert.ok(author.name.trim(), "Author name must not be empty");
  assert.equal(typeof author.suffix, "string", "Author suffix must be a string");
  const credit = author.suffix ? `${author.name}, ${author.suffix}` : author.name;
  const assets = [];
  const add = (name, width, height, description, content, options = {}) => {
    assets.push({
      name,
      width,
      height,
      maxBytes: 2_000_000,
      ...options,
      svg: drawing(name, width, height, description, content, fontStyles),
    });
  };

  add("banner", 2560, 1440,
    `Digital Organism Theory. ${credit}. Consciousness, conditioning, conscious authorship. dotheory.org. The nucleus is a brand mark, not an empirical diagram.`,
    `<g fill="none" stroke="${MINT}" opacity="0.09">
      <circle cx="2200" cy="720" r="330"/>
      <circle cx="2200" cy="720" r="520"/>
      <circle cx="2200" cy="720" r="760"/>
      <path d="M 0 720 H 450 M 2240 720 H 2560"/>
    </g>
    <g data-essential="">
      ${mark(654, 720, 210)}
      <path d="M 790 608 V 849" stroke="${MINT}" opacity="0.3"/>
      ${note(840, 605, "AN OPEN INQUIRY", 17, `style="fill:${MUTED}"`)}
      ${text(840, 689, "Digital Organism Theory", 70, "Space Grotesk", 'letter-spacing="-2"')}
      ${text(844, 751, credit, 32)}
      ${text(844, 807, "Consciousness. Conditioning. Conscious authorship.", 26, "Source Serif 4", `style="fill:${MUTED}"`)}
      ${note(844, 857, "DOTHEORY.ORG", 20, `style="fill:${MINT}"`)}
    </g>`,
    { maxBytes: 6_000_000, safeArea: BANNER_SAFE_AREA });

  add("avatar", 800, 800,
    "Digital Organism Theory's existing nucleus mark, centred for a circular channel profile image.",
    `<g data-essential="">${mark(400, 400, 600)}</g>`,
    { circle: { x: 400, y: 400, radius: 380 } });

  const thumbnail = (name, label, lines, figure, description) => {
    add(name, 1280, 720, description,
      `<g data-essential="">
        ${note(76, 100, label, 18, `style="fill:${MINT}"`)}
        ${mark(1170, 90, 62)}
        ${lines.map((line, index) => text(72, 278 + index * 91, line, 76, "Space Grotesk", 'letter-spacing="-2"')).join("\n")}
        ${figure}
        <path d="M 76 599 H 1204" stroke="${MINT}" opacity="0.22"/>
        ${note(76, 654, "DIGITAL ORGANISM THEORY", 15, `style="fill:${MUTED}"`)}
        ${note(982, 654, "DOTHEORY.ORG", 15, `style="fill:${MUTED}"`)}
      </g>`);
  };

  thumbnail("thumbnail-introduction", "AN INTRODUCTION",
    ["What is a", "digital", "organism?"],
    `${mark(984, 355, 410)}${note(984, 560, "A VISUAL MODEL", 14, `text-anchor="middle" style="fill:${MUTED}"`)}`,
    "Introductory video thumbnail: What is a digital organism? The drawing is a visual model, not a measured physical structure.");

  thumbnail("thumbnail-concepts", "BOOK ONE / CONCEPTS",
    ["Canvas.", "Painting.", "Character."],
    `<g fill="${INK}" stroke-width="2">
      <rect x="814" y="177" width="292" height="176" rx="18" stroke="${MUTED}"/>
      <rect x="850" y="258" width="292" height="176" rx="18" stroke="${MINT}"/>
      <rect x="886" y="339" width="292" height="176" rx="18" stroke="${PAPER}"/>
      <circle cx="1032" cy="427" r="17" fill="${MINT}" stroke="none"/>
    </g>`,
    "Book One concepts video thumbnail: Canvas, Painting, Character. Three abstract layers are a visual metaphor.");

  thumbnail("thumbnail-open-questions", "OPEN QUESTIONS",
    ["Where the", "theory is", "still open."],
    `<g fill="none" stroke="#d4c6a6">
      <circle cx="984" cy="355" r="174" stroke-width="2" stroke-dasharray="5 13" opacity="0.7"/>
      <path d="M 984 226 A 129 129 0 1 0 1113 355" stroke-width="3"/>
      <circle cx="984" cy="355" r="58" stroke-width="1.5" opacity="0.4"/>
      <circle cx="984" cy="355" r="12" fill="#d4c6a6" stroke="none"/>
    </g>`,
    "Open questions video thumbnail: Where the theory is still open. An unfinished ring signals inquiry, not certainty.");

  add("splash", 1920, 1080,
    `Still video title card for Digital Organism Theory, credited to ${credit}. No animation or audio.`,
    `<g data-essential="">
      ${mark(960, 354, 224)}
      ${note(960, 519, "AN OPEN INQUIRY", 18, `text-anchor="middle" style="fill:${MUTED}"`)}
      ${text(960, 623, "Digital Organism Theory", 76, "Space Grotesk", 'text-anchor="middle" letter-spacing="-2"')}
      ${text(960, 694, credit, 32, "Space Grotesk", 'text-anchor="middle"')}
      ${note(960, 839, "DOTHEORY.ORG", 22, `text-anchor="middle" style="fill:${MINT}"`)}
    </g>`);

  add("book-background", 1400, 2000,
    "Ink-and-jade jacket background for the 7 by 10 inch Word/PDF edition. Text remains native in Word. The nucleus is the DOT brand mark, not a measured structure.",
    `<g fill="none" stroke="${MINT}" opacity="0.08">
      <circle cx="1400" cy="1000" r="700"/>
      <circle cx="1400" cy="1000" r="1100"/>
    </g>
    <g data-essential="">${mark(700, 1130, 520)}</g>`);

  return assets;
}

async function embeddedFonts() {
  const fonts = [
    ["space-grotesk", "Space Grotesk", 500],
    ["source-serif-4", "Source Serif 4", 400],
    ["jetbrains-mono", "JetBrains Mono", 400],
  ];
  const declarations = [];
  const licenses = [];
  for (const [packageName, family, weight] of fonts) {
    const directory = path.join(ROOT, "frontend", "node_modules", "@fontsource", packageName);
    const bytes = await readFile(path.join(directory, "files", `${packageName}-latin-${weight}-normal.woff2`));
    declarations.push(`@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2");}`);
    licenses.push(`${family}\n${await readFile(path.join(directory, "LICENSE"), "utf8")}`);
  }
  return { styles: declarations.join("\n"), licenses: licenses.join("\n\n") };
}

function validateBounds(asset, bounds) {
  const { x, y, width, height } = asset.safeArea ?? {
    x: 24, y: 24, width: asset.width - 48, height: asset.height - 48,
  };
  assert.ok(bounds.x >= x && bounds.y >= y
    && bounds.x + bounds.width <= x + width
    && bounds.y + bounds.height <= y + height,
  `${asset.name}: essential artwork exceeds its safe area: ${JSON.stringify(bounds)}`);
  if (asset.circle) {
    for (const cornerX of [bounds.x, bounds.x + bounds.width]) {
      for (const cornerY of [bounds.y, bounds.y + bounds.height]) {
        assert.ok(Math.hypot(cornerX - asset.circle.x, cornerY - asset.circle.y) <= asset.circle.radius,
          `${asset.name}: artwork is not safe for circular cropping`);
      }
    }
  }
}

async function render() {
  const { chromium } = await import("@playwright/test");
  const author = JSON.parse(await readFile(path.join(ROOT, "frontend", "src", "content", "author.json"), "utf8"));
  const fonts = await embeddedFonts();
  const assets = buildChannelAssets(author, fonts.styles);
  await mkdir(OUTPUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    await page.route("**/*", (route) => route.abort("blockedbyclient"));
    for (const asset of assets) {
      await page.setViewportSize({ width: asset.width, height: asset.height });
      await page.setContent(`<!doctype html><html><head><style>html,body{margin:0}svg{display:block}</style></head><body>${asset.svg}</body></html>`);
      const bounds = await page.evaluate(async () => {
        await document.fonts.ready;
        for (const [family, weight] of [["Space Grotesk", 500], ["Source Serif 4", 400], ["JetBrains Mono", 400]]) {
          const faces = await document.fonts.load(`${weight} 26px "${family}"`);
          if (faces.length === 0) {
            throw new Error(`Artwork font did not load: ${family}`);
          }
        }
        const box = document.querySelector("[data-essential]").getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      });
      validateBounds(asset, bounds);
      const png = await page.locator("svg").screenshot({ path: path.join(OUTPUT, `${asset.name}.png`) });
      assert.equal(png.readUInt32BE(16), asset.width, `${asset.name}: incorrect PNG width`);
      assert.equal(png.readUInt32BE(20), asset.height, `${asset.name}: incorrect PNG height`);
      assert.ok(png.length <= asset.maxBytes, `${asset.name}: PNG exceeds YouTube upload limit`);
      await writeFile(path.join(OUTPUT, `${asset.name}.svg`), asset.svg);
      if (asset.safeArea) {
        await page.screenshot({
          path: path.join(OUTPUT, "banner-mobile.png"),
          clip: asset.safeArea,
        });
      }
      console.log(`${asset.name}: ${asset.width}x${asset.height}, ${Math.ceil(png.length / 1024)} KiB; safe-area check passed`);
    }
    await writeFile(path.join(OUTPUT, "FONT-LICENSES.txt"), fonts.licenses);
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await render();
}
