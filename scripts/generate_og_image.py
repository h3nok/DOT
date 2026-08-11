"""Generate the Open Graph share image for dotheory.org.

The card mirrors the platform identity: off-white paper, the cinnabar
fingerprint dot (the NucleusMark), and the serif book title. Output is a
1200x630 PNG — the Open Graph / Twitter `summary_large_image` size.

Run:  .venv/bin/python scripts/generate_og_image.py
Output: frontend/public/og-image.png
"""

from __future__ import annotations

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
OUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "public", "og-image.png"
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


def main() -> None:
    img = Image.new("RGBA", (WIDTH, HEIGHT), PAPER + (255,))
    draw = ImageDraw.Draw(img)

    # Subtle paper border hairline.
    draw.rectangle(
        [24, 24, WIDTH - 24, HEIGHT - 24],
        outline=HAIRLINE + (28,),
        width=1,
    )

    # Fingerprint mark, vertically centered on the left third.
    mark_cx, mark_cy = 250, HEIGHT // 2
    draw_fingerprint(draw, mark_cx, mark_cy)

    # Title block on the right two-thirds.
    text_x = 420
    text_width = WIDTH - text_x - 52
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

    # Flatten to RGB on the paper color and save as PNG.
    out = Image.new("RGB", img.size, PAPER)
    out.paste(img, mask=img.split()[3])

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    out.save(OUT_PATH, "PNG", optimize=True)
    print(f"wrote {os.path.abspath(OUT_PATH)} ({out.size[0]}x{out.size[1]})")


if __name__ == "__main__":
    main()
