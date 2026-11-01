"""Render the illustrated Version 5 jacket from DOT's existing diagram grammar.

The homepage's field/organism/frame geometry becomes still cover art.
The embodied exchange uses the same Avatar and Painting marks as the book
plates. It is a diagram of the proposed model, not a physical-location claim.

Serves L1, L7, L8 and L10 through still, legible and honestly labelled artwork;
violates no manifesto law. This writes review assets only, never a release.
"""

from __future__ import annotations

import argparse
import html
import math
import os
from pathlib import Path
import subprocess
import tempfile

from book_v5_artwork import BODY_PATHS, RASTERIZER


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs/blueprint/book-one-complete/v5-working/assets"
WIDTH, HEIGHT = 1800, 2700
INK = "#f2f0e8"
JADE = "#91c8b1"
MUTED = "#b0c5ba"
LINE = "#53796a"
GOLD = "#cfb878"
CLAY = "#d4987e"
SANS = "'Space Grotesk Light', 'Space Grotesk', 'DejaVu Sans', sans-serif"
SERIF = "'Source Serif 4 SmText', 'Source Serif 4', Georgia, serif"
MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace"
ALT = (
    "Cover of Consciousness: A Digital Organism, Book One, by Henok Ghebrechristos. "
    "The theory diagram places T × E, explicitly labelled Speculation, outside "
    "Big C, the proposed conscious process. RF₀ and Little c are both within Big C. "
    "Little c is outside RF₀ and receives its Reality Stream. The living Avatar embodies Little c in RF₀. "
    "Little c, the Canvas and the Avatar remain distinct and connected. Broken "
    "arrows around Big C and Little c indicate process. Version 5, author review."
)


def esc(value):
    return html.escape(str(value), quote=True)


class Cover:
    def __init__(self, review=True):
        self.count = 0
        self.parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
            f'viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-labelledby="cover-title cover-description">',
            '<title id="cover-title">Consciousness: A Digital Organism · Version 5</title>',
            f'<desc id="cover-description">{esc(ALT if review else ALT.replace(", author review.", "."))}</desc>',
            '<defs>',
            '<linearGradient id="cover-ground" x1="0" y1="0" x2="1" y2="1">'
            '<stop stop-color="#0b1714"/><stop offset=".55" stop-color="#142f26"/>'
            '<stop offset="1" stop-color="#0a1713"/></linearGradient>',
            '<radialGradient id="cover-organism" cx=".44" cy=".3" r=".8">'
            '<stop stop-color="#264c3b"/><stop offset=".65" stop-color="#173a2c"/>'
            '<stop offset="1" stop-color="#10281f"/></radialGradient>',
            '<radialGradient id="cover-local" cx=".35" cy=".25" r=".85">'
            '<stop stop-color="#547b5c"/><stop offset="1" stop-color="#224a34"/></radialGradient>',
            '<linearGradient id="cover-rim" x1="0" y1="0" x2="1" y2="1">'
            '<stop stop-color="#c2ddbc"/><stop offset=".55" stop-color="#72a889"/>'
            '<stop offset="1" stop-color="#416d52"/></linearGradient>',
            '<clipPath id="cover-frame-clip"><circle cx="704" cy="1578" r="223"/></clipPath>',
            '<pattern id="cover-grid" width="49" height="49" patternUnits="userSpaceOnUse">'
            '<path d="M49 0H0V49" fill="none" stroke="#769b87" stroke-width="1" opacity=".24"/>'
            '</pattern>',
        ]
        for name, color in (("jade", JADE), ("gold", GOLD), ("ink", INK)):
            self.parts.append(
                f'<marker id="cover-arrow-{name}" markerWidth="17" markerHeight="17" '
                'refX="13" refY="8" orient="auto-start-reverse" markerUnits="userSpaceOnUse">'
                f'<path d="M3 2L13 8L3 14" fill="none" stroke="{color}" stroke-width="2.8" '
                'stroke-linecap="round" stroke-linejoin="round"/></marker>'
            )
        self.parts.extend(['</defs>', f'<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#cover-ground)"/>'])

    def add(self, markup):
        self.parts.append(markup)

    def circle(self, x, y, radius, *, stroke=LINE, fill="none", width=2, opacity=1, dash=None):
        self.add(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="{fill}" stroke="{stroke}" '
                 f'stroke-width="{width}" opacity="{opacity}"'
                 + (f' stroke-dasharray="{dash}"' if dash else "") + '/>')

    def path(self, d, *, color=JADE, width=2, opacity=1, dash=None, arrow=False, both=False):
        arrow_name = "gold" if color == GOLD else "ink" if color == INK else "jade"
        self.add(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" '
                 f'stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}"'
                 + (f' stroke-dasharray="{dash}"' if dash else "")
                 + (f' marker-end="url(#cover-arrow-{arrow_name})"' if arrow or both else "")
                 + (f' marker-start="url(#cover-arrow-{arrow_name})"' if both else "") + '/>')

    def text(self, x, y, value, *, size, color=INK, face=SANS, weight=500,
             anchor="start", bounds=None, italic=False, spacing=None):
        self.count += 1
        bounds = bounds or (125, 100, 1675, 2590)
        self.add(f'<text id="cover-text-{self.count}" data-fit-box="{",".join(str(n) for n in bounds)}" '
                 f'x="{x}" y="{y}" fill="{color}" font-family="{esc(face)}" font-size="{size}" '
                 f'font-weight="{weight}" text-anchor="{anchor}"'
                 + (' font-style="italic"' if italic else "")
                 + (f' letter-spacing="{spacing}"' if spacing else "")
                 + f'><tspan x="{x}" dy="0">{esc(value)}</tspan></text>')

    def finish(self):
        return "\n".join([*self.parts, '</svg>', ''])


