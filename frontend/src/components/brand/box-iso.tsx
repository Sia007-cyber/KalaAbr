/* =============================================================
   BoxIso — isometric cardboard box illustrations for the landing
   hero's side gutters. Flat-shaded flat ramp (three distinct faces
   per box + a soft drop shadow via drop-shadow on the .landing-decor)
   with a single consistent light source from the top-left — each box
   shades its faces top→front→side darkest so it reads as volumetric
   kraft cardboard, in muted kraft-brown/neutral tones that stay quiet
   against the app's warm-neutral design system. Decorative only:
   every variant accepts width/height (CSS) and honors the SVGProps
   the caller applies (e.g. opacity for the muted treatment).

   Palette (inline, decorative):
     face-light #e3c9a4  face-mid #d4b188  face-dark #c19b70
     inner #a9814e  tape #d9b98a  seam/ink rgba(121,85,61,…)

   Geometry is generated (see the generator) — do not hand-edit the
   path data. Coordinates are centered in each viewBox so caller
   rotation keeps the box centered.
   ============================================================= */

import type { SVGProps } from 'react'

interface BoxIsoProps extends SVGProps<SVGSVGElement> {
  /** aria-hidden by default — decorative only */
  'aria-hidden'?: boolean | 'true' | 'false'
}

/* Faces are drawn in painter order: top (light), front (mid),
   then side (dark). A helper folds repeated <path> attrs. */
function Path({
  d, fill, stroke,
}: {
  d: string; fill?: string; stroke?: string
}) {
  return stroke
    ? <path d={d} fill="none" stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" />
    : <path d={d} fill={fill} />
}

const I = { ink: 'rgba(120,72,32,0.55)', seam: 'rgba(121,85,61,0.30)', tapeEdge: 'rgba(121,85,61,0.28)' }


export function SealedBox(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 138 116" aria-hidden="true" {...props}>
        <Path d="M 8.4 38 77.7 78 129.6 48 60.3 8 Z" fill="#e3c9a4" />
        <Path d="M 8.4 68 77.7 108 77.7 78 8.4 38 Z" fill="#d4b188" />
        <Path d="M 77.7 108 129.6 78 129.6 48 77.7 78 Z" fill="#c19b70" />
        <Path d="M 109.4 59.7 97.9 66.3 28.6 26.3 40.1 19.7 Z" fill="#d9b98a" />
        <Path d="M 72.8 75.2 13.2 40.8 13.2 55.8 72.8 90.2 Z" fill="#d9b98a" />
        <Path d="M 72.8 75.2 L 13.2 40.8" stroke={I.tapeEdge} />
        <Path d="M 74.2 30.4 L 22.2 60.4" stroke={I.seam} />
        <Path d="M 115.8 54.4 L 63.8 84.4" stroke={I.seam} />
        <Path d="M 117.9 69.2 L 89.4 85.7" stroke={I.seam} />
    </svg>
  )
}


export function SealedTall(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 110 122" aria-hidden="true" {...props}>
        <Path d="M 8.2 34 56.7 62 101.8 36 53.3 8 Z" fill="#e3c9a4" />
        <Path d="M 8.2 86 56.7 114 56.7 62 8.2 34 Z" fill="#d4b188" />
        <Path d="M 56.7 114 101.8 88 101.8 36 56.7 62 Z" fill="#c19b70" />
        <Path d="M 84.2 46.1 74.3 51.9 25.8 23.9 35.7 18.1 Z" fill="#d9b98a" />
        <Path d="M 53.3 60 11.6 36 11.6 62 53.3 86 Z" fill="#d9b98a" />
        <Path d="M 53.3 60 L 11.6 36" stroke={I.tapeEdge} />
        <Path d="M 63 38.6 L 17.9 64.6" stroke={I.seam} />
        <Path d="M 92.1 55.4 L 47 81.4" stroke={I.seam} />
        <Path d="M 91.6 66.8 L 66.9 81.1" stroke={I.seam} />
        <Path d="M 32.5 60.5 L 32.5 78.2" stroke={I.ink} />
        <Path d="M 27.6 74.4 L 37.3 80" stroke={I.ink} />
        <Path d="M 27.6 74.4 L 35.4 76.3" stroke={I.ink} />
        <Path d="M 35.4 76.3 L 33.2 76.6" stroke={I.ink} />
    </svg>
  )
}


