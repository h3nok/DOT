"""Build the shared Version 5 teaching plates (no release files are modified).

Run with the book environment for SVG generation; --render uses the system
Python's librsvg and Pillow bindings and the repository's bundled fonts. The print
masters fit a 4.5-inch text measure. Narrow compositions keep labels readable
at 350 CSS pixels instead of shrinking the print plate.

Serves L1, L7, L8 and L10: still, explicit, accessible explanations. No new
interaction, tracking, or unlabelled claim is introduced.
"""

from __future__ import annotations

import argparse
import html
import json
import os
from pathlib import Path
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "docs/blueprint/book-one-complete/v5-working/assets"

INK = "#18382f"
MUTED = "#536b60"
JADE = "#2f715b"
CLAY = "#a6553b"
GOLD = "#967022"
LINE = "#9bae9f"
SOFT = "#f2f5ef"
PAPER = "#ffffff"
SERIF = "'Source Serif 4 SmText', 'Source Serif 4', Georgia, serif"
SANS = "'Space Grotesk', 'Space Grotesk Light', 'DejaVu Sans', sans-serif"


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


class Plate:
    def __init__(self, ident: str, title: str, alt: str, width: int, height: int):
        self.ident, self.width, self.height = ident, width, height
        self.boxes = []
        self.text_count = 0
        self.parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" role="img" aria-labelledby="{ident}-title {ident}-desc">',
            f'<title id="{ident}-title">{esc(title)}</title>',
            f'<desc id="{ident}-desc">{esc(alt)}</desc>',
            '<defs>',
        ]
        for name, color in [("jade", JADE), ("clay", CLAY), ("muted", MUTED), ("gold", GOLD)]:
            self.parts.append(
                f'<marker id="{ident}-arrow-{name}" markerWidth="8" markerHeight="8" '
                'refX="7" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">'
                f'<path d="M1 1L7 4L1 7" fill="none" stroke="{color}" stroke-width="1.6" '
                'stroke-linecap="round" stroke-linejoin="round"/></marker>'
            )
        self.parts.extend(['</defs>', f'<rect width="{width}" height="{height}" fill="{PAPER}"/>'])

    def add(self, source: str) -> None:
        self.parts.append(source)

    def rect(self, x, y, w, h, *, fill=PAPER, stroke=LINE, radius=14, width=1.8, dash=None):
        self.boxes.append((x, y, x + w, y + h))
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" '
                 f'fill="{fill}" stroke="{stroke}" stroke-width="{width}"'
                 + (f' stroke-dasharray="{dash}"' if dash else "") + '/>')

    def circle(self, x, y, r, *, fill=PAPER, stroke=JADE, width=2, dash=None):
        self.add(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" '
                 f'stroke-width="{width}"' + (f' stroke-dasharray="{dash}"' if dash else "") + '/>')

    def path(self, d, *, color=JADE, width=2, dash=None, opacity=1, arrow=False, both=False):
        name = {JADE: "jade", CLAY: "clay", MUTED: "muted", GOLD: "gold"}.get(color, "muted")
        self.add(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" '
                 f'stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}"'
                 + (f' stroke-dasharray="{dash}"' if dash else "")
                 + (f' marker-end="url(#{self.ident}-arrow-{name})"' if arrow or both else "")
                 + (f' marker-start="url(#{self.ident}-arrow-{name})"' if both else "") + '/>')

    def text(self, x, y, words, *, size=28, color=INK, anchor="start", serif=False, weight=400, leading=1.28, bounds=None):
        lines = words if isinstance(words, (tuple, list)) else [words]
        if bounds is None:
            containing = [b for b in self.boxes if b[0] <= x <= b[2] and b[1] <= y <= b[3]]
            bounds = min(containing, key=lambda b: (b[2] - b[0]) * (b[3] - b[1])) if containing else (0, 0, self.width, self.height)
            bounds = (bounds[0] + 5, bounds[1] + 5, bounds[2] - 5, bounds[3] - 5)
        self.text_count += 1
        self.add(f'<text id="{self.ident}-text-{self.text_count}" data-fit-box="{",".join(str(v) for v in bounds)}" x="{x}" y="{y}" fill="{color}" font-family="{esc(SERIF if serif else SANS)}" '
                 f'font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">')
        for i, line in enumerate(lines):
            self.add(f'<tspan x="{x}" dy="{0 if i == 0 else size * leading}">{esc(line)}</tspan>')
        self.add('</text>')

    def header(self, title, subtitle, claim, *, narrow=False):
        if narrow:
            self.text(22, 34, claim.upper(), size=14, color=JADE)
            self.text(22, 72, title, size=27, serif=True, weight=600)
            self.text(22, 104 if not isinstance(title, list) else 138, subtitle, size=15, color=MUTED)
        else:
            self.text(60, 37, claim.upper(), size=22, color=JADE)
            self.text(60, 91, title, size=44, serif=True, weight=600)
            self.text(60, 132, subtitle, size=27, color=MUTED)

    def finish(self) -> str:
        return "\n".join([*self.parts, '</svg>', ''])


BODY_PATHS = [
    "M-26 -119C-26 -157 26 -157 26 -119C26 -102 18 -90 0 -90C-18 -90 -26 -102 -26 -119Z",
    "M-11 -91V-72M11 -91V-72",
    "M-11 -72C-39 -70 -54 -57 -57 -32L-62 15L-58 54Q-57 63 -49 63Q-41 62 -42 53L-43 17L-36 -29",
    "M11 -72C39 -70 54 -57 57 -32L62 15L58 54Q57 63 49 63Q41 62 42 53L43 17L36 -29",
    "M-36 -31C-34 1 -32 29 -26 60L-29 111L-35 164Q-35 171 -28 171H-15Q-9 171 -9 165L-5 113L0 73L5 113L9 165Q9 171 15 171H28Q35 171 35 164L29 111L26 60C32 29 34 1 36 -31",
]


