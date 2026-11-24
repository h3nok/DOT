# ADR-0061: One AMM Signature Theme, in Light and Dark

- **Status:** Accepted
- **Date:** 2026-11-23
- **Deciders:** Founder ("Can you just simplify the themes please. One signature AMM theme,
  dark and light"; chose the whole site over AMM pages only)
- **Supersedes:** the site palette and alternate environments of ADR-0034. ADR-0034's print,
  PDF, and channel identity (`identity.json`) stands.

## Context

The Appearance panel offered twelve named environments, six surface styles, nine accent tints
and a hue wheel, four paper tones, eleven background fields with three dials, and saved
environments. AMM pages already carried their own print palette and overrode the site's, so most
of those choices did nothing on the pages the founder works on, while DOT pages wore a different
(jade) identity. The founder found the dark themes "a little off" and the AMM button's edge not
smooth in dark mode. That edge came from High contrast painting a cream ring on the filled
button.

## Decision

The site has one theme, AMM's signature, in light and dark, on every page.

- `frontend/src/content/theme.json` is the site palette: warm paper `#f6f1e7` and charcoal ink
  `#232525` by day; charcoal `#202222` and warm-white `#f2ecdf` at night; rust `#a73524` /
  `#f09279` as the one accent. Body text is AAA and supporting text and actions AA in both
  lights (tested).
- `identity.json` remains DOT's print and channel brand (book jacket, PDF, video kit, films). On
  the site it supplies only the font roles and the `--brand-*` colours of the on-page Book One
  cover, which depicts the printed jacket.
- The theme's settings are fixed (`SIGNATURE_THEME`): the radial field drawn in rust with its gold
  harmonic, the neural surface, and the theme's own paper with no extra cast. Configurations saved
  under retired environments resolve into it and keep their reading choices. A saved
  "field off" becomes "Hold still".
- The home's architecture keeps its jade (Big C) and gold (RF) because there each colour names a
  layer of the theory, not the theme.
- The panel offers: Light or Dark, reading style, text size, High contrast, Hold still, and the
  folded reading controls (face, measure, leading, paragraphs, alignment). Reset restores
  reading defaults and leaves the light alone.
- AMM pages inherit the theme instead of redefining it; the shell adds only the flame.
- The AMM primary button is one fill with no ring or highlight line, in both contrast settings.

Serves L1 (fewer decisions before reading), L7 (the panel is short and Reset is easy), and
L10 (one recognisable identity). Violates no manifesto law: reduced motion, Hold still, and
High contrast remain the reader's.

## Consequences

- Readers lose custom looks (tints, paper tones, alternate fields). Accessibility choices stay.
- Visual QA covers two states instead of dozens.
- CSS for the retired surface styles (editorial, minimal, organic, cinematic, glass) and the
  membrane's non-radial fields is now unreachable. It is left for a separate cleanup change
  (ADR-0005) and can be deleted without visual effect.
- Revisit if readers ask for a sepia or low-light reading paper; add it as a reading option,
  not as another theme.

## Alternatives considered

| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
| AMM theme on AMM pages only; DOT keeps jade | Smaller change | Two identities on one site; panel still mismatched | Rejected by the founder |
| Keep environments, change defaults | No reader loses a look | The complexity the founder asked to remove stays | Rejected |
| Change `identity.json` to the AMM palette | One file | Would repaint the printed book and channel kit | Rejected |