export function SealedWide(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 145 110" aria-hidden="true" {...props}>
        <Path d="M 8.4 28 101.9 82 136.6 62 43.1 8 Z" fill="#e3c9a4" />
        <Path d="M 8.4 48 101.9 102 101.9 82 8.4 28 Z" fill="#d4b188" />
        <Path d="M 101.9 102 136.6 82 136.6 62 101.9 82 Z" fill="#c19b70" />
        <Path d="M 123.1 69.8 115.5 74.2 21.9 20.2 29.5 15.8 Z" fill="#d9b98a" />
        <Path d="M 95.4 78.2 15 31.8 15 41.8 95.4 88.2 Z" fill="#d9b98a" />
        <Path d="M 95.4 78.2 L 15 31.8" stroke={I.tapeEdge} />
        <Path d="M 61.8 28.4 L 27.1 48.4" stroke={I.seam} />
        <Path d="M 117.9 60.8 L 83.2 80.8" stroke={I.seam} />
        <Path d="M 128.8 76.1 L 109.7 87.1" stroke={I.seam} />
        <Path d="M 55.2 47.6 L 43 64.9" stroke={I.ink} />
        <Path d="M 43 64.9 L 67.3 78.9" stroke={I.ink} />
        <Path d="M 67.3 78.9 L 55.2 47.6" stroke={I.ink} />
        <Path d="M 55.2 78.7 L 55.2 71.9" stroke={I.ink} />
        <Path d="M 44 64.8 L 49.1 64.3" stroke={I.ink} />
        <Path d="M 44 49.9 L 49.1 56.2" stroke={I.ink} />
    </svg>
  )
}


export function SealedCube(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 131 112" aria-hidden="true" {...props}>
        <Path d="M 8.3 38 70.7 74 122.7 44 60.3 8 Z" fill="#e3c9a4" />
        <Path d="M 8.3 68 70.7 104 70.7 74 8.3 38 Z" fill="#d4b188" />
        <Path d="M 70.7 104 122.7 74 122.7 44 70.7 74 Z" fill="#c19b70" />
        <Path d="M 102.4 55.7 91 62.3 28.6 26.3 40 19.7 Z" fill="#d9b98a" />
        <Path d="M 66.3 71.5 12.7 40.5 12.7 55.5 66.3 86.5 Z" fill="#d9b98a" />
        <Path d="M 66.3 71.5 L 12.7 40.5" stroke={I.tapeEdge} />
        <Path d="M 39.5 62.8 L 39.5 73.4" stroke={I.ink} />
        <Path d="M 33.3 68.8 L 45.8 76" stroke={I.ink} />
        <Path d="M 33.3 68.8 L 43.3 72.1" stroke={I.ink} />
        <Path d="M 43.3 72.1 L 40.5 71.9" stroke={I.ink} />
    </svg>
  )
}


export function OpenCrate(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 143 119" aria-hidden="true" {...props}>
        <Path d="M 13.6 42.9 86.3 84.9 134.8 56.9 62.1 14.9 Z" fill="#a9814e" />
        <Path d="M 13.6 68.9 86.3 110.9 86.3 84.9 13.6 42.9 Z" fill="#d4b188" />
        <Path d="M 86.3 110.9 134.8 82.9 134.8 56.9 86.3 84.9 Z" fill="#c19b70" />
        <Path d="M 86.3 84.9 13.6 42.9 8.2 54.3 73.7 92.1 Z" fill="#d4b188" />
        <Path d="M 134.8 56.9 62.1 14.9 65.7 8.1 131.2 45.9 Z" fill="#e3c9a4" />
        <Path d="M 86.3 84.9 134.8 56.9 131.2 45.9 82.7 73.9 Z" fill="#e3c9a4" />
        <Path d="M 25.2 57.4 L 34.7 62.9" stroke={I.seam} />
        <Path d="M 65.2 80.5 L 74.7 86" stroke={I.seam} />
    </svg>
  )
}