def body(p: Plate, x, y, scale=1, *, color=INK):
    p.add(f'<g transform="translate({x} {y}) scale({scale})">')
    for d in BODY_PATHS:
        p.path(d, color=color, width=2.5 / scale)
    p.circle(0, -35, 6, fill=CLAY, stroke=CLAY, width=0)
    p.path("M-47 183H47", color=LINE, width=1.5 / scale)
    p.add('</g>')


def marks(p: Plate, x, y, w, h, *, quiet=False):
    """The same accumulated pattern recurs across the plates."""
    p.add(f'<g transform="translate({x} {y}) scale({w / 200} {h / 100})" opacity="{0.3 if quiet else 1}">')
    for d, color, width in [
        ("M12 72C40 8 70 97 103 38S157 12 188 45", JADE, 5),
        ("M16 31C59 54 78 1 113 31S151 92 188 69", CLAY, 4),
        ("M21 90C54 65 69 84 99 65S148 42 185 12", GOLD, 3),
    ]:
        p.path(d, color=color, width=width)
    for cx, cy, col in [(44, 50, JADE), (112, 31, CLAY), (151, 39, GOLD)]:
        p.circle(cx, cy, 5, fill=col, stroke=col, width=0)
    p.add('</g>')


def local(p: Plate, x, y, radius, *, size=28, subtitle=True):
    p.circle(x, y, radius + 8, stroke=JADE, width=1.7, dash="5 8")
    p.circle(x, y, radius, fill=SOFT, stroke=JADE, width=2.2)
    bounds = (x - radius + 5, y - radius + 5, x + radius - 5, y + radius - 5)
    p.text(x, y - (4 if subtitle else -8), "Little c", size=size, anchor="middle", weight=600, bounds=bounds)
    if subtitle:
        p.text(x, y + size * .93, "experiencer", size=max(14, size * .73), anchor="middle", color=MUTED, bounds=bounds)


def canvas(p: Plate, x, y, w, h, *, narrow=False, title=True):
    p.rect(x, y, w, h, fill=SOFT, stroke=JADE, width=2)
    if title:
        p.text(x + 20, y + (32 if narrow else 45), "Canvas", size=23 if narrow else 32, weight=600)
        p.text(x + 20, y + (58 if narrow else 80), "capacity to carry state", size=14 if narrow else 24, color=MUTED)
    inset_y = y + (81 if narrow else 101) if title else y + 15
    hh = h - (110 if narrow else 168) if title else h - 30
    p.rect(x + 18, inset_y, w - 36, max(50, hh), fill=PAPER, stroke=LINE, radius=8, width=1)
    marks(p, x + 27, inset_y + 8, w - 54, max(34, hh - 16))
    if title:
        p.text(x + 20, y + h - (18 if narrow else 43), "Painting · accumulated pattern" if narrow else ["Painting", "accumulated pattern"], size=14 if narrow else 22, color=MUTED, leading=1.15)


