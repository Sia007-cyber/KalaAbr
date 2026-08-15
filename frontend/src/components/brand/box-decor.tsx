/* =============================================================
   BoxDecor — flat SVG crate/box illustrations for the landing
   hero's side gutters. Clean line-art shapes in the app's
   warm-neutral palette (subtle flat fills + a fine neutral-300
   stroke + a single indigo tape accent), no shading/gradients —
   premium, not cartoon. Each completes the element's bounding
   box so caller rotation keeps the box centered.
   ============================================================= */

import type { SVGProps } from 'react'

interface BoxProps extends SVGProps<SVGSVGElement> {
  /** aria-hidden by default — decorative only */
  'aria-hidden'?: boolean | 'true' | 'false'
}

const common = {
  fill: 'none',
  stroke: '#d6d3d1', /* --neutral-300 */
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/* ---------- Open cardboard crate: body + splayed flaps ---------- */
export function OpenCrate(props: BoxProps) {
  return (
    <svg viewBox="0 0 112 84" {...common} {...props}>
      {/* back flaps (raised) */}
      <path d="M30 32 L14 20 M82 32 L98 20" />
      {/* front flap */}
      <path d="M52 32 L49 17 M60 32 L63 17" stroke="#a8a29e" />
      {/* crate body */}
      <path d="M20 34 h72 v40 h-72 z" fill="#f5f5f4" />
      {/* top opening */}
      <path d="M20 34 h72" />
      {/* side crease lines */}
      <path d="M56 34 v40 M56 34" opacity="0.4" />
    </svg>
  )
}

/* ---------- Closed/sealed box: lid flaps + tape seam ---------- */
export function SealedBox(props: BoxProps) {
  return (
    <svg viewBox="0 0 96 88" {...common} {...props}>
      {/* box */}
      <path d="M16 36 h64 v36 h-64 z" fill="#f5f5f4" />
      {/* lid flap */}
      <path d="M16 36 L27 20 h42 l11 16" fill="#e7e5e4" />
      {/* tape seam over the lid */}
      <path d="M48 20 v52" stroke="#4338ca" strokeOpacity="0.75" />
      {/* stitch marks */}
      <path d="M34 40 v24 M62 40 v24" stroke="#a8a29e" />
    </svg>
  )
}

/* ---------- Wrapped parcel: strap + tape, rounded bundle ---------- */
export function Parcel(props: BoxProps) {
  return (
    <svg viewBox="0 0 88 72" {...common} {...props}>
      {/* bundle */}
      <rect x="14" y="12" width="60" height="48" rx="5" fill="#f5f5f4" transform="rotate(-6 44 36)" />
      {/* vertical strap */}
      <rect x="39" y="10" width="10" height="54" rx="2" transform="rotate(-6 44 36)" fill="#e7e5e4" />
      {/* tape piece */}
      <rect x="32" y="28" width="24" height="8" rx="1.5" transform="rotate(-6 44 36)" fill="#4338ca" stroke="none" />
    </svg>
  )
}

/* ---------- Loose/unwrapped corrugated box ---------- */
export function LooseBox(props: BoxProps) {
  return (
    <svg viewBox="0 0 92 76" {...common} {...props}>
      {/* box — loose, slightly tilted flaps */}
      <path d="M16 30 h60 v32 h-60 z" fill="#f5f5f4" />
      {/* top flaps */}
      <path d="M31 30 l-8 -12 M61 30 l8 -12 M46 30 v-10" />
      {/* corrugation lines */}
      <path d="M28 38 v16 M38 38 v16 M54 38 v16 M64 38 v16" stroke="#a8a29e" opacity="0.5" />
    </svg>
  )
}