export function OpenFlap(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 134 115" aria-hidden="true" {...props}>
        <Path d="M 8.1 44.6 73.9 82.6 125.9 52.6 60.1 14.6 Z" fill="#a9814e" />
        <Path d="M 8.1 68.6 73.9 106.6 73.9 82.6 8.1 44.6 Z" fill="#d4b188" />
        <Path d="M 73.9 106.6 125.9 76.6 125.9 52.6 73.9 82.6 Z" fill="#c19b70" />
        <Path d="M 125.9 52.6 60.1 14.6 63.4 8.4 122.6 42.6 Z" fill="#e3c9a4" />
        <Path d="M 73.9 82.6 125.9 52.6 122.6 42.6 70.6 72.6 Z" fill="#e3c9a4" />
    </svg>
  )
}


export function LooseOpen(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 143 112" aria-hidden="true" {...props}>
        <Path d="M 13.5 34 89.7 78 134.7 52 58.5 8 Z" fill="#a9814e" />
        <Path d="M 13.5 60 89.7 104 89.7 78 13.5 34 Z" fill="#d4b188" />
        <Path d="M 89.7 104 134.7 78 134.7 52 89.7 78 Z" fill="#c19b70" />
        <Path d="M 89.7 78 13.5 34 8.3 45.6 76.9 85.2 Z" fill="#d4b188" />
        <Path d="M 73.8 29.3 L 28.7 55.3" stroke={I.seam} />
        <Path d="M 119.5 55.7 L 74.4 81.7" stroke={I.seam} />
        <Path d="M 124.6 70.3 L 99.8 84.6" stroke={I.seam} />
    </svg>
  )
}


export function TallRecycle(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 103 112" aria-hidden="true" {...props}>
        <Path d="M 8.2 32 53.2 58 94.8 34 49.8 8 Z" fill="#e3c9a4" />
        <Path d="M 8.2 78 53.2 104 53.2 58 8.2 32 Z" fill="#d4b188" />
        <Path d="M 53.2 104 94.8 80 94.8 34 53.2 58 Z" fill="#c19b70" />
        <Path d="M 78.6 43.4 69.4 48.6 24.4 22.6 33.6 17.4 Z" fill="#d9b98a" />
        <Path d="M 50.1 56.2 11.4 33.8 11.4 56.8 50.1 79.2 Z" fill="#d9b98a" />
        <Path d="M 50.1 56.2 L 11.4 33.8" stroke={I.tapeEdge} />
        <Path d="M 58.8 35.3 L 17.2 59.3" stroke={I.seam} />
        <Path d="M 85.8 50.9 L 44.2 74.9" stroke={I.seam} />
        <Path d="M 85.4 61.5 L 62.6 74.7" stroke={I.seam} />
        <Path d="M 30.7 57.4 L 24.9 65.8" stroke={I.ink} />
        <Path d="M 24.9 65.8 L 36.6 72.5" stroke={I.ink} />
        <Path d="M 36.6 72.5 L 30.7 57.4" stroke={I.ink} />
        <Path d="M 30.7 72.4 L 30.7 69.1" stroke={I.ink} />
        <Path d="M 25.3 65.7 L 27.8 65.5" stroke={I.ink} />
        <Path d="M 25.3 58.5 L 27.8 61.6" stroke={I.ink} />
    </svg>
  )
}


export function FlatSlip(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 127 94" aria-hidden="true" {...props}>
        <Path d="M 8.1 24 91.2 72 118.9 56 35.8 8 Z" fill="#e3c9a4" />
        <Path d="M 8.1 38 91.2 86 91.2 72 8.1 24 Z" fill="#d4b188" />
        <Path d="M 91.2 86 118.9 70 118.9 56 91.2 72 Z" fill="#c19b70" />
        <Path d="M 108.1 62.2 102 65.8 18.9 17.8 25 14.2 Z" fill="#d9b98a" />
        <Path d="M 85.4 68.6 13.9 27.4 13.9 34.4 85.4 75.6 Z" fill="#d9b98a" />
        <Path d="M 85.4 68.6 L 13.9 27.4" stroke={I.tapeEdge} />
    </svg>
  )
}