def arc(x, y, radius, start, end):
    a, b = math.radians(start), math.radians(end)
    return (f'M{x + math.cos(a) * radius:.2f} {y + math.sin(a) * radius:.2f}'
            f'A{radius} {radius} 0 {int(end - start > 180)} 1 '
            f'{x + math.cos(b) * radius:.2f} {y + math.sin(b) * radius:.2f}')


def artwork(review=True):
    c = Cover(review)
    # Sparse cartographic traces tie the jacket to the existing home diagram.
    c.circle(1800, 1580, 1180, stroke=LINE, width=1, opacity=.14)
    c.circle(1800, 1580, 1320, stroke=LINE, width=1, opacity=.09)
    c.path("M140 220H1660", color=LINE, width=1.5, opacity=.8)
    c.text(140, 165, "DIGITAL ORGANISM THEORY", size=31, face=MONO, color=MUTED, spacing=1.4)
    c.text(1660, 165, "BOOK ONE", size=31, face=MONO, color=JADE, anchor="end")

    c.text(132, 410, "Consciousness:", size=142, bounds=(125, 250, 1675, 435))
    c.text(132, 610, "A Digital", size=199, bounds=(125, 440, 1675, 660))
    c.text(132, 810, "Organism", size=199, bounds=(125, 655, 1675, 860))
    c.text(140, 905, "Foundations, Agency, and Research", size=46, face=SERIF,
           italic=True, color=MUTED, bounds=(125, 845, 1675, 930))

    # T/E is outside Big C; the visual grammar is the homepage's concentric map.
    c.circle(900, 1600, 601, stroke=GOLD, width=2, opacity=.68, dash="3 17")
    c.add('<rect x="636" y="968" width="528" height="65" rx="28" fill="#173127"/>')
    c.text(900, 1013, "T × E · Speculation", size=39, color=GOLD, anchor="middle", bounds=(642, 970, 1158, 1028))
    c.circle(900, 1600, 513, stroke="url(#cover-rim)", fill="url(#cover-organism)", width=3.3)
    c.circle(900, 1600, 502, stroke=JADE, width=1, opacity=.25)
    c.path(arc(900, 1600, 554, -66, 250), color=JADE, width=3.8, opacity=.8,
           dash="13 16", arrow=True)
    for i, angle in enumerate((-158, -126, -88, -50, -11, 26, 64, 102, 140, 178, 216)):
        a = math.radians(angle)
        px, py = 900 + math.cos(a) * 513, 1600 + math.sin(a) * 513
        c.circle(px, py, 4.6 if i % 3 else 6.2, stroke="none", fill=JADE, opacity=.7)
    c.text(900, 1158, "Big C", size=54, anchor="middle", bounds=(725, 1100, 1075, 1177))

    # RF₀ and Little c share Big C; Little c is explicitly outside RF₀.
    c.circle(704, 1578, 226, stroke="#9cb6a6", fill="#102a22", width=2.4)
    c.add('<rect x="478" y="1352" width="452" height="452" fill="url(#cover-grid)" clip-path="url(#cover-frame-clip)"/>')
    c.circle(704, 1578, 222, stroke=LINE, width=1.2)
    c.text(704, 1428, "RF₀", size=48, anchor="middle", bounds=(610, 1370, 800, 1440))
    c.text(704, 1472, "Reality Frame", size=29, color=MUTED, anchor="middle", bounds=(540, 1442, 870, 1490))

    c.circle(1130, 1510, 92, stroke="url(#cover-rim)", fill="url(#cover-local)", width=3)
    c.circle(1130, 1510, 78, stroke=JADE, width=1, opacity=.55)
    c.path(arc(1130, 1510, 113, -42, 270), color=JADE, width=3.5,
           dash="9 12", arrow=True)
    c.text(1130, 1523, "Little c", size=37, anchor="middle", bounds=(1048, 1470, 1212, 1540))
    c.path("M928 1510H1003", arrow=True, color=GOLD, width=3.3)
    c.text(970, 1472, "RS", size=30, color=GOLD, anchor="middle", bounds=(934, 1438, 1006, 1490))
    c.text(1130, 1354, "Reality Stream", size=27, color=GOLD, anchor="middle", bounds=(960, 1310, 1300, 1370))

    c.add('<rect x="1010" y="1740" width="238" height="174" rx="20" fill="#173a2c" stroke="#91c8b1" stroke-width="2.6"/>')
    c.text(1129, 1791, "Canvas", size=35, anchor="middle", bounds=(1024, 1751, 1234, 1802))
    c.path("M1032 1871C1066 1816 1105 1897 1138 1843S1184 1830 1226 1862", color=JADE, width=4.5)
    c.path("M1035 1836C1075 1861 1104 1807 1137 1845S1174 1896 1225 1875", color=CLAY, width=3.5)
    c.path("M1037 1887C1084 1859 1104 1880 1145 1853S1186 1841 1224 1824", color=GOLD, width=2.7)
    c.path("M1130 1642V1720", both=True, width=3)

    # The body is in the Frame. The return path keeps action embodied.
    c.add('<g transform="translate(704 1610) scale(.48)">')
    for path in BODY_PATHS:
        c.path(path, color=INK, width=5)
    c.circle(0, -35, 7, stroke="none", fill=CLAY)
    c.add('</g>')
    c.text(704, 1750, "Avatar", size=34, anchor="middle", bounds=(616, 1710, 792, 1770))
    c.path("M990 1827C894 1870 771 1859 730 1816", arrow=True, width=3)
    c.text(900, 2254, "A PROPOSED ARCHITECTURE OF EXPERIENCE", size=30,
           face=MONO, anchor="middle", color=MUTED, spacing=.5, bounds=(250, 2200, 1550, 2280))

    c.path("M140 2361H1660", color=LINE, width=1.5, opacity=.8)
    c.text(140, 2472, "Henok Ghebrechristos", size=60, bounds=(125, 2395, 1675, 2490))
    c.text(140, 2544, "VERSION 5" + (" · AUTHOR REVIEW" if review else ""),
           size=29, face=MONO, color=JADE, bounds=(125, 2500, 1675, 2570))
    return c.finish()


