import { describe, expect, it } from "vitest";

import author from "../src/content/author.json";
import identity from "../src/content/identity.json";
import book from "../public/publications/henok/digital-organism-theory/v4/manifest.json";
import { BANNER_SAFE_AREA, buildChannelAssets, buildChannelSetup } from "./render-channel-kit.mjs";
import { buildSetupPage, buildSetupText } from "./channel-setup-page.mjs";
import { bumperToSplash, SPLASH_BUMPER, SPLASH_CAPTIONS, SPLASH_VIDEO, splashToBumper } from "./channel-splash-video.mjs";
import { buildInquiryDocument, INQUIRY_VIDEOS, inquirySubtitles, inquiryTypeTicks } from "./channel-inquiry-video.mjs";

describe("YouTube channel artwork", () => {
  it("produces upload-sized banner, avatar, thumbnails, and title/end cards", () => {
    const assets = buildChannelAssets(author);
    expect(assets.map(({ name, width, height }) => [name, width, height])).toEqual([
      ["banner", 2560, 1440],
      ["avatar", 800, 800],
      ["watermark", 512, 512],
      ["thumbnail-introduction", 1280, 720],
      ["thumbnail-concepts", 1280, 720],
      ["thumbnail-agency", 1280, 720],
      ["thumbnail-open-questions", 1280, 720],
      ["thumbnail-amm", 1280, 720],
      ["thumbnail-amm-power", 1280, 720],
      ["splash", 1920, 1080],
      ["end-card", 1920, 1080],
      ["book-background", 1400, 2000],
    ]);
    expect(assets[0].maxBytes).toBe(6_000_000);
    expect(assets.slice(1).every((asset) => asset.maxBytes <= 2_000_000)).toBe(true);
  });

  it("uses a conservative centre safe area based on YouTube's minimum-size specification", () => {
    const ratio = 2560 / 2048;
    expect(BANNER_SAFE_AREA.width).toBeLessThan(1235 * ratio);
    expect(BANNER_SAFE_AREA.height).toBeLessThan(338 * ratio);
    expect(BANNER_SAFE_AREA.x + BANNER_SAFE_AREA.width / 2).toBe(1280);
    expect(BANNER_SAFE_AREA.y + BANNER_SAFE_AREA.height / 2).toBe(720);
  });

  it("exports valid, accessible SVG without outside requests or motion", () => {
    for (const asset of buildChannelAssets(author)) {
      const document = new DOMParser().parseFromString(asset.svg, "image/svg+xml");
      expect(document.querySelector("parsererror"), asset.name).toBeNull();
      expect(document.documentElement.getAttribute("viewBox")).toBe(`0 0 ${asset.width} ${asset.height}`);
      expect(document.querySelector("title")?.textContent).toBe(asset.name);
      expect(document.querySelector("desc")?.textContent).toBeTruthy();
      expect(document.querySelector("[data-essential]")).not.toBeNull();
      expect(document.querySelector("script, foreignObject, animate, animateTransform, image")).toBeNull();
      for (const reference of document.querySelectorAll("[href]")) {
        const id = reference.getAttribute("href");
        expect(id?.startsWith("#")).toBe(true);
        expect(document.getElementById(id!.slice(1))).not.toBeNull();
      }
    }
  });

  it("takes the author credit from the same record as the About page while keeping splash free of author text", () => {
    const assets = buildChannelAssets(author);
    const credit = `${author.name}, ${author.suffix}`;
    expect(assets.find((asset) => asset.name === "banner")?.svg).toContain(credit);
    const splashSvg = assets.find((asset) => asset.name === "splash")?.svg;
    expect(splashSvg).not.toContain(author.name);
    expect(splashSvg).toContain("Big C");
    expect(splashSvg).toContain("Little c");
    expect(splashSvg).toContain("A PROPOSED MODEL OF REALITY");
    expect(splashSvg).toContain("living by the rules of RF₀");
    const replacement = buildChannelAssets({ name: "Example Author", suffix: "" });
    expect(replacement[0].svg).toContain("Example Author");
    expect(replacement[0].svg).not.toContain(author.name);
    expect(replacement[0].svg).not.toContain("PhD");
  });

  it("escapes author text rather than interpreting it as SVG markup", () => {
    const svg = buildChannelAssets({ name: "<Example & Author>", suffix: "PhD" })[0].svg;
    expect(svg).toContain("&lt;Example &amp; Author&gt;, PhD");
    expect(new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")).toBeNull();
  });

  it("fails explicitly on missing or empty author data", () => {
    expect(() => buildChannelAssets({ name: "", suffix: "PhD" })).toThrow("must not be empty");
    expect(() => buildChannelAssets({ name: "Example Author" })).toThrow("suffix must be a string");
  });

  it("keeps hypothetical imagery and unanswered questions honest", () => {
    const assets = buildChannelAssets(author);
    expect(assets.find((asset) => asset.name === "thumbnail-introduction")?.svg).toContain("not a measured physical structure");
    expect(assets.find((asset) => asset.name === "thumbnail-open-questions")?.svg).toContain("inquiry, not certainty");
    expect(assets.some((asset) => /youtube\.com|youtu\.be|subscribe now|scientifically proven/i.test(asset.svg))).toBe(false);
  });

  it("provides an optional watermark with no full-canvas background", () => {
    const watermark = buildChannelAssets(author).find((asset) => asset.name === "watermark");
    expect(watermark?.transparent).toBe(true);
    expect(watermark?.maxBytes).toBeLessThan(1_000_000);
    const document = new DOMParser().parseFromString(watermark!.svg, "image/svg+xml");
    expect(document.querySelector("svg > rect")).toBeNull();
  });

  it("records the confirmed channel handle from author.json while keeping uncreated setups separate", () => {
    const setup = buildChannelSetup(author, book);
    expect(setup.status).toBe("created");
    expect(setup.confirmed_handle).toBe("@dotheory");
    expect(setup.confirmed_channel_url).toBe("https://www.youtube.com/@dotheory");
    expect(setup.confirmed_channel_id).toBe("UC4CHvpLItOyp7tdCdqI8ncg");
    expect(setup.confirmed_channel_id_url).toBe("https://www.youtube.com/channel/UC4CHvpLItOyp7tdCdqI8ncg");
    const uncreated = buildChannelSetup({ ...author, links: { ...author.links, youtube: "" } }, book);
    expect(uncreated.status).toBe("not_created");
    expect(uncreated.confirmed_handle).toBeNull();
    expect(uncreated.confirmed_channel_url).toBeNull();
    expect(uncreated.confirmed_channel_id).toBeNull();
    expect(uncreated.confirmed_channel_id_url).toBeNull();
    expect(setup.proposed_handles[0]).toBe("@dotheory");
    expect(setup.description.length).toBeLessThanOrEqual(1000);
    expect(setup.description).toContain(author.name);
    expect(setup.description).toContain(book.project.title);
    expect(setup.description).toContain("The American Millennial Manifesto");
    expect(setup.links.map((link) => link.url)).toContain("https://dotheory.org/amm");
    expect(setup.playlists).toHaveLength(3);
    for (const level of book.reader_contract.claim_levels) expect(setup.description).toContain(level);
    expect(setup.description).toContain("practical and moral framework—not an ideology");
    expect(setup.description).not.toMatch(/founded by|reclaim|rigged|break it|movement/i);
    expect(setup.description).not.toMatch(/subscribe|weekly|coming soon|PhD/);
    expect(buildSetupText(setup)).toContain("No published episodes, publishing cadence, channel ownership, or reserved handle are claimed.");
  });

  it("renders local download links, safe profile text, and copy controls without network dependencies", () => {
    const setup = buildChannelSetup(author, book);
    setup.name = '<img src="https://example.org/track">';
    setup.description = '</textarea><script>alert("unsafe")</script>';
    const document = new DOMParser().parseFromString(buildSetupPage(setup), "text/html");
    expect(document.querySelector<HTMLInputElement>("#channel-name")?.value).toBe(setup.name);
    expect(document.querySelector<HTMLTextAreaElement>("#description")?.value).toBe(setup.description);
    expect(document.scripts).toHaveLength(1);
    expect(document.querySelector("script[src],link[href],iframe")).toBeNull();
    expect(document.querySelector("button[data-copy='description']")).not.toBeNull();
    expect(document.querySelector("a[download][href='watermark.png']")).not.toBeNull();
    expect([...document.images].every((image) => !image.getAttribute("src")?.includes(":"))).toBe(true);
  });

  it("embeds supplied assets for offline previews and names their downloads", () => {
    const setup = buildChannelSetup(author, book);
    const data = "data:image/png;base64,cG5n";
    const document = new DOMParser().parseFromString(buildSetupPage(setup, "", { "banner.png": data }), "text/html");
    expect(document.querySelector("a[download='banner.png']")?.getAttribute("href")).toBe(data);
    expect(document.querySelector(`img[src='${data}']`)).not.toBeNull();
  });

  it("shows a real video with a still poster and native controls only when an export exists", () => {
    const setup = { ...buildChannelSetup(author, book), video: SPLASH_VIDEO };
    const document = new DOMParser().parseFromString(buildSetupPage(setup), "text/html");
    const video = document.querySelector("video");
    expect(video?.hasAttribute("controls")).toBe(true);
    expect(video?.hasAttribute("autoplay")).toBe(false);
    expect(video?.hasAttribute("loop")).toBe(false);
    expect(video?.getAttribute("poster")).toBe("splash.png");
    expect(video?.querySelector("source")?.getAttribute("src")).toBe("splash-intro.mp4");
    expect(buildSetupText(setup)).toContain(`finished ${SPLASH_VIDEO.duration_seconds}-second introductory opening video with quiet digital audio`);
    const stillOnly = new DOMParser().parseFromString(buildSetupPage(buildChannelSetup(author, book)), "text/html");
    expect(stillOnly.querySelector("video")).toBeNull();
  });

  it("keeps the opening video's text to one short, typed line per scene, with T × E marked speculative", () => {
    const splashSvg = buildChannelAssets(author).find((asset) => asset.name === "splash")!.svg;
    const document = new DOMParser().parseFromString(splashSvg, "image/svg+xml");
    expect(document.querySelectorAll("[data-caption]")).toHaveLength(SPLASH_CAPTIONS.length);
    expect(document.querySelector("[data-act-card], [data-splash-chain]")).toBeNull();
    expect(SPLASH_CAPTIONS.every(({ text }) => text.length <= 48)).toBe(true);
    expect(SPLASH_CAPTIONS[0]).toMatchObject({ tag: "SPECULATIVE" });
    expect(splashSvg).not.toMatch(/Time × Energy|Energy \(E\)/);
  });

  it("maps the 5-second opener onto the full animation from first frame to brand lockup", () => {
    expect(SPLASH_BUMPER.duration_seconds).toBe(5);
    expect(bumperToSplash(0)).toBe(0);
    expect(bumperToSplash(5)).toBe(SPLASH_VIDEO.duration_seconds);
    expect(splashToBumper(bumperToSplash(2.1))).toBeCloseTo(2.1);
    const setup = { ...buildChannelSetup(author, book), video: SPLASH_VIDEO, bumper: SPLASH_BUMPER };
    const document = new DOMParser().parseFromString(buildSetupPage(setup), "text/html");
    expect(document.querySelector("video source[src='splash-bumper.mp4']")).not.toBeNull();
  });

  it("paces the film suite with relatable examples, honest model language, and a quiet visual invitation", () => {
    const markSplashSpec = INQUIRY_VIDEOS.find(({ name }) => name === "mark-splash")!;
    const introSpec = INQUIRY_VIDEOS.find(({ name }) => name === "inquiry-intro")!;
    const trailerSpec = INQUIRY_VIDEOS.find(({ name }) => name === "inquiry-trailer")!;
    expect(markSplashSpec.duration).toBe(5);
    expect(markSplashSpec.captions).toHaveLength(0);
    expect(introSpec.duration).toBe(30);
    expect(introSpec.samples).toHaveLength(6);
    expect(trailerSpec.duration).toBe(532);
    expect(trailerSpec.samples).toHaveLength(6);
    expect(trailerSpec.scenes).toHaveLength(12);

    const introSrt = inquirySubtitles(introSpec);
    const trailerSrt = inquirySubtitles(trailerSpec);
    // Act I of both films confronts the viewer with the phenomenon of experience BEFORE introducing the theory
    expect(trailerSpec.captions[0].lines.join(" ")).not.toMatch(/Digital Organism Theory|Big C|RF₀/i);
    expect(introSpec.captions[0].lines.join(" ")).not.toMatch(/Digital Organism Theory|Big C|RF₀/i);
    expect(introSrt).toContain("Before you measure the world, you are here to experience it.");
    expect(introSrt).toContain("A model centered on consciousness: the Digital Organism.");
    expect(introSrt).toContain("From Primordial Continuity (T) and External Environment (E), process emerges.");
    expect(introSrt).toContain("The Canvas carries your history. The Painting interprets RF₀.");
    expect(introSrt).toContain("For Little c, Love is a low-entropy Canvas state.");
    expect(introSrt).toContain("When Canvas fragmentation drops, Fear stops governing and Intent coheres.");
    expect(introSrt).toContain("Consciousness: A Digital Organism");
    expect(trailerSrt).toContain("A life can look coherent from the outside while feeling misaligned within.");
    expect(trailerSrt).toContain("Begin with the nearest fact: experience occurs.");
    expect(trailerSrt).toContain("Feeling is data. Understanding what it tells us takes care, comparison, and a willingness to be corrected.");
    expect(trailerSrt).toContain("And every result we examine still reaches us through experience.");
    expect(trailerSrt).toContain("Their reply is one word: Okay.");
    expect(trailerSrt).toContain("When you visit a new place, a map helps you find your way.");
    expect(trailerSrt).toContain("Its computational metaphors are handles for exploring experience.");
    expect(trailerSrt).toContain("T and E are capacities of Big C. They do not precede it or produce it.");
    expect(trailerSrt).toContain("Our physical universe is Reality Frame Zero, or RF-zero. Your Reality Stream is the sequence of experience available to you within it.");
    expect(trailerSrt).toContain("Think of learning to ride a bicycle.");
    expect(trailerSrt).toContain("Like brushstrokes building a painting, those changes form patterns.");
    expect(trailerSrt).toContain("Experience, interpretation, intent, action, and consequence form a loop.");
    expect(trailerSrt).toContain("In DOT, Love names the condition in which Fear no longer governs you.");
    expect(trailerSrt).toContain("Explore at your own pace.");
    expect(trailerSpec.scenes!.at(-1)!.primaryStatement).not.toMatch(/D-O-Theory dot org|DOTHEORY\.ORG|Let us rebuild our community/);
    expect(trailerSrt).not.toMatch(/cognitive dissonance/i);
    expect(trailerSrt).not.toMatch(/completely detached|completely digital|lives experience/i);
    expect(introSrt + trailerSrt).not.toMatch(/Energy \(E\)|Energy source \(E\)|Time × Energy|Not sure for Big C/i);
    expect(introSrt + trailerSrt).not.toMatch(/subscribe now|hit the bell|like and subscribe|so much advice|what matters to you|current events\. your choices/i);

    // Statements and diagrams have room to change composition, without adding
    // technical cards that compete with the narration.
    expect(new Set(trailerSpec.captions.map((c) => c.layout))).toEqual(new Set(["center", "split"]));
    expect(trailerSpec.captions.every((c) => !c.axiom && !c.concept)).toBe(true);
    expect(trailerSpec.captions.every((c) => typeof c.focusTerm === "string" && c.focusTerm.length > 0)).toBe(true);

    const html = buildInquiryDocument({ video: trailerSpec, identity, fonts: "" });
    expect(html).toContain('type("DOTHEORY.ORG"');
    expect(html).toContain('type("Let us rebuild our community—together."');
    expect(html).toContain("pillLabel");
    expect(html).toContain("drawConcentricTrailerDiagram");
    expect(html).toContain("drawHomeArchitecture");
    expect(html).toContain("drawHomeExperienceLoop");
    expect(html).toContain("drawBigCLoop");
    expect(html).toContain("drawLittleCLoop");
    expect(html).toContain("drawOrdinaryRoomScene");
    expect(html).toContain("window.seekInquiry");
    expect(html).toContain("window.inquiryTextBounds");

    const introTicks = inquiryTypeTicks(introSpec);
    const trailerTicks = inquiryTypeTicks(trailerSpec);
    expect(introTicks.length).toBeGreaterThan(40);
    expect(trailerTicks.length).toBeGreaterThan(100);
    expect(introTicks.every((t: number) => t > 0 && t < introSpec.duration)).toBe(true);
    expect(trailerTicks.every((t: number) => t > 0 && t < trailerSpec.duration)).toBe(true);
  });
});
