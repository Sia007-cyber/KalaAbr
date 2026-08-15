/* =============================================================
   Sidebar — collapsible grouped navigation with badge slots.
   RTL: fixed on the inline-start (right in RTL). Collapsed → glyph-only.
   ============================================================= */

import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Boxes,
  FileStack,
  Package,
  Warehouse,
  Tags,
  Wallet,
  BarChart3,
  Users,
  Settings,
  Search,
  ChevronsLeft,
  ChevronsRight,
  type LucideIcon,
} from 'lucide-react'
import { usePermits, useItems } from '../../lib/hooks'
import { faDigits } from '../../lib/format'
import { Wordmark } from '../brand/Wordmark'
import logoUrl from '../../assets/logo-mark.svg'

interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
  key?: string
}

/** Pure navigation config — badge numbers are derived at render time
 *  inside the Sidebar component (hooks cannot run at module scope). */
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'عملیات',
    items: [
      { to: '/dashboard', label: 'داشبورد', Icon: LayoutDashboard, key: 'g' },
      { to: '/inventory', label: 'موجودی', Icon: Boxes, key: 'i' },
      { to: '/permits', label: 'مجوزها و حرکات', Icon: FileStack, key: 'p' },
    ],
  },
  {
    title: 'دادهٔ پایه',
    items: [
      { to: '/items', label: 'کالاها', Icon: Package, key: 'k' },
      { to: '/warehouses', label: 'انبارها', Icon: Warehouse, key: 'w' },
      { to: '/categories', label: 'دستهبندیها', Icon: Tags },
    ],
  },
  {
    title: 'نظارت',
    items: [
      { to: '/cash', label: 'حساب نقدی', Icon: Wallet },
      { to: '/reports', label: 'گزارشها', Icon: BarChart3 },
      { to: '/users', label: 'کاربران', Icon: Users },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const nav = useNavigate()
  const items = useItems()
  const permits = usePermits()

  /** low-stock count — attention badge on «موجودی» */
  const lowStock = () => {
    const list = items.data
    if (!list?.length) return 0
    return list.filter((i) => i.availableStock < 2).length
  }

  /** pending ISSUED count — attention badge on «مجوزها» */
  const pendingPermits = () => {
    const list = permits.data
    if (!list?.length) return 0
    return list.filter((p) => p.status === 'ISSUED').length
  }

  const focusPalette = () => {
    window.dispatchEvent(new CustomEvent('kalaabr:open-palette'))
  }

  const badgeFor = (item: NavItem): number => {
    if (item.to === '/inventory') return lowStock()
    if (item.to === '/permits') return pendingPermits()
    return 0
  }

  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <button
          type="button"
          className="sidebar-logo"
          onClick={() => nav('/dashboard')}
          aria-label="کالاابر — صفحه اصلی"
        >
          <span className="sidebar-logo-mark" aria-hidden>
            <img src={logoUrl} alt="" width="18" height="18" />
          </span>
          {!collapsed && (
            <Wordmark className="sidebar-logo-text" />
          )}
        </button>
        {!collapsed && (
          <button
            type="button"
            className="sidebar-palette-btn"
            onClick={focusPalette}
            aria-label="جستجوی سریع (⌘K)"
          >
            <Search size={14} aria-hidden />
            <span>جستجو…</span>
            <kbd>⌘K</kbd>
          </button>
        )}
      </div>

      <div className="sidebar-toggle">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'باز کردن نوار کناری' : 'بستن نوار کناری'}
          title={collapsed ? 'باز کردن' : 'بستن'}
          className="sidebar-toggle-btn"
        >
          {collapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="ناوبری اصلی">
        {NAV_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.title}>
            {!collapsed && <div className="sidebar-group-title">{group.title}</div>}
            <ul>
              {group.items.map((item) => {
                const badge = badgeFor(item)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `sidebar-link${isActive ? ' is-active' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.Icon size={17} strokeWidth={1.8} aria-hidden />
                      {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
                      {!collapsed && badge > 0 && (
                        <span className="sidebar-badge">{faDigits(badge)}</span>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link${isActive ? ' is-active' : ''}`
          }
          title={collapsed ? 'تنظیمات' : undefined}
        >
          <Settings size={17} strokeWidth={1.8} aria-hidden />
          {!collapsed && <span className="sidebar-link-label">تنظیمات</span>}
        </NavLink>
      </div>
    </aside>
  )
}