/* =============================================================
   Wordmark — the کالاابر brand wordmark. Permanent brand rule:
   the name always renders stretched with kashida/tatweel, split
   into two visually distinct parts:
     «کـــالـا» (Kala) — solid dark/black text
     «اَبـــر» (Abr)   — white text outlined with a thin black
   stroke (-webkit-text-stroke). The fatha above the alef is the
   real Unicode combining fatha (U+064E) written inline after the
   alef («اَ») so the shaper renders it above the letter; no
   positioned pseudo-diacritic. lang="fa" dir="rtl" keep the
   combining mark visible in every browser. Reuse <Wordmark />
   everywhere the name appears as text (landing header, auth
   card, sidebar). Plain «کالاابر» text is never allowed.
   ============================================================= */

import './wordmark.css'

interface WordmarkProps {
  /** semantic heading tag when used as the page's main logo */
  as?: 'span' | 'h1' | 'p'
  className?: string
}

export function Wordmark({ as: Tag = 'span', className = '' }: WordmarkProps) {
  return (
    <Tag
      lang="fa"
      dir="rtl"
      className={`wordmark ${className}`}
      aria-label="کالاابر"
    >
      {/* کـــالـا — dark part */}
      <span className="wordmark-kala" aria-hidden>
        {`کـــالـا`}
      </span>
      {/* اَبـــر — white fill + thin black outline; combining
          fatha U+064E inline after the alef: ا + َ = «اَ» */}
      <span className="wordmark-abr" aria-hidden>
        {`اَ`}
        {`بـــر`}
      </span>
    </Tag>
  )
}