META = [
    {
        "id": "avatar-canvas", "title": "An embodied exchange", "claim": "DOT model",
        "section": "the-decoupling-principle",
        "after_text": "The body is described as an avatar: a real, consequential in-Frame interface through which Little c perceives and acts. Its reality and importance are part of the model.",
        "caption": "The Avatar embodies Little c in RF₀. The Canvas carries changing state; its Painting shapes interpretation and response. Little c remains distinct from the body and its carried state. Arrows show proposed functional relationships, not measured spatial connections.",
        "alt": "A living human Avatar exchanges experience and response with the Canvas. The Canvas carries an accumulated Painting. Little c, the local experiencer, remains distinct and is linked to the Canvas by access and update. The same roles are shown without placing consciousness at a measured physical location.",
    },
    {
        "id": "experience-loop", "title": "One moment changes the next", "claim": "Practical model",
        "section": "the-decoupling-principle",
        "after_text": "Figure 1 · The Experience Loop. Follow the arrows from a situated moment through interpretation, choice, action, and consequence. The return changes Canvas state; the next moment is interpreted through that changed Painting.",
        "caption": "Follow one encounter through arrival, interpretation, available responses, Intent, action, consequence, and retained change. The return matters: the next encounter meets a changed Painting. This practical sequence does not establish DOT’s wider ontology.",
        "alt": "Seven connected steps form the Experience Loop: receive a moment; interpret it through the Painting; notice possible responses; form Intent; act through the body; encounter consequence; and carry change forward in Canvas state. A returning arrow brings the changed state into the next moment.",
    },
    {
        "id": "architecture", "title": "The proposed architecture", "claim": "DOT model · origin is Speculation",
        "section": "architecture-of-continuity",
        "after_text": "It is not a recovered history of pre-physical reality.",
        "caption": "T × E (Speculation) names the preexisting conditions for Big C. Within the model, Big C contains RF₀ and Little c. The Avatar embodies Little c in RF₀; Little c remains outside RF₀ and receives its Reality Stream. Boundaries show proposed relationships, not measured locations.",
        "alt": "T × E, labelled Speculation, sits outside Big C and names its preexisting conditions. A large Big C enclosure contains an RF zero enclosure with the living Avatar, plus Little c and a Canvas outside RF zero. A one-way arrow labelled RS, Reality Stream, runs from RF zero to Little c. Little c exchanges access and update with the Canvas. Dashed arrows indicate continuing process. All shapes describe DOT’s proposed relationships, not measured locations.",
    },
    {
        "id": "reality-stream", "title": "RF₀ and the Reality Stream", "claim": "DOT model",
        "section": "reality-frames",
        "after_text": "Little c does not meet an uninterpreted world. The Reality Stream arrives through the body and is encountered through the existing Painting.",
        "caption": "RF₀ is modelled as a shared experience laboratory. The Avatar embodies Little c in the Frame. RF₀ supplies the Reality Stream; the Painting shapes its interpretation. Little c remains within Big C and outside RF₀. The diagram distinguishes roles, not measured spatial locations.",
        "alt": "Inside one Big C boundary, RF zero contains a living Avatar in a shared world. A downward Reality Stream arrow crosses the RF zero boundary and reaches Little c, which remains within Big C and outside RF zero. A connected Canvas carries the Painting used in interpretation. The frame is labelled lawful environment, the stream situated input, and the Painting accumulated interpretation. The diagram represents DOT’s proposed architecture.",
    },
    {
        "id": "little-c-scope", "title": "Little c and local scope", "claim": "DOT model",
        "section": "reality-frames",
        "after_text": "As the Canvas state changes, the operational scope of a person can expand: more of the person and world becomes available to notice, more drafts become visible, and more responses become possible. This is the sense in which awareness expands in Book One. The underlying self-aware process is not assigned a new intrinsic nature; its available field of participation widens.",
        "caption": "Scope is the access and action available to a local perspective. As Canvas state changes, more may become available to notice, consider, and choose. Little c’s intrinsic nature is unchanged. The dashed boundary marks available participation, not physical size, rank, or a measured boundary of consciousness.",
        "alt": "Big C encloses RF zero and a separate local field of participation. RF zero contains the living Avatar and supplies a Reality Stream to Little c outside RF zero. Little c connects to the Canvas within a dashed field labelled local scope. Three lines state what can become more available as carried state changes: noticed distinctions, possible responses, and considered action. The local self-aware process keeps the same nature; scope describes access and participation, not size or rank.",
    },
    {
        "id": "canvas-painting-character", "title": "Three roles in a changing life", "claim": "DOT model",
        "section": "the-canvas",
        "after_text": "The three terms distinguish capacity, organization, and expression. Together they connect a local history to the actions through which it continues and changes.",
        "caption": "The Canvas is the capacity that carries and updates state. The Painting is the accumulated organization of that state. Character expresses patterns through repeated action. Highlighting a different part of the same drawing keeps capacity, content, and expression distinct.",
        "alt": "Three panels repeat one visual motif. The first highlights the Canvas boundary as the capacity that carries state. The second highlights the accumulated strokes inside it as the Painting. The third shows repeated embodied actions as Character. The Canvas is not identical to its Painting, and neither is identical to Little c.",
    },
    {
        "id": "connection-and-identification", "title": "Connection and identification", "claim": "DOT model",
        "section": "the-canvas",
        "after_text": "Practical decoupling means noticing embodiment more accurately, not rejecting it.",
        "caption": "The functional connection is present in both panels. What changes is identification: a reaction may be treated as the whole self, or noticed as something that can be examined before a response. Practical decoupling keeps embodied life and consequence in view.",
        "alt": "Two panels show the same living body connected to the same Canvas and Little c. In the first, the thought is I am this reaction. In the second, it is I notice this reaction. The body remains visible and the arrows stay intact in both; no physical or functional connection is cut.",
    },
    {
        "id": "fear-and-choice", "title": "When the field of choice changes", "claim": "DOT practical model",
        "section": "the-painting",
        "after_text": "That hypothesis has testable implications. Under perceived threat, people should show a narrower range of considered alternatives, stronger preference for familiar control strategies, less tolerance for ambiguity, and reduced willingness to share vulnerability. Variation across persons and contexts should remain meaningful. Increasing credible safety should reduce some of those effects. If it does not, another mechanism may be carrying the institution.",
        "caption": "DOT proposes that governing Fear can narrow which responses become available. A wider field can include curiosity, a boundary, waiting, or protective action. The drawing is a conceptual comparison, not a diagnostic scale or a claim that every imagined option is feasible.",
        "alt": "One encounter leads to two conceptual fields of response. In the narrowed field, defending dominates while asking, waiting, and setting a boundary are less available. In the wider field, asking, a boundary, waiting, and protection can all be considered. No response is scored and protective action remains a legitimate possibility.",
    },
]


def avatar_canvas(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1010 if narrow else 900)
    if narrow:
        p.header(["An embodied", "exchange"], "Sensation, action, carried state", meta['claim'], narrow=True)
        body(p, 175, 286, .56)
        p.text(175, 411, "Avatar · living body", size=20, anchor="middle", weight=600)
        p.path("M110 428V484", arrow=True, width=2)
        p.path("M240 484V428", arrow=True, width=2)
        p.text(105, 460, "Experience", size=14, anchor="end", color=MUTED)
        p.text(245, 460, "Response", size=14, color=MUTED)
        canvas(p, 37, 498, 276, 220, narrow=True)
        p.path("M175 733V783", both=True)
        p.text(192, 751, ["Access", "+ update"], size=14, color=MUTED)
        local(p, 175, 860, 60, size=23)
        p.text(175, 965, ["One encounter changes", "how the next is met."], size=16, anchor="middle", serif=True)
    else:
        p.header(meta['title'], "Sensation, action, and carried state", meta['claim'])
        body(p, 225, 425, .92)
        p.text(225, 639, "Avatar", size=35, anchor="middle", weight=600)
        p.text(225, 677, "living body", size=27, anchor="middle", color=MUTED)
        local(p, 660, 256, 77, size=31)
        p.path("M660 343V378", both=True, width=2.5)
        p.text(690, 355, ["Access", "+ update"], size=22, color=MUTED)
        canvas(p, 510, 392, 300, 247)
        p.path("M300 400C375 345 430 345 499 416", arrow=True, width=2.8)
        p.text(395, 335, "Experience", size=27, anchor="middle", color=MUTED)
        p.path("M500 552C420 612 365 612 300 551", arrow=True, width=2.8)
        p.text(400, 638, "Response", size=27, anchor="middle", color=MUTED)
        p.path("M70 738H830", color=LINE, width=1.4)
        p.text(450, 792, ["One encounter changes carried state.", "Carried state participates in the next encounter."], size=29, anchor="middle", serif=True)
    return p


