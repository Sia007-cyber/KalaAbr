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
  OpenCrate,
  SealedBox,
  Parcel,
  LooseBox,
} from '../../components/brand/box-decor'
import { useIsAuthenticated } from '../../lib/hooks'
import logoUrl from '../../assets/logo.svg'
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

  return (
    <div className="landing" ref={rootRef as React.RefObject<HTMLDivElement>}>
      <header className="landing-topbar">
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
      </header>

      <section className="landing-hero">
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
        <div className="landing-hero-mark">
          <img src={logoUrl} alt="کالاابر" height={96} />
        </div>

        {/* Decorative warehouse crates — absolutely positioned in the
            hero's side gutters, behind the text, ignored by AT. */}
        <div className="landing-hero-decor" aria-hidden>
          <span
            className="landing-decor-item"
            style={{ '--decor-delay': '0ms' } as React.CSSProperties}
          >
            <OpenCrate />
          </span>
          <span
            className="landing-decor-item"
            style={{ '--decor-delay': '140ms' } as React.CSSProperties}
          >
            <Parcel />
          </span>
          <span
            className="landing-decor-item"
            style={{ '--decor-delay': '280ms' } as React.CSSProperties}
          >
            <LooseBox />
          </span>
          <span
            className="landing-decor-item"
            style={{ '--decor-delay': '90ms' } as React.CSSProperties}
          >
            <SealedBox />
          </span>
          <span
            className="landing-decor-item"
            style={{ '--decor-delay': '220ms' } as React.CSSProperties}
          >
            <LooseBox />
          </span>
          <span
            className="landing-decor-item"
            style={{ '--decor-delay': '340ms' } as React.CSSProperties}
          >
            <Parcel />
          </span>
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