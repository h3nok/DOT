# ADR-0047: Mobile-first public controls

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** Founder (request for a complete mobile-first pass)
- **Extends:** ADR-0045

## Context

Public pages fit a phone's width, but desktop navigation wraps into a second
header row, standalone links and reading tools have small targets, and contact
purpose cards delay the actual form. Floating appearance controls can cover
fields. Reading panels also need to work when viewport height shrinks.

## Decision

Keep the existing shared design system. Add touch-target and safe-area tokens
and load shared mobile foundations from the live entry. Standalone public
controls use at least 44px targets; prose links and SVG labels keep their text
geometry. Phone text fields use at least 16px type.

Below 640px, SiteNav offers a deliberately opened, finite Radix popover with
six named destinations. Desktop navigation remains visible above that width.
Escape and explicit close return focus; navigation and a wider viewport close
the popover. Home's phone header follows document flow as sticky chrome.

PageHeader owns inline appearance controls. Pages with that header hide the
application's floating fallback; legacy canvases retain it. Phone panels use
dynamic viewport height, safe areas, and contained scrolling. Book contents
keep their close control outside the scrolling list.

Observe VisualViewport height and vertical offset for keyboards that resize or
pan the visible window without resizing page layout. Panels use these shared
tokens, with dynamic viewport units as fallback. Ignore pinch-zoom changes so
native zoom can magnify the existing page without continually recomposing it.

IntentionPicker uses a native select and the chosen description on phones,
keeping its radio tiles on larger screens and the same controlled value in
both. Changing purpose preserves the inquiry draft. Book One's phone cover
is compact and its primary reading action precedes supporting copy visually.
Diagram destinations also have separate phone links in the model's existing
order, without changing the figure or its causal animation.

Serves L1 (calm), L2 (finite navigation), L7 (native controls and recovery),
L10 (legible actions), and L12 (reader-directed paths). Violates no manifesto
laws. No author prose, manuscript, absent Attention OS primitive, or backend
contract changes.

## Consequences

Phone visitors reach content and forms sooner with fewer obstructing controls.
Desktop composition and reader-selected type, contrast, and motion remain
available. Browser checks cover narrow phones, orientation, larger reading
type, short panels, navigation dismissal, and draft preservation; physical
phone keyboard and Safari behavior still require device validation.

## Alternatives considered

- Keep every desktop navigation link in a wrapping phone header: easy to
  maintain, but consumes the opening viewport.
- Build custom phone selects or gesture-only controls: adds complexity and
  hides familiar native behavior.
- Extend the existing primitives and Radix component: chosen for continuity,
  keyboard behavior, and explicit visitor control.