LOOP = [
    ("Receive a moment", "Reality Stream", "A short reply arrives."),
    ("Interpret it", "Painting", "It sounds dismissive."),
    ("Notice options", "Available responses", "React, ask, wait…"),
    ("Form Intent", "Direction of action", "Choose what to attempt."),
    ("Act in the world", "Living body", "Speak, send, or pause."),
    ("Meet consequence", "Returning experience", "What followed?"),
    ("Carry change", "Canvas state", "What changes next time?"),
]


def experience_loop(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1200 if narrow else 940)
    if narrow:
        p.header(["One moment changes", "the next"], "The Experience Loop", meta['claim'], narrow=True)
        for i, (title, term, example) in enumerate(LOOP):
            y = 180 + i * 135
            p.rect(55, y, 274, 114, fill=SOFT, stroke=JADE if i == 6 else LINE, radius=10)
            p.circle(35, y + 27, 14, fill=JADE, stroke=JADE, width=0)
            p.text(35, y + 33, str(i + 1), size=16, color=PAPER, anchor="middle")
            p.text(71, y + 30, title, size=17, weight=600)
            p.text(71, y + 57, term, size=14, color=JADE)
            p.text(71, y + 90, example, size=15, serif=True)
            if i < 6:
                p.path(f"M192 {y + 118}V{y + 131}", arrow=True, width=1.6)
        p.path("M55 1095H15V207H17", color=JADE, width=1.8, dash="5 5", arrow=True)
        p.text(175, 1171, "Changed state enters the next loop.", size=15, serif=True, anchor="middle")
    else:
        p.header(meta['title'], "The Experience Loop", meta['claim'])
        positions = [(70, 190), (530, 190), (530, 380), (530, 570), (300, 760), (70, 570), (70, 380)]
        for i, ((title, term, example), (x, y)) in enumerate(zip(LOOP, positions)):
            p.rect(x, y, 300, 143, fill=SOFT, stroke=JADE if i == 6 else LINE)
            p.text(x + 20, y + 32, f"{i + 1:02}", size=22, color=JADE)
            p.text(x + 20, y + 70, title, size=27, weight=500)
            p.text(x + 20, y + 100, term, size=22, color=JADE)
            p.text(x + 20, y + 127, example, size=22, serif=True, color=MUTED)
        for d in ["M385 260H512", "M680 346V365", "M680 536V555", "M680 726V742Q680 780 615 804", "M285 804Q220 780 220 742V727", "M220 554V537"]:
            p.path(d, arrow=True, width=2.5)
        p.path("M220 365V347", arrow=True, width=2.5, dash="4 4")
        p.text(450, 477, ["One", "encounter"], size=29, anchor="middle", serif=True, color=MUTED)
    return p


def canvas_painting_character(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1050 if narrow else 900)
    rows = [
        ("Canvas", ["Capacity that carries", "and updates state."], "01"),
        ("Painting", ["The organization", "of that carried state."], "02"),
        ("Character", ["Patterns expressed", "through repeated action."], "03"),
    ]
    if narrow:
        p.header(["Three roles in", "a changing life"], "Capacity · organization · expression", meta['claim'], narrow=True)
        for i, (title, lines, number) in enumerate(rows):
            y = 178 + i * 273
            p.rect(22, y, 306, 245, fill=SOFT, radius=10)
            p.text(40, y + 33, f"{number}  {title}", size=22, weight=600)
            p.text(40, y + 61, lines, size=15, color=MUTED)
            if i < 2:
                p.rect(68, y + 108, 215, 112, fill=PAPER, stroke=JADE if i == 0 else LINE, width=3 if i == 0 else 1.4)
                marks(p, 85, y + 125, 180, 76, quiet=i == 0)
            else:
                for x in [91, 175, 259]:
                    body(p, x, y + 171, .25)
                for x in [125, 209]:
                    p.path(f"M{x} {y + 171}h15", arrow=True, width=1.7)
    else:
        p.header(meta['title'], "Capacity · organization · expression", meta['claim'])
        for i, (title, lines, number) in enumerate(rows):
            y = 181 + i * 228
            p.rect(60, y, 780, 203, fill=SOFT)
            p.text(376, y + 60, f"{number}  {title}", size=35, weight=600)
            p.text(376, y + 110, lines, size=29, color=MUTED, serif=True)
            if i < 2:
                p.rect(91, y + 30, 240, 143, fill=PAPER, stroke=JADE if i == 0 else LINE, width=3.5 if i == 0 else 1.6)
                marks(p, 109, y + 48, 204, 107, quiet=i == 0)
            else:
                for x in [132, 211, 290]:
                    body(p, x, y + 104, .35)
                for x in [161, 240]:
                    p.path(f"M{x} {y + 105}h17", arrow=True, width=2)
    return p


