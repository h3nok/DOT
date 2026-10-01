import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

for (const colorScheme of ["light", "dark"] as const) {
  test(`the ${colorScheme} architecture is the hero's readable focal point`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    const svg = page.locator(".home-hero-architecture__svg");
    await expect(svg).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const presentation = await svg.evaluate((node) => {
      if (!(node instanceof SVGSVGElement)) throw new Error("Expected an SVG diagram");
      const matrix = node.getScreenCTM();
      if (!matrix) throw new Error("Diagram has no screen transform");
      const scale = Math.hypot(matrix.a, matrix.b);
      const labels = [...node.querySelectorAll(".home-architecture-ring-label text")];
      const boxes = labels.map((label) => label.getBoundingClientRect());
      const caption = node.closest("figure")?.querySelector("figcaption");
      const explanation = document.querySelector(".home-hero-lede");
      const background = getComputedStyle(document.body).backgroundColor;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Cannot measure rendered label contrast");
      const luminance = (color: string) => {
        context.fillStyle = background;
        context.fillRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
          .map((channel) => channel / 255)
          .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const backgroundLuminance = luminance(background);
      const contrast = (color: string, surface = background) => {
        const foregroundLuminance = luminance(color);
        const surfaceLuminance = surface === background ? backgroundLuminance : luminance(surface);
        return (Math.max(foregroundLuminance, surfaceLuminance) + 0.05) /
          (Math.min(foregroundLuminance, surfaceLuminance) + 0.05);
      };
      const heading = document.querySelector(".home-hero-title");
      const life = document.querySelector(".home-hero-lede");
      const kicker = document.querySelector(".home-hero-kicker");
      const masthead = document.querySelector(".home-hero-masthead");
      const read = document.querySelector(".home-hero-entry .dot-focus-nav__primary");
      if (!heading || !life || !kicker || !masthead || !read) {
        throw new Error("Illustrated opening is missing");
      }
      const headingStyle = getComputedStyle(heading);
      const lifeStyle = getComputedStyle(life);
      const readingStyle = getComputedStyle(read);
      const readingNote = read.querySelector(".dot-focus-nav__copy > span");
      if (!readingNote) throw new Error("Reading invitation has no description");

      return {
        width: node.getBoundingClientRect().width,
        top: node.getBoundingClientRect().top,
        originBottom: node.querySelector(".home-architecture-origin-boundary")?.getBoundingClientRect().bottom,
        fonts: labels.map((label) => ({
          layer: label.closest("[data-layer]")?.getAttribute("data-layer"),
          pixels: parseFloat(getComputedStyle(label).fontSize) * scale,
          contrast: contrast(getComputedStyle(label).fill),
        })),
        opening: {
          family: headingStyle.fontFamily,
          style: headingStyle.fontStyle,
          headingPixels: parseFloat(headingStyle.fontSize),
          nativeSemiboldLoaded: [...document.fonts].some((face) =>
            face.family.includes("Source Serif 4") && face.style === "normal" &&
            face.weight === "600" && face.status === "loaded",
          ),
          headingContrast: contrast(headingStyle.color),
          lifePixels: parseFloat(lifeStyle.fontSize),
          lifeContrast: contrast(lifeStyle.color),
          headingWidth: heading.getBoundingClientRect().width,
          lifeWidth: life.getBoundingClientRect().width,
          questionBeforeDiagram: !!(heading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING),
          noteLeft: masthead.getBoundingClientRect().left,
          noteTop: masthead.getBoundingClientRect().top,
          kickerCase: getComputedStyle(kicker).textTransform,
          washBottom: masthead.getBoundingClientRect().bottom -
            parseFloat(getComputedStyle(masthead, "::before").bottom),
          readingTop: read.getBoundingClientRect().top,
          readingBottom: read.getBoundingClientRect().bottom,
          readingHeight: read.getBoundingClientRect().height,
          readingRadius: parseFloat(readingStyle.borderTopLeftRadius),
          readingContrast: contrast(readingStyle.color, readingStyle.backgroundColor),
          readingNoteContrast: contrast(getComputedStyle(readingNote).color, readingStyle.backgroundColor),
        },
        overlap: boxes.some((box, index) => boxes.slice(index + 1).some((other) =>
          box.left < other.right && box.right > other.left &&
          box.top < other.bottom && box.bottom > other.top,
        )),
        captionVisible: !!caption && getComputedStyle(caption).position !== "absolute",
        explanationBeforeDiagram: !!explanation &&
          !!(explanation.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });

    expect(presentation.overlap).toBe(false);
    expect(presentation.captionVisible).toBe(true);
    expect(presentation.explanationBeforeDiagram).toBe(true);
    expect(presentation.opening.family).toContain("Source Serif 4");
    expect(presentation.opening.style).toBe("normal");
    expect(presentation.opening.nativeSemiboldLoaded).toBe(true);
    expect(presentation.opening.headingPixels).toBeGreaterThanOrEqual(32);
    expect(presentation.opening.headingPixels).toBeLessThanOrEqual(56);
    expect(presentation.opening.kickerCase).toBe("none");
    expect(presentation.opening.headingContrast).toBeGreaterThanOrEqual(4.5);
    expect(presentation.opening.lifeContrast).toBeGreaterThanOrEqual(4.5);
    expect(presentation.opening.lifePixels).toBeGreaterThanOrEqual(16);
    expect(presentation.opening.headingWidth).toBeLessThanOrEqual(448);
    expect(presentation.opening.lifeWidth).toBeLessThanOrEqual(448);
    expect(presentation.opening.questionBeforeDiagram).toBe(true);
    expect(presentation.opening.readingHeight).toBeGreaterThanOrEqual(72);
    expect(presentation.opening.readingRadius).toBeLessThan(presentation.opening.readingHeight / 2);
    expect(presentation.opening.readingBottom).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
    expect(presentation.opening.readingContrast).toBeGreaterThanOrEqual(4.5);
    expect(presentation.opening.readingNoteContrast).toBeGreaterThanOrEqual(4.5);
    expect(presentation.opening.washBottom).toBeLessThanOrEqual(presentation.opening.readingTop);
    await expect(page.getByText("Held as hypothesis · Open to challenge", { exact: true })).toBeVisible();
    const inquiry = page.getByRole("textbox", { name: "Ask a question about Digital Organism Theory" });
    await expect(inquiry).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Begin exploring DOT" })
      .getByRole("link", { name: "Read Book One" })).toBeInViewport();
    for (const font of presentation.fonts) {
      expect(font.pixels, `${font.layer} rendered label size`).toBeGreaterThanOrEqual(
        font.layer === "awareness-radius" ? 14 : 16,
      );
      expect(font.contrast, `${font.layer} painted label contrast`).toBeGreaterThanOrEqual(4.5);
    }
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      expect(presentation.width).toBeGreaterThanOrEqual(480);
      expect(presentation.width).toBeLessThanOrEqual(600);
      expect(presentation.top).toBeLessThan(300);
      expect(presentation.originBottom).toBeDefined();
      expect(presentation.originBottom).toBeLessThanOrEqual((page.viewportSize()?.height ?? 0) + 1);
      expect(presentation.opening.noteLeft + presentation.opening.headingWidth).toBeLessThan((await svg.boundingBox())!.x);
    } else {
      expect(presentation.opening.readingBottom).toBeLessThan(presentation.top);
    }
    await expect(svg.locator("image")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test(`the ${colorScheme} architecture remains readable on a 320px phone`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    const svg = page.locator(".home-hero-architecture__svg");
    await expect(svg).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const pixels = await svg.evaluate((node) => {
      if (!(node instanceof SVGSVGElement)) throw new Error("Expected an SVG diagram");
      const matrix = node.getScreenCTM();
      if (!matrix) throw new Error("Diagram has no screen transform");
      const scale = Math.hypot(matrix.a, matrix.b);
      return [...node.querySelectorAll(".home-architecture-ring-label text")].map((label) => ({
        layer: label.closest("[data-layer]")?.getAttribute("data-layer"),
        size: parseFloat(getComputedStyle(label).fontSize) * scale,
      }));
    });
    for (const font of pixels) {
      expect(font.size, `${font.layer} narrow-phone label size`).toBeGreaterThanOrEqual(
        font.layer === "awareness-radius" ? 14 : 16,
      );
    }
    const read = page.getByRole("navigation", { name: "Begin exploring DOT" })
      .getByRole("link", { name: "Read Book One", exact: true });
    await expect(read).toBeInViewport({ ratio: 1 });
    await expectNoHorizontalOverflow(page);
  });
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`the illustrated opening keeps reading immediate with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const hero = page.locator("#threshold");
    await expect(hero.getByRole("heading", {
      name: "What shapes the life you live?",
    })).toBeVisible();
    const read = hero.getByRole("link", { name: "Read Book One", exact: true });
    await expect(read).toBeInViewport();

    const entry = await hero.locator(".home-hero-entry").evaluate((node) => {
      const style = getComputedStyle(node);
      return { opacity: style.opacity, animation: style.animationName };
    });
    expect(entry).toEqual({ opacity: "1", animation: "none" });
    const headingMotion = await hero.locator(".home-hero-title > span").evaluateAll((spans) =>
      spans.map((span) => ({
        animation: getComputedStyle(span).animationName,
        iterations: getComputedStyle(span).animationIterationCount,
      })),
    );
    expect(headingMotion.every(({ iterations }) => iterations === "1")).toBe(true);
    if (reducedMotion === "reduce") {
      expect(headingMotion.every(({ animation }) => animation === "none")).toBe(true);
    }
    await expectNoHorizontalOverflow(page);
  });
}

for (const viewport of [
  { width: 640, height: 960 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
]) {
  test(`the illustrated opening fits a ${viewport.width}x${viewport.height} reading surface`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);

    const svg = page.locator(".home-hero-architecture__svg");
    const reading = page.getByRole("navigation", { name: "Begin exploring DOT" })
      .getByRole("link", { name: "Read Book One", exact: true });
    await expect(reading).toBeInViewport({ ratio: 1 });
    await expect(reading).toHaveAccessibleDescription("Begin with the preface · Free to read");

    const diagram = await svg.boundingBox();
    const question = await page.locator(".home-hero-title").boundingBox();
    expect(diagram).not.toBeNull();
    expect(question).not.toBeNull();
    if (viewport.width >= 768) {
      expect(question!.x + question!.width).toBeLessThanOrEqual(diagram!.x);
    } else {
      expect(question!.y + question!.height).toBeLessThan(diagram!.y);
    }

    const labels = await svg.evaluate((node) => {
      if (!(node instanceof SVGSVGElement)) throw new Error("Expected an SVG diagram");
      const matrix = node.getScreenCTM();
      if (!matrix) throw new Error("Diagram has no screen transform");
      return [...node.querySelectorAll(".home-architecture-ring-label text")].map((label) => ({
        layer: label.closest("[data-layer]")?.getAttribute("data-layer"),
        pixels: parseFloat(getComputedStyle(label).fontSize) * Math.hypot(matrix.a, matrix.b),
      }));
    });
    for (const label of labels) {
      expect(label.pixels, `${label.layer} intermediate-width label size`)
        .toBeGreaterThanOrEqual(label.layer === "awareness-radius" ? 14 : 16);
    }
    await expectNoHorizontalOverflow(page);
  });
}

test("the reading invitation opens the preface directly from the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const reading = page.getByRole("navigation", { name: "Begin exploring DOT" })
    .getByRole("link", { name: "Read Book One", exact: true });
  await reading.focus();
  await expect(reading).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/book\/digital-organism-theory\/preface$/);
  await expect(page.locator("main")).toBeVisible();
});

test("readers can reveal and close the model guide from the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const guide = page.locator(".home-architecture-guide");
  const summary = guide.locator("summary");
  await expect(guide.locator("dl")).not.toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(guide.locator("dl")).toBeVisible();
  await expect(guide.getByText(/You, the local experiencer/)).toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(guide.locator("dl")).not.toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("diagram layers remain keyboard-accessible reading paths", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const svg = page.locator(".home-hero-architecture__svg");

  for (const layer of ["possibility-field", "big-c", "reality-frame", "little-c"]) {
    const link = svg.locator(`a[href="#${layer}"]`);
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${layer}$`));
    await expect(page.locator(`#${layer}`)).toBeVisible();
  }
});