def render_cover(path: Path = ASSETS / "cover-v5.png", *, review: bool = True):
    """Write a 300 dpi PNG, editable SVG, and 900px-high web cover; return paths.

    Compatible with ``build_book_v5.configure_cover``'s existing PNG interface.
    Text geometry is checked against the intended regions before rasterization.
    """
    from PIL import Image

    path = Path(path).resolve()
    if not (path.is_relative_to(ASSETS) or path.is_relative_to(Path('/tmp'))):
        raise ValueError("Cover output must stay in v5 working assets or /tmp")
    if not path.name.startswith("cover-") or path.suffix.lower() != ".png":
        raise ValueError("The cover output must use a cover-*.png filename")
    path.parent.mkdir(parents=True, exist_ok=True)
    svg = path.with_suffix('.svg')
    svg.write_text(artwork(review), encoding='utf-8')
    with tempfile.TemporaryDirectory(prefix='dot-v5-cover-fonts-') as folder:
        conf = Path(folder) / 'fonts.conf'
        conf.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">'
                        '<fontconfig><include ignore_missing="no">/etc/fonts/fonts.conf</include>'
                        f'<dir>{esc(ROOT / "design/fonts")}</dir><dir>{esc(ROOT / "design/fonts/print")}</dir>'
                        f'<cachedir>{esc(Path(folder) / "cache")}</cachedir></fontconfig>')
        subprocess.run(['/usr/bin/python3', '-c', RASTERIZER, str(svg), str(path),
                        str(WIDTH), str(HEIGHT), '1'], check=True,
                       env={**os.environ, 'FONTCONFIG_FILE': str(conf)})
    with Image.open(path) as source:
        image = source.convert('RGB')
        image.save(path, optimize=True, dpi=(300, 300))
        web = path.with_name(path.stem + '-web.webp')
        image.resize((600, 900), Image.Resampling.LANCZOS).save(web, quality=91, method=6)
    return {'png': path, 'svg': svg, 'web': web, 'width': WIDTH, 'height': HEIGHT,
            'web_width': 600, 'web_height': 900,
            'alt': ALT if review else ALT.replace(', author review.', '.')}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ASSETS / 'cover-v5.png')
    parser.add_argument('--publication-label', action='store_true', help='Omit the author-review label from the artwork only.')
    args = parser.parse_args()
    result = render_cover(args.output, review=not args.publication_label)
    print('\n'.join(f'{key}: {value}' for key, value in result.items()))