def connection_and_identification(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1130 if narrow else 920)
    if narrow:
        p.header(["Connection and", "identification"], "The connection remains intact.", meta['claim'], narrow=True)
        for i, (label, quote) in enumerate([
            ("Identification dominates", "“I am this reaction.”"),
            ("Identification loosens", "“I notice this reaction.”"),
        ]):
            y = 180 + i * 435
            p.rect(20, y, 310, 405, fill=SOFT, radius=12)
            p.text(37, y + 32, label, size=18, weight=600)
            p.text(37, y + 64, quote, size=18, serif=True, color=CLAY if i == 0 else JADE)
            body(p, 88, y + 206, .38)
            p.text(88, y + 296, "Avatar", size=16, anchor="middle", weight=600)
            local(p, 252, y + 124, 36, size=16, subtitle=False)
            p.path(f"M252 {y + 173}V{y + 195}", both=True, width=1.5)
            p.rect(192, y + 205, 120, 112, fill=PAPER, stroke=JADE)
            p.text(252, y + 229, "Canvas", size=16, anchor="middle", weight=600)
            marks(p, 202, y + 242, 100, 62)
            p.path(f"M123 {y + 216}C150 {y + 196} 161 {y + 196} 184 {y + 216}", arrow=True, width=2)
            p.path(f"M184 {y + 273}C158 {y + 296} 148 {y + 296} 123 {y + 273}", arrow=True, width=2)
            p.text(175, y + 355, "Experience ↔ response", size=15, anchor="middle", color=MUTED)
            p.text(175, y + 382, "Same living connection", size=14, anchor="middle", color=JADE)
        p.text(175, 1098, "Notice the reaction. Examine the response.", size=15, serif=True, anchor="middle")
    else:
        p.header(meta['title'], "The connection remains intact.", meta['claim'])
        for i, (label, quote) in enumerate([
            ("Identification dominates", "“I am this reaction.”"),
            ("Identification loosens", "“I notice this reaction.”"),
        ]):
            y = 174 + i * 345
            p.rect(60, y, 780, 320, fill=SOFT)
            p.text(88, y + 43, label, size=33, weight=600)
            p.text(88, y + 82, quote, size=28, serif=True, color=CLAY if i == 0 else JADE)
            body(p, 210, y + 177, .48)
            p.text(210, y + 300, "Avatar", size=27, anchor="middle", weight=600)
            local(p, 663, y + 75, 54, size=24, subtitle=False)
            p.path(f"M663 {y + 145}V{y + 175}", both=True, width=2)
            p.rect(528, y + 183, 270, 112, fill=PAPER, stroke=JADE)
            p.text(546, y + 219, "Canvas", size=29, weight=600)
            marks(p, 658, y + 203, 120, 75)
            p.path(f"M260 {y + 180}C351 {y + 130} 430 {y + 130} 513 {y + 192}", arrow=True, width=2.8)
            p.path(f"M513 {y + 250}C415 {y + 279} 345 {y + 279} 260 {y + 242}", arrow=True, width=2.8)
            p.text(390, y + 135, "Experience", size=25, anchor="middle", color=MUTED)
            p.text(390, y + 306, "Response", size=25, anchor="middle", color=MUTED)
        p.text(450, 905, "Notice the reaction. Examine the response.", size=27, serif=True, anchor="middle")
    return p


def fear_and_choice(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1080 if narrow else 900)
    if narrow:
        p.header(["When the field", "of choice changes"], "One encounter; different possibilities.", meta['claim'], narrow=True)
        for i, label in enumerate(["Fear governs", "Room for choice"]):
            y = 180 + i * 390
            p.rect(22, y, 306, 355, fill=SOFT)
            p.text(41, y + 38, label, size=20, weight=600)
            p.circle(65, y + 208, 8, fill=CLAY if i == 0 else JADE, stroke="none")
            options = ["Defend", "Ask", "Wait", "Boundary"] if i == 0 else ["Ask", "Boundary", "Wait", "Protect"]
            for j, option in enumerate(options):
                yy = y + 97 + j * 65
                quiet = i == 0 and j > 0
                p.path(f"M77 {y + 208}C112 {y + 208} 115 {yy - 7} 151 {yy - 7}", color=MUTED if quiet else JADE, width=1.5 if quiet else 2.4, dash="3 5" if quiet else None, arrow=True)
                p.text(168, yy, option, size=18, color=MUTED if quiet else INK, weight=400 if quiet else 600)
        p.text(175, 1001, ["A wider field can still include", "protection and a clear no."], size=16, serif=True, anchor="middle")
        p.text(175, 1056, "Conceptual comparison · not a scale", size=14, color=MUTED, anchor="middle")
    else:
        p.header(meta['title'], "One encounter; different possibilities.", meta['claim'])
        p.rect(296, 177, 308, 77, fill=SOFT, stroke=LINE, radius=38)
        p.text(450, 226, "An encounter", size=31, serif=True, anchor="middle")
        p.path("M395 267L255 318", arrow=True, width=2)
        p.path("M505 267L645 318", arrow=True, width=2)
        for i, x in enumerate([60, 490]):
            p.rect(x, 335, 350, 430, fill=SOFT)
            p.text(x + 23, 382, "Fear governs" if i == 0 else "Room for choice", size=31, weight=600)
            p.circle(x + 48, 560, 10, fill=CLAY if i == 0 else JADE, stroke="none")
            options = ["Defend", "Ask", "Wait", "Boundary"] if i == 0 else ["Ask", "Boundary", "Wait", "Protect"]
            for j, option in enumerate(options):
                yy = 450 + j * 82
                quiet = i == 0 and j > 0
                p.path(f"M{x + 64} 560C{x + 105} 560 {x + 115} {yy - 8} {x + 153} {yy - 8}", color=MUTED if quiet else JADE, width=2 if quiet else 3.5, dash="5 7" if quiet else None, arrow=True)
                p.text(x + 172, yy, option, size=28, color=MUTED if quiet else INK, weight=400 if quiet else 600)
        p.text(450, 826, "A wider field can still include protection and a clear no.", size=27, serif=True, anchor="middle")
        p.text(450, 872, "Conceptual comparison · not a scale", size=22, color=MUTED, anchor="middle")
    return p


