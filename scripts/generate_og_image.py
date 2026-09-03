"""Generate the Open Graph share images for dotheory.org.

The cards mirror the platform identity: off-white paper, the cinnabar
fingerprint dot (the NucleusMark), and editorial serif titles. Output is a
1200x630 PNG — the Open Graph / Twitter `summary_large_image` size. The site
card names the Academy; Book One has its own card so the two objects are never
collapsed in a shared link.

A chapter link is the thing people actually share, so each chapter also gets
its own card naming that chapter. One card for the whole book would make every
shared chapter look like every other one.

Run:  .venv/bin/python scripts/generate_og_image.py
Output: frontend/public/og-image.png
        frontend/public/og/book-one.png
        frontend/public/og/book/<section-slug>.png (one per released section)
"""

from __future__ import annotations

import json
import math
import os

from PIL import Image, ImageDraw, ImageFont

# Brand palette (see frontend/src/index.css and index.html theme-color).
PAPER = (247, 247, 244)  # #f7f7f4
INK = (26, 26, 24)  # near-black
INK_SOFT = (90, 90, 86)  # muted ink for the subtitle
CINNABAR = (220, 38, 38)  # #dc2626 — the dot
HAIRLINE = (26, 26, 24)  # foreground hairline, applied at low alpha

WIDTH, HEIGHT = 1200, 630
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")
OUT_PATH = os.path.join(PUBLIC_DIR, "og-image.png")
BOOK_OUT_PATH = os.path.join(PUBLIC_DIR, "og", "book-one.png")
CHAPTER_OUT_DIR = os.path.join(PUBLIC_DIR, "og", "book")
RELEASE_MANIFEST = os.path.join(
    PUBLIC_DIR, "publications", "henok", "digital-organism-theory", "v3", "manifest.json"
)

SERIF_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"


def _font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def _fitted_font(
    draw: ImageDraw.ImageDraw,
    path: str,
    lines: tuple[str, ...],
    max_size: int,
    max_width: int,
) -> ImageFont.FreeTypeFont:
    """Return one type size that keeps every line inside the text block."""
    for size in range(max_size, 23, -1):
        candidate = _font(path, size)
        if all(draw.textbbox((0, 0), line, font=candidate)[2] <= max_width for line in lines):
            return candidate
    return _font(path, 24)


def _wrapped(
    draw: ImageDraw.ImageDraw,
    path: str,
    text: str,
    max_size: int,
    max_width: int,
    max_lines: int,
) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    """The largest type size at which `text` still fits within `max_lines`."""
    words = text.split()
    for size in range(max_size, 27, -2):
        font = _font(path, size)
        lines: list[str] = []
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            fits = draw.textbbox((0, 0), candidate, font=font)[2] <= max_width
            if fits or not current:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
        if len(lines) <= max_lines and all(
            draw.textbbox((0, 0), line, font=font)[2] <= max_width for line in lines
        ):
            return font, lines
    return _font(path, 28), [text]


def draw_fingerprint(draw: ImageDraw.ImageDraw, cx: int, cy: int) -> None:
    """The fingerprint whorl: a solid cinnabar core ringed by thinning arcs.

    This echoes NucleusMark — identity held by someone, framed by its own whorl.
    """
    # Concentric broken rings, decreasing opacity outward.
    for i, radius in enumerate(range(28, 96, 9)):
        alpha = max(28, 200 - i * 22)
        outline = CINNABAR + (alpha,)
        # Draw as a broken arc so it reads as a whorl, not a target.
        start = (i * 47) % 360
        sweep = 300 - (i * 13) % 60
        draw.arc(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            start=start,
            end=start + sweep,
            fill=outline,
            width=3,
        )
    # The core dot.
    core = 16
    draw.ellipse([cx - core, cy - core, cx + core, cy + core], fill=CINNABAR)
    inner = 6
    draw.ellipse(
        [cx - inner, cy - inner, cx + inner, cy + inner],
        fill=PAPER + (180,),
    )


