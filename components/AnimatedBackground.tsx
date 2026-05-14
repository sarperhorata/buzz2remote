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

/**
 * 12 floating particles — small sharp-edged dots that drift across the
 * viewport on independent paths. Layered ABOVE the orbs/aurora to give
 * an unambiguous motion cue: where the orbs are "ambient colour fields
 * that slowly shift", the particles are "objects you can clearly see
 * moving". Inspired by Linear / Vercel / Stripe.
 *
 * Each particle is described by:
 *   - top/left: starting position (% of viewport)
 *   - size: 4-9 px (sharp, small, eye-trackable)
 *   - dur: animation duration (vary so they don't sync)
 *   - delay: negative so the animation is already underway at page load
 *   - dx/dy: peak-drift offsets (the particle travels this far at its
 *            midpoint, then returns)
 *   - alpha: peak opacity (animated from 0 → alpha → 0 each loop, so
 *            particles fade in and out)
 *
 * Values are hand-tuned: distribution avoids the dense centre of the
 * page (where content sits) and concentrates particles near the edges
 * and corners. Sizes and durations are uncorrelated so the motion looks
 * organic rather than periodic.
 */
const PARTICLES: Array<{
  top: string; left: string;
  size: number;
  dur: string; delay: string;
  dx: string; dy: string;
  alpha: number;
}> = [
  { top: "8%",  left: "6%",   size: 5, dur: "14s", delay: "-1s",  dx: "40vw",  dy: "30vh",  alpha: 0.7 },
  { top: "12%", left: "88%",  size: 7, dur: "18s", delay: "-4s",  dx: "-35vw", dy: "25vh",  alpha: 0.6 },
  { top: "32%", left: "4%",   size: 4, dur: "22s", delay: "-8s",  dx: "50vw",  dy: "-15vh", alpha: 0.55 },
  { top: "28%", left: "92%",  size: 6, dur: "16s", delay: "-3s",  dx: "-40vw", dy: "-20vh", alpha: 0.65 },
  { top: "55%", left: "8%",   size: 5, dur: "20s", delay: "-11s", dx: "30vw",  dy: "30vh",  alpha: 0.5  },
  { top: "60%", left: "85%",  size: 8, dur: "24s", delay: "-6s",  dx: "-25vw", dy: "-30vh", alpha: 0.55 },
  { top: "78%", left: "15%",  size: 6, dur: "17s", delay: "-9s",  dx: "20vw",  dy: "-40vh", alpha: 0.6  },
  { top: "82%", left: "75%",  size: 4, dur: "19s", delay: "-2s",  dx: "-30vw", dy: "-25vh", alpha: 0.7  },
  { top: "5%",  left: "45%",  size: 4, dur: "21s", delay: "-13s", dx: "15vw",  dy: "45vh",  alpha: 0.45 },
  { top: "92%", left: "50%",  size: 5, dur: "23s", delay: "-7s",  dx: "-20vw", dy: "-50vh", alpha: 0.5  },
  { top: "45%", left: "50%",  size: 9, dur: "26s", delay: "-15s", dx: "30vw",  dy: "20vh",  alpha: 0.4  },
  { top: "20%", left: "30%",  size: 5, dur: "15s", delay: "-5s",  dx: "-25vw", dy: "40vh",  alpha: 0.6  },
];

export default function AnimatedBackground() {
  return (
    <div className="animated-bg" aria-hidden="true">
      {/*
        Layer stack, back to front:
          1. .aurora      — slow-rotating conic gradient ("northern lights")
          2. .orb x3      — drifting blurry circles (ambient colour)
          3. .grain       — static dot grid
          4. .noise       — SVG turbulence overlay for film-grain texture
          5. .particle x12 — small sharp-edged drifting dots (unambiguous motion)
        All pure CSS. 0 bytes JS runtime, ~5 KB total stylesheet additions.
      */}
      <div className="aurora" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grain" />
      <div className="noise" />
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            // Pass per-particle CSS custom props to the shared .particle
            // rule in globals.css. This keeps the keyframe + base style
            // in one place and only the variations live here.
            ["--p-dur" as string]: p.dur,
            ["--p-delay" as string]: p.delay,
            ["--p-dx" as string]: p.dx,
            ["--p-dy" as string]: p.dy,
            ["--p-alpha" as string]: String(p.alpha),
          }}
        />
      ))}
    </div>
  );
}
