# ADR-0052: A transparent, reader-controlled Host loop on AMM

- **Status:** Accepted
- **Date:** 2026-10-17
- **Decider:** Founder, explicitly requesting `amm.mp4` in the hero, then automatic cycling without Replay, enlarged and frameless at source resolution
- **Amends:** ADR-0051's pictures-only landing decision; scoped public-hero exception to L2, following ADR-0037

## Decision

Use the supplied Host clip only on `/amm`. Derive a local, silent VP9-alpha WebM
from `docs/blueprint/amm/amm-hero-source.mp4` (kept outside `public/`, so the source
is never deployed). Trim its nine-frame black leader and key
the green background. Protect the enclosed landscape within the phone, suppress
green spill only at the matte edge, and lightly soften the alpha edge. Retain the
native 1280 × 720 resolution and frame rate, encoded at CRF 34 (about 2.8 MB, half the
first encode, with no visible loss at hero size). Keep the source unchanged and the conversion
reproducible with `frontend/scripts/prepare-amm-hero.mjs`. The enlarged artwork
sits directly on the existing paper or dark theme without a frame, border or
player panel. No CSS blend mode substitutes for transparency.

Autoplay muted and inline when the hero is visible, and loop the same clip.
Provide a discreet, visible Pause/Play button, without Replay or native player
chrome. Pause while offscreen, while the document is hidden, and when the reader
opens the original illustration. No next item, automatic navigation or reading
gate. The reading itself stays finite and advances only with the reader.

System reduced motion, saved stillness, a disabled environment and data saving
retain the original still image without requesting the clip. Turning stillness
off does not restart playback automatically. The original image also remains
the static HTML, social preview and accessible description. Its shared inspection
dialog stays available. Unsupported transparency, load failure or absent canvas
inspection falls back to the original image. A single tiny canvas read verifies
the decoder's alpha support; there is no continuous canvas-rendering loop.

The founder's explicit autoplay and auto-cycle instructions supersede the earlier
pictures-only preference for this one public hero. This is a narrow exception to
L2's looping-media restriction. Other AMM sections and all member and Reader
surfaces keep their existing motion rules. No manifesto-test quarantine is added.

## Validation and laws

Browser checks cover transparent output, automatic playback and cycling, manual
pause, offscreen suspension, stillness, inspection, failure fallback, and phone
layout. `make verify` remains the release gate.

Serves L1 (deterministic), L7 (pause and accessible still alternative), L9 (local
media without tracking), and L10 (one illustration). The explicit L2 exception
is limited to this public decorative loop; no member autoplay, autoplay-next,
engagement-ranked content or content advancement is introduced.
