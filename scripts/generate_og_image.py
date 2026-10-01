"""Generate the Open Graph share images for dotheory.org.

The cards mirror the shared DOT identity: warm ivory, green ink, the
nucleus mark, and Space Grotesk titles. Output is a
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
import os
from pathlib import Path

from PIL import Image, ImageColor, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
IDENTITY = json.loads((ROOT / "frontend/src/content/identity.json").read_text())
PAPER = ImageColor.getrgb(IDENTITY["light"]["surface"])
INK = ImageColor.getrgb(IDENTITY["light"]["ink"])
INK_SOFT = ImageColor.getrgb(IDENTITY["light"]["muted"])
JADE = ImageColor.getrgb(IDENTITY["light"]["accent"])
HAIRLINE = INK

WIDTH, HEIGHT = 1200, 630
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")
OUT_PATH = os.path.join(PUBLIC_DIR, "og-image.png")
BOOK_OUT_PATH = os.path.join(PUBLIC_DIR, "og", "book-one.png")
CHAPTER_OUT_DIR = os.path.join(PUBLIC_DIR, "og", "book")
RELEASE_MANIFEST = os.path.join(
    PUBLIC_DIR, "publications", "henok", "digital-organism-theory", "v3", "manifest.json"
)

DISPLAY = str(ROOT / "design/fonts/space-grotesk-500-normal.ttf")
SERIF = str(ROOT / "design/fonts/source-serif-4-400-normal.ttf")
ANNOTATION = str(ROOT / "design/fonts/jetbrains-mono-400-normal.ttf")


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


def draw_nucleus(draw: ImageDraw.ImageDraw, cx: int, cy: int, size: int = 200) -> None:
    scale = size / 100

    def bounds(radius: float) -> tuple[float, float, float, float]:
        r = radius * scale
        return cx - r, cy - r, cx + r, cy + r

    for radius, width, opacity in ((44, 1.35, 0.32), (30, 1.55, 0.62), (15, 1.4, 0.36)):
        draw.ellipse(
            bounds(radius),
            outline=JADE + (round(255 * opacity),),
            width=max(1, round(width * scale)),
        )
    draw.arc(bounds(34), -90, 90, fill=JADE + (230,), width=max(1, round(2.25 * scale)))
    draw.arc(bounds(34), 90, 270, fill=JADE + (143,), width=max(1, round(1.8 * scale)))
    draw.ellipse(bounds(7.5), fill=JADE)
    draw.ellipse(bounds(3.25), fill=PAPER + (184,))


def _new_card() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    """Paper, hairline, and the nucleus — what every card shares."""
    img = Image.new("RGBA", (WIDTH, HEIGHT), PAPER + (255,))
    draw = ImageDraw.Draw(img)
    draw.rectangle([24, 24, WIDTH - 24, HEIGHT - 24], outline=HAIRLINE + (28,), width=1)
    draw_nucleus(draw, 250, HEIGHT // 2)
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

    draw.text((text_x, 132), "DOTHEORY · BOOK ONE", font=_font(ANNOTATION, 22), fill=JADE)
    draw.text((text_x, 186), section_label(section), font=_font(SERIF, 27), fill=INK_SOFT)

    title_font, title_lines = _wrapped(draw, DISPLAY, section["title"], 60, text_width, 3)
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
    title_font = _fitted_font(draw, DISPLAY, title_lines, 68, text_width)
    detail_font = _fitted_font(
        draw,
        SERIF,
        ("Definitions · Diagrams · Hypotheses · Critical inquiry",),
        25,
        text_width,
    )

    draw.text((text_x, 150), "DOT ACADEMY · LIVING INQUIRY", font=_font(ANNOTATION, 22), fill=JADE)
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
    title_font = _fitted_font(draw, DISPLAY, title_lines, 72, text_width)
    subtitle_font = _fitted_font(
        draw,
        SERIF,
        ("Book One of Digital Organism Theory",),
        34,
        text_width,
    )
    tag_font = _font(SERIF, 27)

    # "DOT" eyebrow mark.
    eyebrow_font = _font(ANNOTATION, 27)
    draw.text((text_x, 162), "DOTHEORY", font=eyebrow_font, fill=JADE)

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

    icon = Image.new("RGBA", (640, 640), PAPER + (255,))
    draw_nucleus(ImageDraw.Draw(icon), 320, 320, 540)
    solid = Image.new("RGB", icon.size, PAPER)
    solid.paste(icon, mask=icon.getchannel("A"))
    solid.resize((180, 180), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC_DIR, "apple-touch-icon.png")
    )
    solid.save(os.path.join(PUBLIC_DIR, "favicon-dot.ico"), sizes=[(16, 16), (32, 32)])
    solid.save(os.path.join(PUBLIC_DIR, "favicon-dot-16.ico"), sizes=[(16, 16)])


if __name__ == "__main__":
    main()