def architecture(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1220 if narrow else 940)
    if narrow:
        p.header(["The proposed", "architecture"], "Relationships, not physical locations.", "DOT model", narrow=True)
        p.rect(22, 177, 306, 194, fill=SOFT, stroke=GOLD, dash="6 6")
        p.text(42, 212, "T × E · Speculation", size=22, color=GOLD, weight=600)
        p.text(42, 248, "T · primordial continuity—Time", size=15)
        p.text(42, 280, ["E · raw information source", "the stuff itself; unformed possibility"], size=15)
        p.text(42, 341, "Preexisting conditions outside Big C", size=14, color=MUTED)
        p.path("M175 383V418", color=GOLD, arrow=True, width=2.2)
        p.text(192, 404, "Emergence", size=14, color=MUTED)
        p.rect(15, 431, 320, 737, fill=PAPER, stroke=JADE, width=2.5, radius=26)
        p.text(38, 472, "Big C", size=30, weight=600)
        p.text(38, 501, "Living conscious process", size=16, color=MUTED)
        p.path("M277 456C304 456 311 483 289 493", dash="4 6", arrow=True)
        p.path("M281 494C257 494 251 465 271 457", dash="4 6", arrow=True)
        p.rect(38, 526, 274, 224, fill=SOFT, stroke=JADE, width=1.7)
        p.text(58, 566, "RF₀", size=28, weight=600)
        p.text(58, 596, ["Our physical", "universe"], size=17)
        body(p, 245, 639, .31)
        p.text(58, 707, ["Avatar", "living body"], size=16)
        p.path("M175 762V839", arrow=True, width=2.4)
        p.text(192, 793, ["RS", "Reality Stream"], size=15, color=JADE, weight=500)
        local(p, 175, 908, 55, size=23)
        p.path("M175 973V997", both=True, width=1.8)
        p.rect(65, 1009, 220, 108, fill=SOFT, stroke=JADE)
        p.text(85, 1040, "Canvas", size=23, weight=600)
        p.text(85, 1066, "Capacity to carry state", size=14, color=MUTED)
        marks(p, 86, 1075, 177, 29)
        p.text(175, 1147, "RF₀ and Little c are within Big C.", size=15, anchor="middle")
        p.text(175, 1200, "Little c is outside RF₀.", size=15, anchor="middle", color=MUTED)
    else:
        p.header(meta['title'], "Relationships, not physical locations.", "DOT model")
        p.rect(60, 174, 780, 142, fill=SOFT, stroke=GOLD, width=2, dash="8 8")
        p.text(86, 213, "T × E · Speculation", size=32, color=GOLD, weight=600)
        p.text(86, 256, ["T · primordial continuity", "Time; continuity of change"], size=23, bounds=(80, 230, 455, 306))
        p.text(490, 249, ["E · raw information source", "The stuff itself;", "unformed possibility"], size=23, leading=1.15, bounds=(484, 225, 824, 309))
        p.path("M450 326V354", color=GOLD, arrow=True, width=2.5)
        p.text(476, 347, "Preexisting conditions for Big C", size=22, color=MUTED)
        p.rect(60, 368, 780, 526, fill=PAPER, stroke=JADE, width=3, radius=35)
        p.text(89, 423, "Big C", size=44, weight=600)
        p.text(265, 412, ["Living conscious process", "Retains state · recognizes patterns"], size=25, color=MUTED, leading=1.25)
        p.path("M775 397C811 401 815 437 785 449", dash="6 8", arrow=True, width=2.2)
        p.path("M778 449C746 444 745 409 768 399", dash="6 8", arrow=True, width=2.2)
        p.rect(90, 490, 300, 354, fill=SOFT, stroke=JADE, width=2)
        p.text(116, 541, "RF₀", size=42, weight=600)
        p.text(116, 580, "Our physical universe", size=24)
        body(p, 240, 686, .33)
        p.text(240, 794, ["Avatar", "living body"], size=23, anchor="middle", leading=1.15)
        p.text(650, 531, "Local self-awareness", size=24, anchor="middle")
        local(p, 650, 623, 74, size=31)
        p.path("M405 623H569", arrow=True, width=2.8)
        p.text(487, 586, "RS", size=26, anchor="middle", color=JADE, weight=600)
        p.text(487, 660, ["Reality", "Stream"], size=23, anchor="middle", color=MUTED)
        p.path("M650 704V737", both=True, width=2.1)
        p.rect(500, 751, 300, 93, fill=SOFT, stroke=JADE, width=2)
        p.text(521, 789, "Canvas", size=29, weight=600)
        p.text(521, 822, "Carried state", size=22, color=MUTED)
        marks(p, 695, 768, 83, 54)
        p.text(450, 929, "RF₀ and Little c are within Big C. Little c is outside RF₀.", size=24, serif=True, anchor="middle")
    return p


