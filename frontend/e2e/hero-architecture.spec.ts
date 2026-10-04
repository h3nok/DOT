import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

for (const colorScheme of ["light", "dark"] as const) {
  test(`the ${colorScheme} architecture is the hero's readable focal point`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    const svg = page.locator(".home-hero-architecture__svg");
    await expect(svg).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    const substrate = await page.locator("#threshold").evaluate(node => {
      const style = getComputedStyle(node, "::before");
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("Cannot measure the hero veil.");
      context.fillStyle = getComputedStyle(node).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return {
        layers: (style.backgroundImage.match(/(?:radial|linear)-gradient\(/g) ?? []).length,
        background: style.backgroundImage,
        veilAlpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
        opacity: Number(style.opacity),
        inset: [style.top, style.right, style.bottom, style.left],
        animation: style.animationName,
        pointerEvents: style.pointerEvents,
      };
    });
    expect(substrate.layers).toBe(1);
    expect(substrate.background).not.toContain("linear-gradient");
    expect(substrate.veilAlpha, "The splash field must remain visible through the hero").toBeLessThanOrEqual(0.15);
    expect(substrate.inset).toEqual(["0px", "0px", "0px", "0px"]);
    expect(substrate.opacity).toBeGreaterThan(0);
    expect(substrate.animation).toBe("none");
    expect(substrate.pointerEvents).toBe("none");
    await expect(page.locator(".organism-membrane canvas")).toHaveCount(1);

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
      const linearColor = (color: string) => {
        context.fillStyle = background;
        context.fillRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
          .map((channel) => channel / 255)
          .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      };
      const luminance = (color: string) => {
        const channels = linearColor(color);
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const labColor = (color: string) => {
        const [r, g, b] = linearColor(color);
        const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        return [
          0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
        ];
      };
      const physicalBoundary = node.querySelector(".home-architecture-frame-boundary");
      const intentColour = node.querySelector(".home-architecture-thread-to");
      if (!physicalBoundary || !intentColour) throw new Error("Physical and conscious-process colours are missing");
      const physical = labColor(getComputedStyle(physicalBoundary).stroke);
      const conscious = labColor(getComputedStyle(intentColour).stopColor);
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
      const readingNote = read.querySelector(".dot-button__copy > span");
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
        systemDomainDistance: Math.hypot(...physical.map((channel, index) => channel - conscious[index])),
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
        lighting: {
          surfaceCount: node.querySelectorAll(".home-architecture-surface[filter]").length,
          gradientTones: [...node.querySelectorAll(".home-architecture-surface-gradient")].map(gradient =>
            new Set([...gradient.querySelectorAll("stop")].map(stop => getComputedStyle(stop).stopColor)).size,
          ),
          gradientLight: [...node.querySelectorAll(".home-architecture-surface-gradient")].map(gradient =>
            [...gradient.querySelectorAll("stop")].map(stop => luminance(getComputedStyle(stop).stopColor)),
          ),
          figureFilter: getComputedStyle(node).filter,
          labelFilters: labels.map(label => getComputedStyle(label).filter),
          traceFilters: [...node.querySelectorAll(".home-architecture-causal-trace path")]
            .map(path => getComputedStyle(path).filter),
        },
        captionVisible: !!caption && getComputedStyle(caption).position !== "absolute",
        explanationBeforeDiagram: !!explanation &&
          !!(explanation.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });

    expect(presentation.overlap).toBe(false);
    expect(presentation.systemDomainDistance, "RF₀ structure must be distinguishable from conscious Intent")
      .toBeGreaterThanOrEqual(0.05);
    expect(presentation.lighting.surfaceCount).toBe(3);
    expect(presentation.lighting.gradientTones).toHaveLength(3);
    expect(presentation.lighting.gradientTones.every(tones => tones >= 3)).toBe(true);
    for (const levels of presentation.lighting.gradientLight) {
      for (let index = 1; index < levels.length; index++) {
        expect(levels[index - 1], "Each surface shades away from its light source")
          .toBeGreaterThan(levels[index]);
      }
    }
    expect(presentation.lighting.figureFilter).toBe("none");
    expect(presentation.lighting.labelFilters.every(filter => filter === "none")).toBe(true);
    expect(presentation.lighting.traceFilters.every(filter => filter === "none")).toBe(true);
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
    expect(presentation.opening.headingWidth).toBeLessThanOrEqual(600);
    expect(presentation.opening.lifeWidth).toBeLessThanOrEqual(600);
    expect(presentation.opening.questionBeforeDiagram).toBe(true);
    expect(presentation.opening.readingHeight).toBeGreaterThanOrEqual(72);
    expect(presentation.opening.readingRadius).toBeLessThan(presentation.opening.readingHeight / 2);
    expect(presentation.opening.readingBottom).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
    expect(presentation.opening.readingContrast).toBeGreaterThanOrEqual(4.5);
    expect(presentation.opening.readingNoteContrast).toBeGreaterThanOrEqual(4.5);
    expect(presentation.opening.washBottom).toBeLessThanOrEqual(presentation.opening.readingTop);
    await expect(page.getByRole("region", { name: "Key concepts from Book One" })).toBeVisible();
    const inquiry = page.getByRole("textbox", { name: "Ask a question about Digital Organism Theory" });
    await expect(inquiry).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Begin exploring DOT" })
      .getByRole("link", { name: "Begin with lived experience" })).toBeInViewport();
    for (const font of presentation.fonts) {
      expect(font.pixels, `${font.layer} rendered label size`).toBeGreaterThanOrEqual(
        font.layer === "awareness-radius" ? 14 : 16,
      );
      expect(font.contrast, `${font.layer} painted label contrast`).toBeGreaterThanOrEqual(4.5);
    }
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      expect(presentation.opening.headingWidth).toBeGreaterThanOrEqual(512);
      expect(presentation.opening.lifeWidth).toBeGreaterThanOrEqual(480);
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
      .getByRole("link", { name: "Begin with lived experience", exact: true });
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
    const read = hero.getByRole("link", { name: "Begin with lived experience", exact: true });
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
      .getByRole("link", { name: "Begin with lived experience", exact: true });
    await expect(reading).toBeInViewport({ ratio: 1 });
    await expect(reading).toHaveAccessibleDescription("Begin with the preface · Free to read");

    const diagram = await svg.boundingBox();
    const question = await page.locator(".home-hero-title").boundingBox();
    expect(diagram).not.toBeNull();
    expect(question).not.toBeNull();
    if (viewport.width >= 1100) {
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

test("the reading invitation opens the lived-experience path from the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const reading = page.getByRole("navigation", { name: "Begin exploring DOT" })
    .getByRole("link", { name: "Begin with lived experience", exact: true });
  await reading.focus();
  await expect(reading).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/book\/digital-organism-theory\/preface\?path=start-where-you-live$/);
  await expect(page.locator("main")).toBeVisible();
  const next = page.getByRole("navigation", { name: "Chapter navigation" })
    .getByRole("link", { name: "Begin with lived experience The Canvas" });
  await expect(next).toHaveAttribute(
    "href",
    "/book/digital-organism-theory/the-canvas?path=start-where-you-live",
  );
  await next.click();
  await expect(page).toHaveURL(/\/book\/digital-organism-theory\/the-canvas\?path=start-where-you-live$/);
  await expect(page.getByRole("heading", { level: 1, name: "The Canvas" })).toBeVisible();
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