export function Parcel(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 131 106" aria-hidden="true" {...props}>
        <Path d="M 8.3 34 77.6 74 122.7 48 53.4 8 Z" fill="#e3c9a4" />
        <Path d="M 8.3 58 77.6 98 77.6 74 8.3 34 Z" fill="#d4b188" />
        <Path d="M 77.6 98 122.7 72 122.7 48 77.6 74 Z" fill="#c19b70" />
        <Path d="M 105.1 58.1 95.2 63.9 25.9 23.9 35.8 18.1 Z" fill="#d9b98a" />
        <Path d="M 72.8 71.2 13.2 36.8 13.2 48.8 72.8 83.2 Z" fill="#d9b98a" />
        <Path d="M 72.8 71.2 L 13.2 36.8" stroke={I.tapeEdge} />
        <Path d="M 43 52.6 L 34 65.4" stroke={I.ink} />
        <Path d="M 34 65.4 L 52 75.8" stroke={I.ink} />
        <Path d="M 52 75.8 L 43 52.6" stroke={I.ink} />
        <Path d="M 43 75.6 L 43 70.6" stroke={I.ink} />
        <Path d="M 34.7 65.3 L 38.5 65" stroke={I.ink} />
        <Path d="M 34.7 54.3 L 38.5 59" stroke={I.ink} />
    </svg>
  )
}


export function RollOsb(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 93 100" aria-hidden="true" {...props}>
        <Path d="M 8.4 30 46.5 52 84.6 30 46.5 8 Z" fill="#e3c9a4" />
        <Path d="M 8.4 70 46.5 92 46.5 52 8.4 30 Z" fill="#d4b188" />
        <Path d="M 46.5 92 84.6 70 84.6 30 46.5 52 Z" fill="#c19b70" />
        <Path d="M 54.1 31.6 L 16 53.6" stroke={I.seam} />
        <Path d="M 77 44.8 L 38.9 66.8" stroke={I.seam} />
        <Path d="M 76 54.2 L 55.1 66.3" stroke={I.seam} />
    </svg>
  )
}


export function Stacked(props: BoxIsoProps) {
  return (
    <svg viewBox="0 0 138 127" aria-hidden="true" {...props}>
        <Path d="M 8.4 53 77.7 93 129.6 63 60.3 23 Z" fill="#e3c9a4" />
        <Path d="M 8.4 79 77.7 119 77.7 93 8.4 53 Z" fill="#d4b188" />
        <Path d="M 77.7 119 129.6 89 129.6 63 77.7 93 Z" fill="#c19b70" />
        <Path d="M 109.4 74.7 97.9 81.3 28.6 41.3 40.1 34.7 Z" fill="#d9b98a" />
        <Path d="M 72.8 90.2 13.2 55.8 13.2 68.8 72.8 103.2 Z" fill="#d9b98a" />
        <Path d="M 72.8 90.2 L 13.2 55.8" stroke={I.tapeEdge} />
        <Path d="M 74.2 43.5 L 22.2 73.5" stroke={I.seam} />
        <Path d="M 115.8 67.5 L 63.8 97.5" stroke={I.seam} />
        <Path d="M 117.9 82.2 L 89.4 98.7" stroke={I.seam} />
        <Path d="M 25.7 26 67.3 50 98.4 32 56.9 8 Z" fill="#e3c9a4" />
        <Path d="M 25.7 44 67.3 68 67.3 50 25.7 26 Z" fill="#d4b188" />
        <Path d="M 67.3 68 98.4 50 98.4 32 67.3 50 Z" fill="#c19b70" />
        <Path d="M 86.3 39 79.4 43 37.9 19 44.7 15 Z" fill="#d9b98a" />
        <Path d="M 64.4 48.3 28.6 27.7 28.6 36.7 64.4 57.3 Z" fill="#d9b98a" />
        <Path d="M 64.4 48.3 L 28.6 27.7" stroke={I.tapeEdge} />
        <Path d="M 46.5 41.7 L 46.5 48.4" stroke={I.ink} />
        <Path d="M 42.3 45 L 50.6 49.8" stroke={I.ink} />
        <Path d="M 42.3 45 L 49 46.4" stroke={I.ink} />
        <Path d="M 49 46.4 L 47.1 46.8" stroke={I.ink} />
    </svg>
  )
}