def _new_card() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    """Paper, hairline, and the fingerprint — what every card shares."""
    img = Image.new("RGBA", (WIDTH, HEIGHT), PAPER + (255,))
    draw = ImageDraw.Draw(img)
    draw.rectangle([24, 24, WIDTH - 24, HEIGHT - 24], outline=HAIRLINE + (28,), width=1)
    draw_fingerprint(draw, 250, HEIGHT // 2)
    return img, draw


def _save(img: Image.Image, path: str) -> None:
    out = Image.new("RGB", img.size, PAPER)
    out.paste(img, mask=img.split()[3])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.save(path, "PNG", optimize=True)
    print(f"wrote {os.path.abspath(path)} ({out.size[0]}x{out.size[1]})")


def section_label(section: dict) -> str:
    """Mirrors `sectionLabel` in BookOnePage.tsx, so a share card and the page
    it opens name the section the same way."""
    if section["kind"] == "chapter":
        return f"Chapter {section['number']}"
    if section["kind"] == "preface":
        return "Preface"
    return "Notes and sources"


def chapter_card(section: dict, manifest: dict) -> Image.Image:
    img, draw = _new_card()
    text_x = 420
    text_width = WIDTH - text_x - 52

    draw.text((text_x, 132), "DOTHEORY · BOOK ONE", font=_font(SERIF_BOLD, 26), fill=CINNABAR)
    draw.text((text_x, 186), section_label(section), font=_font(SERIF, 27), fill=INK_SOFT)

    title_font, title_lines = _wrapped(
        draw, SERIF_BOLD, section["title"], 60, text_width, 3
    )
    y = 238
    for line in title_lines:
        draw.text((text_x, y), line, font=title_font, fill=INK)
        y += int(title_font.size * 1.18)

    release = manifest["release"]
    draw.text(
        (text_x, 498),
        f"{manifest['project']['title']} · {release['label']}, version {release['version']}",
        font=_font(SERIF, 22),
        fill=INK_SOFT,
    )
    return img


def main() -> None:
    # The public site: a living Academy, not the book cover.
    img, draw = _new_card()

    text_x = 420
    text_width = WIDTH - text_x - 52
    title_lines = ("The intellectual", "home of DOT.")
    title_font = _fitted_font(draw, SERIF_BOLD, title_lines, 68, text_width)
    detail_font = _fitted_font(
        draw,
        SERIF,
        ("Definitions · Diagrams · Hypotheses · Critical inquiry",),
        25,
        text_width,
    )

    draw.text((text_x, 150), "DOT ACADEMY · LIVING INQUIRY", font=_font(SERIF_BOLD, 25), fill=CINNABAR)
    draw.text((text_x, 218), title_lines[0], font=title_font, fill=INK)
    draw.text((text_x, 296), title_lines[1], font=title_font, fill=INK)
    draw.text(
        (text_x, 410),
        "Definitions · Diagrams · Hypotheses · Critical inquiry",
        font=detail_font,
        fill=INK_SOFT,
    )
    draw.text(
        (text_x, 478),
        "Books remain distinct, fixed publications.",
        font=_font(SERIF, 24),
        fill=INK_SOFT,
    )

    _save(img, OUT_PATH)

    # Book One keeps a share identity of its own.
    img, draw = _new_card()
    title_lines = ("Consciousness:", "A Digital Organism")
    title_font = _fitted_font(draw, SERIF_BOLD, title_lines, 72, text_width)
    subtitle_font = _fitted_font(
        draw,
        SERIF,
        ("Book One of Digital Organism Theory",),
        34,
        text_width,
    )
    tag_font = _font(SERIF, 27)

    # "DOT" eyebrow mark.
    eyebrow_font = _font(SERIF_BOLD, 30)
    draw.text((text_x, 162), "DOTHEORY", font=eyebrow_font, fill=CINNABAR)

    # Book title, wrapped over two lines.
    draw.text((text_x, 214), title_lines[0], font=title_font, fill=INK)
    draw.text((text_x, 296), title_lines[1], font=title_font, fill=INK)

    # Subtitle.
    draw.text(
        (text_x, 405),
        "Book One of Digital Organism Theory",
        font=subtitle_font,
        fill=INK_SOFT,
    )

    # Tagline at the base.
    draw.text(
        (text_x, 474),
        "Every claim returns to its source.",
        font=tag_font,
        fill=INK_SOFT,
    )

    _save(img, BOOK_OUT_PATH)

    # One card per released section, named by the manifest the reader serves.
    with open(RELEASE_MANIFEST, encoding="utf-8") as handle:
        manifest = json.load(handle)
    for section in manifest["sections"]:
        _save(
            chapter_card(section, manifest),
            os.path.join(CHAPTER_OUT_DIR, f"{section['slug']}.png"),
        )


if __name__ == "__main__":
    main()
