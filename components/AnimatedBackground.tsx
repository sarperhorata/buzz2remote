/**
 * Pure-CSS animated background.
 *
 * Three large blurry "orbs" drift slowly across the viewport on independent
 * keyframe loops, producing a subtle organic motion that breaks up the
 * previously-stark white background without adding a meaningful asset
 * payload or runtime JS:
 *   - 0 bytes JS at runtime (server component, no client bundle)
 *   - ~1.5 KB of CSS in globals.css for the keyframes + classes
 *   - GPU-accelerated transforms (translate/scale only) so no layout
 *     thrashing; will-change hints the compositor to dedicate a layer
 *
 * Layout: position: fixed; inset: 0; z-index: -1; pointer-events: none.
 * So it sits BEHIND everything, never intercepts clicks, and doesn't
 * affect scroll height. The fixed positioning means scrolling the page
 * doesn't move the orbs — they keep their slow drift regardless of
 * scroll position, which reads as a polished SaaS look.
 *
 * Colour: each orb references a CSS variable (--orb-1 / --orb-2 / --orb-3)
 * defined in globals.css with light + dark mode flavours. Light mode uses
 * warm honey/amber tints matching the brand; dark mode uses muted deep
 * amber + a touch of teal to keep contrast.
 *
 * Accessibility:
 *   - prefers-reduced-motion: reduce → animations are stopped (orbs still
 *     visible, just static). Handled in the CSS via @media query.
 *   - The orbs are aria-hidden by virtue of being purely decorative.
 */

export default function AnimatedBackground() {
  return (
    <div className="animated-bg" aria-hidden="true">
      {/*
        Layer stack, back to front:
          1. .aurora  — slow-rotating conic gradient ("northern lights")
          2. .orb x3  — drifting blurry circles
          3. .grain   — static dot grid (was already here)
          4. .noise   — SVG turbulence overlay for film-grain texture
        All four are pure CSS (the SVG turbulence is computed once and
        cached as a data URI). 0 bytes JS, ~3.5 KB total CSS+SVG.
      */}
      <div className="aurora" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grain" />
      <div className="noise" />
    </div>
  );
}