def reality_stream(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1120 if narrow else 940)
    if narrow:
        p.header(["RF₀ and the", "Reality Stream"], "World, input, interpretation.", meta['claim'], narrow=True)
        p.rect(15, 175, 320, 886, fill=PAPER, stroke=JADE, width=2.5, radius=26)
        p.text(37, 215, "Big C", size=28, weight=600)
        p.text(37, 242, "The encompassing conscious process", size=14, color=MUTED)
        p.rect(38, 270, 274, 271, fill=SOFT, stroke=JADE, width=1.8)
        p.text(58, 311, "RF₀ · physical universe", size=21, weight=600)
        p.text(58, 339, "Shared lawful environment", size=15, color=MUTED)
        p.path("M58 467H291M58 444H291M90 415V485M259 415V485", color=LINE, width=1)
        body(p, 175, 419, .32)
        p.text(175, 518, "Avatar · living body", size=17, anchor="middle")
        p.path("M175 553V639", arrow=True, width=2.5)
        p.text(194, 581, ["RS", "Reality Stream", "Situated input"], size=14, color=JADE, leading=1.2)
        local(p, 175, 706, 54, size=22)
        p.path("M175 770V802", both=True, width=1.9)
        p.rect(45, 817, 260, 199, fill=SOFT, stroke=JADE, width=1.8)
        p.text(65, 852, "Canvas", size=23, weight=600)
        p.text(65, 880, "Carries and updates state", size=15, color=MUTED)
        marks(p, 76, 898, 200, 62)
        p.text(175, 991, "Painting · interpretation", size=16, anchor="middle")
        p.text(175, 1040, "Little c remains outside RF₀.", size=14, anchor="middle")
        p.text(175, 1094, "Proposed roles, not physical locations.", size=14, anchor="middle", color=MUTED)
    else:
        p.header(meta['title'], "World, input, interpretation.", meta['claim'])
        p.rect(60, 178, 780, 700, fill=PAPER, stroke=JADE, width=3, radius=35)
        p.text(88, 229, "Big C", size=41, weight=600)
        p.text(253, 224, "The encompassing conscious process", size=25, color=MUTED)
        p.rect(90, 266, 720, 239, fill=SOFT, stroke=JADE, width=2)
        p.text(119, 316, "RF₀ · our physical universe", size=34, weight=600)
        p.text(119, 357, "Shared lawful environment", size=26, color=MUTED)
        p.text(119, 427, ["World and bodily conditions", "constrain what arrives."], size=25)
        p.path("M604 450H784M615 423H773M626 385V462M762 385V462", color=LINE, width=1.3)
        body(p, 695, 395, .29)
        p.text(695, 485, "Avatar", size=23, anchor="middle")
        p.path("M276 520V640", arrow=True, width=2.8)
        p.text(304, 556, ["RS · Reality Stream", "Situated input"], size=25, color=JADE, leading=1.35)
        local(p, 276, 725, 74, size=31)
        p.path("M357 725H461", both=True, width=2.3)
        p.text(410, 683, ["Access", "+ update"], size=22, anchor="middle", color=MUTED, leading=1.15)
        p.rect(479, 635, 301, 202, fill=SOFT, stroke=JADE, width=2)
        p.text(502, 677, "Canvas", size=32, weight=600)
        p.text(502, 712, "Carries + updates state", size=22, color=MUTED)
        marks(p, 532, 730, 203, 54)
        p.text(630, 817, "Painting · interpretation", size=23, anchor="middle")
        p.text(276, 835, "Outside RF₀; within Big C", size=23, anchor="middle")
        p.text(450, 925, "The Stream is situated input. The Frame is the wider world.", size=25, serif=True, anchor="middle")
    return p


def little_c_scope(meta, narrow=False):
    p = Plate(meta['id'], meta['title'], meta['alt'], 350 if narrow else 900, 1240 if narrow else 940)
    if narrow:
        p.header(["Little c and", "local scope"], "What becomes available to notice and do.", meta['claim'], narrow=True)
        p.rect(15, 175, 320, 1007, fill=PAPER, stroke=JADE, width=2.5, radius=26)
        p.text(37, 215, "Big C", size=28, weight=600)
        p.text(37, 242, "The encompassing conscious process", size=14, color=MUTED)
        p.rect(38, 270, 274, 182, fill=SOFT, stroke=JADE, width=1.7)
        p.text(58, 311, "RF₀", size=27, weight=600)
        p.text(58, 343, ["Physical universe", "Avatar · living body"], size=16)
        body(p, 259, 379, .22)
        p.path("M175 464V580", arrow=True, width=2.2)
        p.text(196, 500, ["RS", "Reality Stream"], size=14, color=JADE)
        p.rect(38, 554, 274, 592, fill="none", stroke=GOLD, width=1.8, dash="6 7", radius=21)
        local(p, 175, 646, 55, size=23)
        p.path("M175 711V741", both=True, width=1.8)
        p.rect(65, 756, 220, 138, fill=SOFT, stroke=JADE, width=1.7)
        p.text(85, 790, "Canvas", size=23, weight=600)
        p.text(85, 816, "Carried history changes", size=14, color=MUTED)
        marks(p, 85, 830, 180, 48)
        p.text(175, 935, "LOCAL SCOPE", size=16, anchor="middle", color=GOLD, weight=600)
        p.text(175, 966, "More may become available:", size=15, anchor="middle")
        p.text(65, 1004, ["Noticed distinctions", "Possible responses", "Considered action"], size=18, leading=1.8)
        p.text(175, 1122, "Access and participation", size=15, anchor="middle", color=MUTED)
        p.text(175, 1168, "Little c stays outside RF₀.", size=14, anchor="middle")
        p.text(175, 1216, "Same nature of self-awareness.", size=15, anchor="middle", color=MUTED)
    else:
        p.header(meta['title'], "What becomes available to notice and do.", meta['claim'])
        p.rect(60, 178, 780, 700, fill=PAPER, stroke=JADE, width=3, radius=35)
        p.text(88, 229, "Big C", size=41, weight=600)
        p.text(253, 224, "The encompassing conscious process", size=25, color=MUTED)
        p.rect(90, 266, 720, 168, fill=SOFT, stroke=JADE, width=2)
        p.text(119, 316, "RF₀ · physical universe", size=34, weight=600)
        p.text(119, 361, "World and body shape the input.", size=26, color=MUTED)
        body(p, 711, 350, .26)
        p.text(119, 406, "Avatar · the living body in the Frame", size=24)
        p.path("M240 449V544", arrow=True, width=2.6)
        p.text(270, 484, "RS · Reality Stream", size=24, color=JADE)
        p.rect(90, 520, 720, 325, fill="none", stroke=GOLD, width=2, dash="8 9", radius=24)
        local(p, 240, 620, 72, size=31)
        p.path("M313 620H371", both=True, width=2.1)
        p.rect(388, 562, 209, 142, fill=SOFT, stroke=JADE, width=2)
        p.text(408, 601, "Canvas", size=29, weight=600)
        p.text(408, 634, "Carried history", size=22, color=MUTED)
        marks(p, 409, 648, 168, 40)
        p.text(630, 584, ["LOCAL", "SCOPE"], size=25, color=GOLD, weight=600, leading=1.2)
        p.text(630, 662, ["Access and", "participation"], size=22, color=MUTED)
        p.text(119, 751, "As carried state changes, more may become available:", size=25)
        p.text(119, 804, "Notice distinctions · consider responses · choose action", size=25)
        p.text(450, 925, "A wider field of participation; the same nature of self-awareness.", size=24, serif=True, anchor="middle")
    return p


