"""Build frontend/src/content/amm-model.json from the published AMM chapters.

Every sentence is copied from the published chapter text, so the model cannot
drift from the book. Run from the repository's frontend/ directory.
"""
import json
import re
import sys

ESSAYS = "src/content/essays"
CHAPTERS = {
    1: ("Chapter One", "amm-book-chapter-one-the-leech"),
    2: ("Chapter Two", "amm-book-chapter-two-the-anatomy-of-dominance"),
    3: ("Chapter Three", "amm-book-chapter-three-the-host-and-the-infection"),
    4: ("Chapter Four", "amm-book-chapter-four-authorship-without-dominance"),
}
PREFACE = "public/publications/henok/digital-organism-theory/v5/sections/preface.md"


def plain(text):
    text = re.sub(r"\[\^[^\]]+\]", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[*_`]", "", text).replace("\\$", "$")
    return re.sub(r"\s+", " ", text).strip()


def paragraphs(path):
    section, out = "(opening)", []
    for line in open(path, encoding="utf-8").read().split("\n"):
        heading = re.match(r"^#{2,3} (.+)", line)
        if heading:
            section = heading.group(1).strip()
        elif line.strip() and not re.fullmatch(r"-{3,}", line.strip()):
            out.append((section, line, plain(line)))
    return out


DOCS = {n: paragraphs(f"{ESSAYS}/{slug}.md") for n, (_, slug) in CHAPTERS.items()}
for n, (_, slug) in CHAPTERS.items():
    head = open(f"{ESSAYS}/{slug}.md", encoding="utf-8").read().split("---")[1]
    CHAPTERS[n] = CHAPTERS[n] + (re.search(r'title: "(.+)"', head).group(1), re.search(r'published: "(.+)"', head).group(1))


def marked(item, mark):
    """The key phrase a reader's eye should find first. It must be the sentence's own words."""
    if mark:
        if mark not in item["text"]:
            sys.exit(f"Mark not in its sentence: {mark}")
        item["mark"] = mark
    return item


def q(chapter, text, fragment=None, mark=None):
    # A figure's published caption counts too (its Markdown title), as in Chapter Four's Figure 5.
    hits = [section for section, raw, para in DOCS[chapter] if text in para or (raw.lstrip().startswith("![") and text in raw)]
    if not hits:
        sys.exit(f"Not in Chapter {chapter}: {text}")
    item = {"text": text, "chapter": chapter, "section": hits[0]}
    if fragment:
        item["fragment"] = fragment
    return marked(item, mark)


def section_paragraphs(chapter, section):
    return [para for sec, _, para in DOCS[chapter] if sec == section]


# Other published sources the model quotes: Book One (v5), the earlier serialized Chapter Two, and the letter.
DOT_SECTIONS = "public/publications/henok/digital-organism-theory/v5/sections"
OTHER = {
    "dot": {"label": "Book One", "route": "/book/digital-organism-theory", "files": ["the-digital-organism", "the-painting", "the-canvas", "preface"]},
    "amm-2-earlier": {"label": "Chapter Two, earlier edition", "route": "/essays/amm-chapter-two-the-leechs-anatomy", "path": f"{ESSAYS}/amm-chapter-two-the-leechs-anatomy.md"},
    "amm-3-earlier": {"label": "Chapter Three, earlier edition", "route": "/essays/amm-chapter-three-the-host-and-the-infection", "path": f"{ESSAYS}/amm-chapter-three-the-host-and-the-infection.md"},
    "letter": {"label": "A Letter to an American Adult", "route": "/essays/amm-letter-to-an-american-adult", "path": f"{ESSAYS}/amm-letter-to-an-american-adult.md"},
}
OTHER_DOCS = {}
for doc, info in OTHER.items():
    paths = [(f, f"{DOT_SECTIONS}/{f}.md") for f in info["files"]] if info.get("files") else [(None, info["path"])]
    OTHER_DOCS[doc] = [(f, sec, para) for f, path in paths for sec, _, para in paragraphs(path)]


def oq(doc, text, mark=None):
    hits = [(f, sec) for f, sec, para in OTHER_DOCS[doc] if text in para]
    if not hits:
        sys.exit(f"Not in {doc}: {text}")
    item = {"text": text, "doc": doc, "section": hits[0][1]}
    if hits[0][0]:
        item["file"] = hits[0][0]
    return marked(item, mark)


E2 = "amm-2-earlier"
E3 = "amm-3-earlier"


model = {
    "$comment": "The AMM model, written once. Every sentence is copied from the published chapters; AmmModel.test.ts fails if one drifts. Regenerate rather than edit by hand.",
    "edition": {"label": "Working book, version 1.1", "published": CHAPTERS[1][3]},
    "chapters": [{"n": n, "label": label, "slug": slug, "title": title} for n, (label, slug, title, _) in CHAPTERS.items()],
}

# Book One's four levels of claim, from the released preface.
preface = paragraphs(PREFACE)
levels = []
for rank, (level_id, label) in enumerate([("observation", "Observation"), ("external-model", "External model"), ("dot-derivation", "DOT derivation"), ("speculative-extension", "Speculative extension")], start=1):
    para = next(p for s, _, p in preface if s == "Four Levels of Claim" and p.startswith(f"{label} names"))
    levels.append({"id": level_id, "label": label, "rank": rank, "definition": para})
model["levels"] = {"source": {"label": "Book One · Four Levels of Claim", "href": "/book/digital-organism-theory/preface#four-levels-of-claim"}, "items": levels}

model["argument"] = [q(1, p) for p in section_paragraphs(1, "What Kind of Argument This Is")]

# The parts of the model and where each sits. Names in quotation marks are the author's
# own labels from 2026-11-16; summaries are his published sentences.
model["parts"] = [
    {"id": "described", "name": "The country described", "place": "above", "members": ["Idealism", "Division"], "summary": q(3, "The culture shows a different image than it lives.")},
    {"id": "inversion", "name": "The Inversion", "place": "line", "summary": q(3, "The Inversion: professing virtue, and practicing the exact opposite.")},
    {"id": "citizen", "name": "The citizen", "place": "on", "summary": q(3, "The citizen lives and feels the contradiction without knowing it.")},
    {"id": "leech", "name": "The Leech", "place": "below", "members": ["Civilizational inheritance", "Domination as human value", "Dehumanization", "Racial hierarchy"], "summary": q(3, "The culture is dominance-based, and people think it is normal.")},
    {"id": "authorship", "name": "Authorship", "place": "outside", "summary": q(3, "One is your nature and the other is somebody's business model.")},
]

model["scenes"] = {
    "model": {"heading": q(3, "We live in two countries at once: the one described, and the one lived in.")},
    "idealism": {"heading": q(3, "Look at what the culture says it is. Then look at what it does."),
                 "lines": [q(3, "A civilization cannot establish its moral standing by reciting values its institutions are permitted to violate."), q(3, "That is our condition: no solid moral foundation.", mark="no solid moral foundation")]},
    "division": {"heading": q(3, "A cultural bubble is a field of mutually reinforcing interpretations."),
                 "lines": [q(3, "our harm is always justified, their harm always reveals their nature; our members deserve explanation, theirs deserve suspicion.", "start"), q(3, "A standard advertised as universal becomes conditional upon loyalty.", mark="conditional upon loyalty")]},
    "inversion": {"heading": q(3, "The Inversion: professing virtue, and practicing the exact opposite."),
                  "lines": [q(3, "We claim many values we do not practice. What we practice is who we are."), q(3, "None of these is a lapse. Obsequiousness and dishonesty are the values we practice.")]},
    # Chapter One §1 restored to the author's 9 October text (2026-11-23): the Leech is a behavior, spotted by the gap.
    "leech": {"heading": q(1, "You spot the Leech by looking for the gap between what is said and what is done."),
              "lines": [q(3, "It gives you your place, and expects you to keep it.", mark="expects you to keep it"), q(1, "Anyone can serve it. Anyone can resist it.")]},
    "terms": {"lines": [q(1, "A person does not have to invent an attitude that their surroundings already reward.")]},
    "citizen": {"heading": q(3, "Not the state, but the citizen trained to do it."),
                "lines": [q(3, "You inherited a mind that was already occupied.", mark="already occupied"), q(3, "The Leech is protected by the Host itself.")]},
    "erosion": {"heading": q(3, "You are pressed to choose: be crushed, or be compromised."),
                "term": "moral-erosion",
                "lines": [q(3, "Moral erosion is therefore more than a single failure to act. It is a growing permission to treat the failure as reasonable, and to demand the same accommodation from others."), q(3, "You start asking whether a thought is permissible before whether it is sound.")]},
    "nature": {"heading": q(3, "One is your nature and the other is somebody's business model."),
               "lines": [q(3, "Obsequiousness and dishonesty are not human nature. They belong to the infection, not to the person, and neither infection nor erosion places anyone beyond recovery."), q(3, "That is not your fault, but it is now your responsibility.", mark="it is now your responsibility")]},
    "inquire": {"heading": q(1, "A serious school of thought must permit its own claims to be corrected.")},
}

# The AMM home: five screens, chosen with the author on 2026-11-17. Plain sentences first;
# the three pairs are honesty, free speech, and worth.
model["home"] = {
    # The AMM thesis the home opens on (the author, 2026-11-20; set as a manifesto on 2026-11-22).
    # Its conviction is AMM's own, first stated as the conviction that "comes before any economic
    # argument" and kept in the working book's Chapter Four. The articles are the author's (amm.json
    # model.thesis*); the earlier Chapter One's "A society must be judged…" was removed at his request.
    "thesis": {"worth": q(4, "You were born valuable before you produced anything.")},
    # The home closes on the way out: the author's "Stability is maintained through continuous exchange
    # and correction." (2026-11-22, replacing "Only a cultural revolution is our way out": "no ultimatums.
    # A pragmatic, scientific model based statement"), then his position that personal healing comes
    # first (amm.json model.revolutionPosition), then Chapter Four's line on the Host's freedom. It
    # replaced "The task is to revise the terms…", which the author found unclear.
    "revolution": {"lines": [q(4, "The Host's freedom represents people taking their own mental health and agency seriously.", mark="taking their own mental health and agency seriously")]},
    # The model beneath the opening, set with the author on 2026-11-19: the Inversion, then the Host
    # ("us, the public") and the Leech (a dominance ideology whose body today is the oligarchy, and
    # whatever it is attached to). The oligarchy's composition is in the earlier serialized editions;
    # the working book narrows the Leech to the attitude alone, so those lines cite the earlier editions.
    # The letter's line on universality answers the author's "a universal society, only in our heads".
    "inversion": {"heading": q(3, "The Inversion: professing virtue, and practicing the exact opposite."), "lines": [q(3, "We claim many values we do not practice. What we practice is who we are.", mark="What we practice is who we are."), oq("letter", "You learn that human dignity can be called universal while protection remains conditional.", mark="called universal")]},
    "host": {"lines": [q(3, "The Host is the living public and the conditions of shared life through which people develop, act, care, and carry a future forward.", mark="the living public"), oq(E2, "The host is the public, supplying labor, taxes, savings, purchases, debt, land, water, electricity, attention, data, and legitimacy.")]},
    # The Leech in the author's own words (9 October, restored to Chapter One §1 on 2026-11-23): a behavior, spotted by the gap.
    "leech": {"lines": [q(1, "You spot the Leech by looking for the gap between what is said and what is done.", mark="the gap between what is said and what is done"), q(1, "It speaks the language of love while practicing the craft of extraction.")]},
    "anatomy": {"lines": [oq(E3, "The Leech has a composition. In AMM, its two strategic centers are the Security-Industrial Oligarchy and the Technological-Platform Oligarchy."), oq(E3, "Government is a principal attachment point because it makes and enforces laws, awards contracts, supplies funding, and protects claims.", mark="Government is a principal attachment point")],
                "note": oq(E3, "These names identify concentrations of power examined in Chapter 2. They do not make every worker within those industries equally responsible for their decisions.")},
    "feeding": {"lines": [oq(E2, "The Leech attaches to an interface, converts dependence into recurring revenue, and uses concentrated power to make the interface harder to leave.", mark="converts dependence into recurring revenue"), oq(E2, "The public is told there is no alternative. That sentence marks the feeding point.", mark="the feeding point")]},
    # "A standard advertised as universal…" qualifies the claims (worth for every person), so it
    # follows them here rather than closing the screen about what a person calls normal.
    "gap": {"heading": q(3, "Look at what the culture says it is. Then look at what it does."), "pairs": [0, 1, 5], "lines": [q(3, "A standard advertised as universal becomes conditional upon loyalty.", mark="conditional upon loyalty"), q(3, "What we practice is who we are.", mark="who we are")]},
    "why": {"heading": q(1, "You spot the Leech by looking for the gap between what is said and what is done."), "lines": [q(3, "It gives you your place, and expects you to keep it.", mark="expects you to keep it")]},
    # Not "Not the state, but the citizen trained to do it.": that line completes its section title
    # ("The Citizen Enforces") and reads as a fragment on its own (the author, 2026-11-17).
    # The takeaway the author set on 2026-11-17: the citizen is in a spiral of erosion, damaged
    # over time, and feels it as a contradiction. Chapter Three says it in these words.
    # Titled with the author's poster ("The Slow Erosion of the Public"); its two sentences carry
    # time (the next generation) and the damage (what a person can acknowledge, and will impose).
    "spiral": {
        "lines": [
            q(3, "A rule once imposed from outside becomes a standard you carry into the next meeting, the next relationship, and the next generation.", mark="the next generation"),
            q(3, "Repetition changes what the person can comfortably acknowledge and what they are prepared to impose.", mark="what they are prepared to impose"),
        ],
        "carrier": [q(3, "Agree now. Fix it later."), q(3, "It's not my place."), q(3, "I have a family.")],
        "enforcer": [q(3, "I paid my dues. So will they."), q(3, "Know your place.")],
        "inversion": q(3, "That's just human nature."),
    },
    "feeling": {
        "heading": q(3, "The dissatisfaction is real."),
        "lines": [
            # The chapter's order: the conformity, the choice it presses, then the feeling it leaves,
            # which the way out answers next.
            q(3, "We see enough to grow cynical, and still most of us conform.", mark="still most of us conform"),
            q(3, "You are pressed to choose: be crushed, or be compromised."),
            q(3, "Seeing the contradiction clearly can leave a person lonely, angry, and unsure where to go.", mark="lonely, angry, and unsure where to go"),
        ],
    },
    # The warning the author asked for on 2026-11-17: the person's cognitive, mental and moral
    # health are under attack, now through the screen. Three screens, each in published words.
    # Cognitive health: the letter's own description of the fragments and what they cost.
    "attention": {
        "heading": oq("letter", "You should be able to carry a thought across years."),
        "lines": [
            oq("letter", "But you are trained to live from interruption to interruption.", mark="from interruption to interruption"),
            oq("letter", "That is not a small inconvenience. That is part of the damage being done to you.", mark="part of the damage being done to you"),
        ],
        "jammed": oq("letter", "Your attention has been jammed with notifications, feeds, headlines, outrage, DMs, meetings, insecurities, and endless fragments competing for the next few seconds of your mind."),
    },
    # Mental health: what a platform studies, what it leaves, and who keeps the revenue.
    "mind": {
        "heading": oq(E2, "A platform can study what frightens you, what angers you, what interrupts judgment, and what returns you to the screen."),
        "lines": [oq(E2, "The consequences arise as distraction, agitation, compulsive comparison, or the persistent sense that reality is collapsing faster than it can be understood.", mark="reality is collapsing faster than it can be understood")],
        "suffering": oq(E2, "The suffering feels intimate."),
        "revenue": oq(E2, "The revenue remains institutional."),
        "still": [oq(E2, "An anxious person still scrolls."), oq(E2, "An isolated person still generates data."), oq(E2, "An exhausted household still pays subscriptions."), oq(E2, "A frightened public remains commercially valuable.")],
    },
    # Moral health: harm renamed as virtue, inherited, and passed to the next person.
    "us": {
        "heading": q(3, "You inherited a mind that was already occupied."),
        "renamed": oq("dot", "We call exhaustion adulthood, anxiety responsibility, isolation independence, and endless accumulation success."),
        "lines": [q(3, "What you have learned to call normal becomes part of the world another person must live in.", mark="part of the world another person must live in")],
    },
    # The book's counterweight to the spiral: erosion is not the end of anyone.
    # "One is your nature and the other…" needs the two it separates, so the chapter's preceding
    # sentences lead (a reader asked "one what?").
    "way": {"heading": q(3, "The character carries the infection. The two have to be separated."), "lines": [q(3, "One is your nature and the other is somebody's business model."), q(3, "That is not your fault, but it is now your responsibility.", mark="it is now your responsibility"), q(3, "Obsequiousness and dishonesty are not human nature. They belong to the infection, not to the person, and neither infection nor erosion places anyone beyond recovery.", mark="neither infection nor erosion places anyone beyond recovery")]},
}

# The Leech, in the author's four terms, each with one published sentence.
model["leechTerms"] = [
    {"id": "inheritance", "term": "Civilizational inheritance", "line": q(1, "America inherited institutions, vocabularies, and claims from Western histories in which declarations of human advancement coexisted with conquest, enslavement, and exclusion.")},
    {"id": "value", "term": "Domination as human value", "line": q(1, "Enough is a position above someone else.")},
    {"id": "dehumanization", "term": "Dehumanization", "line": q(1, "another person's dependence is converted into a reason to discount their standing.", "start")},
    {"id": "hierarchy", "term": "Racial hierarchy", "line": q(3, "The country proclaimed human equality while allowing human beings to be property. That is the Inversion at the foundation.")},
]

pairs = []
for _, raw, para in DOCS[3]:
    match = re.match(r"\*\*(We claim [^*]+?\.) (We practice [^*]+?\.)\*\* (.+)", raw)
    if match:
        claim, practice = plain(match.group(1)), plain(match.group(2))
        pairs.append({"claim": q(3, claim), "practice": q(3, practice), "consequence": q(3, plain(match.group(3)))})
model["pairs"] = pairs

# Working Definitions, Chapter Four, with the DOT concepts each applies.
APPLIES = {"Canvas": ["canvas"], "Painting": ["painting"], "Intent": ["intent"], "Character": ["character"], "fear and Fear": ["fear-gating"], "Love": ["love"], "Practical decoupling": ["decoupling-principle"], "Infection": ["experience-loop"]}
terms = []
for section, raw, para in DOCS[4]:
    if section != "Working Definitions":
        continue
    match = re.match(r"\*\*(.+?)\.\*\* (.+)", raw)
    if match:
        term = plain(match.group(1))
        terms.append({"id": re.sub(r"[^a-z0-9]+", "-", term.lower()).strip("-"), "term": term, "definition": q(4, plain(match.group(2))), "applies": APPLIES.get(term, [])})
model["terms"] = terms

method = section_paragraphs(2, "10. Following a Relationship Precisely")
labels = ["Power", "Dependence", "Benefit and burden", "Justification and correction", "Response to evidence"]
prompts = ["Begin with the power: who can decide what?", "Then identify the dependence. What does the affected person need? Which alternatives exist in practice? What would leaving, appealing, or refusing cost?", "Next identify the benefit and the imposed burden.", "Then examine justification and correction. What legitimate purpose does the restriction serve? Is it proportionate? Who can test the reason? What happens when the reason fails?", "Finally, examine response to evidence."]
model["method"] = {
    "intro": q(2, method[0]),
    "steps": [{"id": re.sub(r"[^a-z]+", "-", label.lower()).strip("-"), "label": label, "text": q(2, method[i + 1]), "prompt": q(2, prompts[i])} for i, label in enumerate(labels)],
    "counter": q(2, method[6]),
}
model["weaken"] = [q(3, p) for p in section_paragraphs(3, "17. What Would Weaken the Infection Account?")]
model["change"] = [q(4, p) for p in section_paragraphs(4, "12. How We Know Whether Anything Is Changing")]

# Dated records, each with the chapter's own statement of what it is used for.
def note(chapter, key):
    line = next(raw for _, raw, _ in DOCS[chapter] if raw.startswith(f"[^{key}]:"))
    return plain(line.split(":", 1)[1]), re.search(r"\]\((https?://[^)]+)\)", line).group(1)


def use(text):
    sentences = re.split(r"(?<=\.) (?=[A-Z])", text)
    return next((s for s in sentences if s.startswith(("Used for", "It documents", "The cited findings", "The discussion concerns"))), "")


records = []
for chapter, key, date, title, issuer in [
    (1, "virginia", "1606-04-10", "The First Charter of Virginia", "Text preserved by Yale Law School's Avalon Project"),
    (1, "declaration", "1776-07-04", "Declaration of Independence", "National Archives transcription"),
    (1, "constitution", "1787-09-17", "Constitution of the United States, original Article IV, Section 2", "National Archives transcription"),
    (3, "voice", "2011-01-01", "Implicit Voice Theories: Taken-for-Granted Rules of Self-Censorship at Work", "James R. Detert and Amy C. Edmondson, Academy of Management Journal 54(3), 461–488"),
    (2, "ferguson", "2015-03-04", "Investigation of the Ferguson Police Department", "United States Department of Justice"),
    (2, "ftc", "2024-09-19", "Staff report on social media and video streaming services", "Federal Trade Commission"),
    (2, "diu", "2025-03-05", "DIU's Thunderforge Project to Integrate Commercial AI-Powered Decision-Making for Operational and Theater-Level Planning", "Defense Innovation Unit"),
]:
    text, href = note(chapter, key)
    records.append({"id": key, "date": date, "title": title, "issuer": issuer, "href": href, "use": use(text), "chapter": chapter})
model["records"] = records

model["sources"] = {doc: {key: info[key] for key in ("label", "route", "path") if key in info} for doc, info in OTHER.items()}

# Organized Power, decided with the author on 2026-11-17: economic disparity and dependence first,
# then the other powers, how it enters a person, the missing anchor and how it is carried on.
gao = oq(E2, "A 2026 GAO analysis found that institutional ownership increased from 2018 through 2024 across six selected metropolitan areas; in 2024, qualifying investors held 22 percent of single-family rentals in Jacksonville, 13 percent in Phoenix, and 9 percent in Dallas, while remaining a much smaller share of all single-family homes.")
metros = re.search(r"(\d+) percent of single-family rentals in (\w+), (\d+) percent in (\w+), and (\d+) percent in (\w+)", gao["text"]).groups()
# The diagnosis (/amm/reflect) opens its root cause by saying what a civilization is, in ordinary
# words (the author: "this isn't a good way to define a civilization" of Book One's Digital Organism
# definition), quoted from National Geographic Education. Moved from Organized Power at the
# author's request on 2026-11-18: it belongs with the culture.
model["reflect"] = {
    "civilization": {
        # Read from the publisher's page on 2026-11-17. Quoted, not paraphrased; not the author's words.
        "publisher": "National Geographic Education",
        "title": "Key Components of Civilization",
        "href": "https://education.nationalgeographic.org/resource/key-components-civilization/",
        "definition": "Civilization describes a complex way of life characterized by urban areas, shared methods of communication, administrative infrastructure, and division of labor.",
        "marksLead": "All civilizations have certain characteristics.",
        "marks": ["large population centers", "monumental architecture and unique art styles", "shared communication strategies", "systems for administering territories", "a complex division of labor", "the division of people into social and economic classes"],
    }
}

model["power"] = {
    "map": {"heading": q(2, "An attitude becomes institutionally consequential when it helps determine terms other people must live under.")},
    "wealth": {
        "lines": [oq(E2, "In the first quarter of 2026, American households held roughly $174 trillion in net worth."), oq(E2, "The problem is distribution and control.", mark="distribution and control")],
    },
    "equity": {
        "lines": [oq(E2, "The imbalance becomes sharper when the asset is corporate equity."), oq(E2, "This is how rising market values can produce great national wealth without producing comparable economic sovereignty for most households.", mark="without producing comparable economic sovereignty"), oq(E2, "Ownership exists, yet immediate agency remains constrained.", mark="immediate agency remains constrained")],
    },
    "savings": {
        "lines": [oq(E2, "Your retirement account may hold the shares, but you rarely exercise meaningful authority over the corporate power attached to them.", mark="you rarely exercise meaningful authority"), oq(E2, "This is the central contradiction: millions of workers collectively supply capital while its practical administration concentrates inside a small number of institutions.", mark="concentrates inside a small number of institutions")],
    },
    "income": {
        "drain": oq(E2, "Meanwhile the bottom half is drained, because nearly all its income must circulate immediately through housing, healthcare, debt service, food, transportation, utilities, and digital tolls.", mark="the bottom half is drained"),
        "up": oq(E2, "Wealth moves upward into claims that are liquid, diversified, and globally mobile."),
        "down": oq(E2, "Obligation moves downward into lives that remain embodied, indebted, taxable, and geographically fixed."),
        "close": oq(E2, "The Leech keeps the upside frictionless and returns the friction to the host.", mark="returns the friction to the host"),
    },
    "housing": {
        "ftc": oq(E2, "The Federal Trade Commission estimated in 2025 that mega-investors collectively owned and operated roughly 446,000 single-family homes nationwide."),
        "gao": gao,
        "metros": [{"label": metros[i + 1], "value": int(metros[i])} for i in (0, 2, 4)],
        "caveat": oq(E2, "Institutional investors do not own most American homes, and the evidence on their national effect on homeownership is not conclusive."),
        "lines": [oq(E2, "A home remains shelter to the person inside it. To a financial model it becomes a yield stream composed of rent, fees, appreciation, maintenance cost, vacancy, and eviction probability.", mark="a yield stream"), oq(E2, "The insecurity belongs to the host.", mark="insecurity")],
        "sources": {"ftc": "https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-seeks-public-comment-single-family-rental-home-mega-investors-study", "gao": "https://www.gao.gov/assets/gao-26-108675.pdf"},
    },
    "necessity": {
        "lines": [q(2, "Necessity makes dependence unusually consequential. Refusing an entertainment purchase is different from refusing the only available source of an essential service.", mark="the only available source of an essential service"), q(2, "A person who controls access to a scarce necessity can receive continuing payments from people who cannot readily provide that necessity themselves.", mark="continuing payments")],
        "between": [oq(E2, "Between you and shelter stands a landlord, lender, or fund."), oq(E2, "Between you and medical care stands an insurer, patent, or pharmaceutical pricing system."), oq(E2, "Between you and the market stands a tech platform."), oq(E2, "Between you and other people stands an algorithm.")],
        "close": oq(E2, "The public is told there is no alternative. That sentence marks the feeding point."),
    },
    "choices": {
        "lines": [q(2, "Debt can become part of how a person interprets a supervisor's request. A threatened loss can make an otherwise visible refusal practically unavailable.", mark="refusal practically unavailable"), q(2, "The person is not free merely because a contract describes them as choosing.", mark="not free"), q(3, "Their dependence is part of the explanation, not evidence that they consented to the terms.", mark="not evidence that they consented")],
    },
    "concentrated": {
        "lines": [q(1, "The Leech remains that behavior: the tendency to dominate and to be dishonest. Extraction is one way it may become materially organized.", mark="the tendency to dominate and to be dishonest"), q(1, "Humiliation, enforced dependence, exclusion from decisions, and punishment of justified objection are other possible expressions.", mark="enforced dependence")],
        "knowledge": q(2, "Dominance can arise where control of a method, credential, technical standard, or specialized language becomes a means of preventing effective challenge."),
        "records": {"state": "diu", "technology": "ftc"},
    },
    "enters": {
        # Book One's plain paragraph before "This is how civilization becomes Painting.": the same
        # point in ordinary words, for a reader who has not met Painting, Canvas or Intent.
        "heading": oq("dot", "By the time you are old enough to question your society, much of that society is already participating in the questioning."),
        "lines": [oq("dot", "Its categories are inside your language. Its fears are inside your body. Its measures of success are inside your ambitions.", mark="Its fears are inside your body"), oq("dot", "Even your rebellion may be organized by the options it taught you to see.", mark="organized by the options it taught you to see"), oq("dot", "This is how civilization becomes Painting.")],
    },
    "anchor": {
        # The author removed "When I speak of a moral foundation…" on 2026-11-17.
        "lines": [q(3, "A civilization cannot establish its moral standing by reciting values its institutions are permitted to violate."), q(3, "That is our condition: no solid moral foundation.", mark="no solid moral foundation")],
    },
    "carry": {
        "heading": oq("dot", "A person does not have to intend the whole system for the system to continue through that person.", mark="continue through that person"),
        "lines": [q(3, "An arrangement gains a deeper hold when the people living under it supply the reasons to obey it.", mark="supply the reasons to obey it"), q(3, "The institution no longer has to defend itself. People who need to stay inside it defend it to one another, and the bargain receives its moral defense from the person it constrains.", mark="the bargain receives its moral defense from the person it constrains")],
    },
    # The citizen's part, drawn on the opening figure in the chapter's own words: the thoughts
    # that make a person first a carrier, then an enforcer, and the one that protects the rest.
    "citizen": {
        "carrier": [q(3, "Be realistic."), q(3, "Don't make enemies.")],
        "enforcer": [q(3, "Know your place.")],
        "protects": q(3, "That's just human nature."),
    },
}

# The warning's figures are its sentences' own words, split where each sentence turns.
home = model["home"]
jammed = home["attention"]["jammed"]["text"]
listed = re.search(r"jammed with (.+), and endless fragments competing for (the next few seconds of your mind)\.", jammed)
home["attention"]["thread"] = {"whole": "a thought across years", "broken": listed.group(2), "interruptions": listed.group(1).split(", ")}
assert home["attention"]["thread"]["whole"] in home["attention"]["heading"]["text"]
home["mind"]["rows"] = [dict(zip(("before", "after"), re.match(r"(.+?) ((?:still|remains) .+)", line["text"]).groups())) for line in home["mind"]["still"]]
renamed = home["us"]["renamed"]["text"]
pairs = [("exhaustion", "adulthood"), ("anxiety", "responsibility"), ("isolation", "independence"), ("endless accumulation", "success")]
home["us"]["renames"] = {"lead": "We call", "pairs": [{"is": a, "called": b} for a, b in pairs]}
if renamed != "We call " + ", ".join(f"{a} {b}" for a, b in pairs[:-1]) + f", and {pairs[-1][0]} {pairs[-1][1]}.":
    sys.exit("The renamed sentence no longer splits into its pairs")

# The figures on the income screen are the chapter's own words, split where the sentence lists them.
income = model["power"]["income"]
for side, cut in (("up", "claims that are "), ("down", "lives that remain ")):
    head, tail = income[side]["text"].rstrip(".").split(cut)
    income[f"{side}Words"] = {"line": head + cut.rstrip(), "words": [w.removeprefix("and ") for w in tail.split(", ")]}

json.dump(model, open("src/content/amm-model.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
open("src/content/amm-model.json", "a").write("\n")
print("terms", len(terms), "pairs", len(pairs), "records", len(records), "weaken", len(model["weaken"]), "change", len(model["change"]), "argument", len(model["argument"]))
for r in records:
    print(" ", r["id"], "|", r["use"][:110])
