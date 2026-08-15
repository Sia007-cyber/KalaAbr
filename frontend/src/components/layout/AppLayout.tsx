/* =============================================================
   AppLayout — shell: collapsible sidebar + topbar header with
   breadcrumb / filter bar / primary action slots + command palette.
   ============================================================= */

import { useEffect, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import './layout.css'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  /* ⌘K / Ctrl+K → command palette; route-driven page transition is NOT
     animated (instant internal nav keeps the tool feeling immediate). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    const onPalette = () => setPaletteOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('kalaabr:open-palette', onPalette)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('kalaabr:open-palette', onPalette)
    }
  }, [])

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="app-body">
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}

/* ---------------- PageHeader ---------------- */
/* Pages compose this at the top of their own content so the title,
   filter bar, and primary action slot live with the page that owns
   them. Persistent chrome (sidebar, global modals) stays in the shell. */

interface PageHeaderProps {
  title?: string
  subtitle?: string
  breadcrumb?: ReactNode
  /** contextual filter bar, rendered inline before actions */
  filters?: ReactNode
  /** primary action slot — inline-end of the content area */
  actions?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  filters,
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-start">
        <div className="page-header-titles">
          {breadcrumb ? (
            breadcrumb
          ) : (
            <>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </>
          )}
        </div>
        {filters && <div className="page-filters">{filters}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}