BUILDERS = {
    "avatar-canvas": avatar_canvas,
    "experience-loop": experience_loop,
    "architecture": architecture,
    "reality-stream": reality_stream,
    "little-c-scope": little_c_scope,
    "canvas-painting-character": canvas_painting_character,
    "connection-and-identification": connection_and_identification,
    "fear-and-choice": fear_and_choice,
}


RASTERIZER = r'''
import sys, gi
from xml.etree import ElementTree as ET
from PIL import Image
gi.require_version("Rsvg", "2.0")
from gi.repository import Rsvg
source, target, width, height, scale = sys.argv[1:]
width, height, scale = float(width), float(height), float(scale)
ET.register_namespace('', 'http://www.w3.org/2000/svg')
root = ET.parse(source).getroot()
handle = Rsvg.Handle.new_from_data(ET.tostring(root))
viewport = Rsvg.Rectangle()
viewport.x = viewport.y = 0
viewport.width, viewport.height = width, height
errors, measured = [], []
for node in root.findall('{http://www.w3.org/2000/svg}text'):
    ok, ink, logical = handle.get_geometry_for_layer('#' + node.attrib['id'], viewport)
    x1, y1, x2, y2 = map(float, node.attrib['data-fit-box'].split(','))
    label = ' / '.join(''.join(t.itertext()) for t in node)
    if not ok or ink.x < x1 - .5 or ink.y < y1 - .5 or ink.x + ink.width > x2 + .5 or ink.y + ink.height > y2 + .5:
        errors.append(f'{label}: ink ({ink.x:.1f}, {ink.y:.1f}, {ink.x+ink.width:.1f}, {ink.y+ink.height:.1f}) outside {(x1,y1,x2,y2)}')
    for prior, box in measured:
        if min(ink.x+ink.width, box.x+box.width)-max(ink.x,box.x) > 1 and min(ink.y+ink.height,box.y+box.height)-max(ink.y,box.y) > 1:
            errors.append(f'text overlap: {label} / {prior}')
    measured.append((label, ink))
if errors:
    raise ValueError(source + '\n' + '\n'.join(errors))
root.set('width', str(int(width * scale)))
root.set('height', str(int(height * scale)))
handle = Rsvg.Handle.new_from_data(ET.tostring(root))
pixbuf = handle.get_pixbuf()
mode = 'RGBA' if pixbuf.get_has_alpha() else 'RGB'
image = Image.frombytes(mode, (pixbuf.get_width(), pixbuf.get_height()),
                        pixbuf.get_pixels(), 'raw', mode, pixbuf.get_rowstride(), 1)
image.save(target)
'''


def build(output: Path, render: bool):
    output.mkdir(parents=True, exist_ok=True)
    figures = []
    for number, item in enumerate(META, 1):
        build_plate = BUILDERS[item['id']]
        master = build_plate(item)
        mobile = build_plate(item, narrow=True)
        base = item['id']
        print_svg, web_svg, mobile_svg = f"{base}-print.svg", f"{base}.svg", f"{base}-narrow.svg"
        source = master.finish()
        (output / print_svg).write_text(source)
        (output / web_svg).write_text(source.replace(f'fill="{PAPER}"', 'fill="#fbfcf8"', 1))
        (output / mobile_svg).write_text(mobile.finish())
        figures.append({**item, "number": number, "print_svg": print_svg, "web_svg": web_svg,
                        "mobile_svg": mobile_svg, "print_png": f"{base}-print.png",
                        "width": master.width, "height": master.height,
                        "mobile_width": mobile.width, "mobile_height": mobile.height})
    (output / 'figures.json').write_text(json.dumps(figures, ensure_ascii=False, indent=2) + '\n')
    if render:
        with tempfile.TemporaryDirectory(prefix='dot-v5-figure-fonts-') as folder:
            conf = Path(folder) / 'fonts.conf'
            conf.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">'
                            '<fontconfig><include ignore_missing="no">/etc/fonts/fonts.conf</include>'
                            f'<dir>{esc(ROOT / "design/fonts")}</dir><dir>{esc(ROOT / "design/fonts/print")}</dir>'
                            f'<cachedir>{esc(Path(folder) / "cache")}</cachedir></fontconfig>')
            env = {**os.environ, 'FONTCONFIG_FILE': str(conf)}
            for item in figures:
                for source, target, w, h, scale in [
                    (item['print_svg'], item['print_png'], item['width'], item['height'], 2),
                    (item['mobile_svg'], item['id'] + '-narrow.png', item['mobile_width'], item['mobile_height'], 1),
                ]:
                    subprocess.run(['/usr/bin/python3', '-c', RASTERIZER, str(output / source), str(output / target),
                                    str(w), str(h), str(scale)], check=True, env=env)
    return figures


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--render', action='store_true', help='Render 400dpi print PNGs and exact-width phone previews.')
    args = parser.parse_args()
    result = build(args.output, args.render)
    print(f'Built {len(result)} Version 5 teaching figures in {args.output}')
