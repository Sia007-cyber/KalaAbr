/* =============================================================
   LandingPage — public marketing surface at / (outside the shell).
   Persian RTL hero + scroll-reveal feature cards. The reveal uses
   only opacity + translateY(8px) over --dur-* / --ease-out tokens,
   so the global prefers-reduced-motion guard zeroes it silently.
   ============================================================= */

import { useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Boxes,
  LayoutDashboard,
  ListOrdered,
  Warehouse,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Wordmark } from '../../components/brand/Wordmark'
import {
  SealedBox,
  SealedTall,
  SealedWide,
  SealedCube,
  OpenCrate,
  OpenFlap,
  LooseOpen,
  TallRecycle,
  FlatSlip,
  Parcel,
  RollOsb,
  Stacked,
} from '../../components/brand/box-iso'
import { useIsAuthenticated } from '../../lib/hooks'
import logoMarkUrl from '../../assets/logo-mark.svg'
import './landing.css'

/* ---------- Scroll reveal ---------- */
/* One IntersectionObserver for the whole page: any .reveal element
   fades/rises in once, with a --reveal-delay staggered per index so
   the grid cascades (0 → --dur-slow). No bounce, subtle by design. */
function useReveal(deps: unknown[] = []) {
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const targets = root.querySelectorAll<HTMLElement>('.reveal')
    if (targets.length === 0) return

    /* Prefers-reduced-motion is handled globally via the token guard:
       --dur-* becomes 0ms so the transition is instant and the element
       ends visible. But if motion is reduced the observer should still
       fire — reveal via opacity toggling class immediately. */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      targets.forEach((el) => el.classList.add('is-in-view'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return rootRef
}

interface Feature {
  title: string
  desc: string
  Icon: typeof LayoutDashboard
}

const FEATURES: Feature[] = [
  {
    title: 'داشبورد مدیریت',
    desc: 'نمای یکپارچه از انبارها، کالاها و وضعیت موجودی در یک نگاه.',
    Icon: LayoutDashboard,
  },
  {
    title: 'پیگیری موجودی',
    desc: 'موجودی لحظهای هر کالا همراه با رزرو و ورودیهای در راه.',
    Icon: Boxes,
  },
  {
    title: 'مجوزها و حرکات انبار',
    desc: 'ثبت و تأیید مجوزهای خرید و فروش با مدیریت کامل گردش کالا.',
    Icon: ListOrdered,
  },
  {
    title: 'گزارش‌ها',
    desc: 'گزارش‌گیری شفاف از گردش موجودی و وضعیت مالی سیستم.',
    Icon: Warehouse,
  },
]

export function LandingPage() {
  const rootRef = useReveal()
  const authed = useIsAuthenticated()

  /* Signed-in users hitting the public landing go straight into the app. */
  if (authed) return <Navigate to="/dashboard" replace />

  /* Dense warehouse-crate SCATTER filling the hero's two full side
     rectangles corner-to-corner (fix: spread, not a thin strip). Each
     entry is absolutely placed via CSS custom props: side (start/end),
     --decor-x horizontal offset within the side zone, --decor-top %,
     --decor-size (vw — mixed small & large for a real stacked-pile
     look), --decor-rot, and --decor-delay to stagger the box-rise.
     Heavy overlap is intentional — stacked crates read as a loaded
     shelf. Decorative + aria-hidden. */
  const deco = [
    /* ---- left zone (inline-start); x = offset from the fold edge ---- */
    { C: SealedTall,   side: 'start', x: 2,  top: 4,  size: 8.0, rot: -10, delay: 0 },
    { C: OpenCrate,    side: 'start', x: 40, top: 12, size: 4.6, rot: 6,   delay: 140 },
    { C: SealedCube,   side: 'start', x: 55, top: 3,  size: 5.4, rot: -4,  delay: 60 },
    { C: FlatSlip,     side: 'start', x: 14, top: 32, size: 6.4, rot: -7,  delay: 200 },
    { C: LooseOpen,    side: 'start', x: 58, top: 26, size: 3.6, rot: 9,   delay: 90 },
    { C: Stacked,      side: 'start', x: 30, top: 44, size: 7.2, rot: -3,  delay: 40 },
    { C: Parcel,       side: 'start', x: 5,  top: 52, size: 5.0, rot: 5,   delay: 170 },
    { C: SealedBox,    side: 'start', x: 66, top: 47, size: 4.2, rot: -8,  delay: 130 },
    { C: RollOsb,      side: 'start', x: 22, top: 63, size: 4.8, rot: 7,   delay: 250 },
    { C: SealedWide,   side: 'start', x: 60, top: 60, size: 7.0, rot: -5,  delay: 90 },
    { C: OpenFlap,     side: 'start', x: 42, top: 78, size: 3.4, rot: 10,  delay: 210 },
    { C: TallRecycle,  side: 'start', x: 8,  top: 82, size: 6.0, rot: -6,  delay: 160 },
    { C: SealedCube,   side: 'start', x: 55, top: 88, size: 4.6, rot: 4,   delay: 40 },
    { C: LooseOpen,    side: 'start', x: 30, top: 97, size: 5.6, rot: -9,  delay: 230 },
    /* ---- right zone (inline-end); x = offset from the fold edge ---- */
    { C: OpenFlap,     side: 'end', x: 2,  top: 6,  size: 6.6, rot: 9,   delay: 170 },
    { C: SealedWide,   side: 'end', x: 48, top: 2,  size: 7.2, rot: -6,  delay: 20 },
    { C: SealedTall,   side: 'end', x: 22, top: 18, size: 5.2, rot: 6,   delay: 120 },
    { C: FlatSlip,     side: 'end', x: 60, top: 22, size: 4.0, rot: -5,  delay: 70 },
    { C: OpenCrate,    side: 'end', x: 6,  top: 37, size: 4.8, rot: -8,  delay: 240 },
    { C: RollOsb,      side: 'end', x: 52, top: 38, size: 5.6, rot: 7,   delay: 110 },
    { C: SealedCube,   side: 'end', x: 26, top: 52, size: 6.8, rot: -4,  delay: 50 },
    { C: LooseOpen,    side: 'end', x: 2,  top: 58, size: 3.8, rot: 8,   delay: 190 },
    { C: Parcel,       side: 'end', x: 62, top: 55, size: 4.6, rot: -7,  delay: 220 },
    { C: Stacked,      side: 'end', x: 34, top: 70, size: 7.6, rot: 5,   delay: 30 },
    { C: SealedBox,    side: 'end', x: 56, top: 74, size: 5.0, rot: -9,  delay: 150 },
    { C: SealedTall,   side: 'end', x: 10, top: 88, size: 4.4, rot: 4,   delay: 260 },
    { C: OpenCrate,    side: 'end', x: 44, top: 90, size: 3.6, rot: -3,  delay: 100 },
    { C: FlatSlip,     side: 'end', x: 70, top: 97, size: 6.0, rot: 6,   delay: 80 },
  ]

  return (
    <div className="landing" ref={rootRef as React.RefObject<HTMLDivElement>}>
      <header className="landing-topbar">
        <div className="landing-topbar-inner">
          <a className="landing-brand" href="/">
            <img src={logoMarkUrl} alt="" width="28" height="28" />
            <Wordmark />
          </a>
          <nav className="landing-nav" aria-label="احراز هویت">
            <Link className="landing-nav-link" to="/login">
              ورود
            </Link>
            <Button asChild size="sm" variant="primary">
              <Link to="/register">ثبتنام</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <span className="landing-badge">
            <Warehouse size={13} aria-hidden />
            سیستم مدیریت انبارداری
          </span>
          <h1>مدیریت هوشمند کالا و انبار</h1>
          <p className="landing-sub">
            کالاابر به شما کمک می‌کند موجودی کالاها را دقیق پیگیری کنید، گردش
            مجوزهای خرید و فروش را سامان دهید و از وضعیت انبار خود در هر لحظه
            گزارش بگیرید — ساده، سریع و کاملاً فارسی.
          </p>
          <div className="landing-hero-cta">
            <Button asChild variant="primary" size="lg">
              <Link to="/register">شروع کنید</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/login">ورود به سیستم</Link>
            </Button>
          </div>
        </div>

        {/* Decorative warehouse crates — a dense corner-to-corner scatter
            absolutely positioned across the hero's full side zones, behind
            the text, ignored by AT. Each box is placed via CSS custom props
            (--decor-x for horizontal spread, --decor-top, --decor-size,
            --decor-rot, --decor-delay). */}
        <div className="landing-hero-decor" aria-hidden>
          {deco.map(({ C, side, x, top, size, rot, delay }, i) => (
            <span
              key={i}
              className="landing-decor-item"
              data-side={side}
              style={
                {
                  '--decor-x': `${x}%`,
                  '--decor-top': `${top}%`,
                  '--decor-size': `${size}vw`,
                  '--decor-rot': `${rot}deg`,
                  '--decor-delay': `${delay}ms`,
                } as React.CSSProperties
              }
            >
              <C />
            </span>
          ))}
        </div>
      </section>

      <section className="landing-features">
        <h2>چرا کالاابر؟</h2>
        <div className="feature-grid">
          {FEATURES.map(({ title, desc, Icon }, i) => (
            <article
              key={title}
              className="feature-card reveal"
              style={{ '--reveal-delay': `${i * 60}ms` } as React.CSSProperties}
            >
              <span className="feature-icon" aria-hidden>
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span>© ۱۴۰۵ کالاابر — مدیریت انبارداری</span>
        </div>
      </footer>
    </div>
  )
}