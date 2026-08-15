/* =============================================================
   Dashboard — «what needs my attention right now».
   KPI cards + cash strip + needs-attention + activity + capacity.
   ============================================================= */

import { PageHeader } from '../../components/layout/AppLayout'
import {
  useCash,
  useItems,
  usePermits,
  useWarehouses,
  useConfirmPurchase,
  useConfirmSale,
  useCancelPermit,
} from '../../lib/hooks'
import { faDateTime, faDigits, faMoneyCompact, faRelative } from '../../lib/format'
import { StatusChip, DirectionChip } from '../../components/ui/chips'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Check, X } from 'lucide-react'
import { useState } from 'react'
import type { Permit } from '../../types/api'
import './dashboard.css'

export function DashboardPage() {
  const cash = useCash()
  const items = useItems()
  const permits = usePermits()
  const warehouses = useWarehouses()

  const pending = (permits.data ?? []).filter((p) => p.status === 'ISSUED')
  const lowStock = (items.data ?? []).filter((i) => i.availableStock < 2)
  const recent = [...(permits.data ?? [])]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 12)

  /* cash side projection from ISSUED permits */
  const issuedP = (permits.data ?? []).filter((p) => p.status === 'ISSUED')
  const committed = issuedP
    .filter((p) => p.permitType === 'PURCHASE')
    .reduce((s, p) => s + Number(p.totalAmount), 0)
  const expected = issuedP
    .filter((p) => p.permitType === 'SALE')
    .reduce((s, p) => s + Number(p.totalAmount), 0)

  const balance = Number(cash.data?.balance ?? 0)
  /** Bulk value placeholder — unit cost isn't in the API yet.
      Recomputed from confirmed permits when a cost basis exists. */
  const totalValue = (items.data ?? []).length

  const loading = permits.isPending || items.isPending || warehouses.isPending

  return (
    <>
      <PageHeader
        title="داشبورد"
        actions={
          <Button asChild variant="primary">
            <Link to="/permits/new?type=purchase">
              <ArrowDownToLine size={15} aria-hidden />
              مجوز جدید
            </Link>
          </Button>
        }
      />

      {/* KPI row */}
      <section className="kpi-grid" aria-label="نماگرهای وضعیت">
        <KpiCard
          label="اقلام موجودی"
          value={faDigits(totalValue)}
          sub="نوع کالای ثبتشده"
          link="/inventory"
        />
        <KpiCard
          label="مجوزهای معلق"
          value={faDigits(pending.length)}
          sub="در انتظار تأیید"
          link="/permits"
          accent={pending.length > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="کالاهای کمموجود"
          value={faDigits(lowStock.length)}
          sub="موجودی قابل فروش «۲» و کمتر"
          link="/inventory?low=1"
          accent={lowStock.length > 0 ? 'danger' : undefined}
        />
        <KpiCard
          label="موجودی نقدی"
          value={faMoneyCompact(balance)}
          sub={`تعهد خروجی: ${faMoneyCompact(committed)}`}
          link="/cash"
        />
      </section>

      {/* Main row */}
      <section className="dash-row">
        {/* Needs attention */}
        <div className="card dash-panel">
          <div className="dash-panel-head">
            <h2>نیاز به اقدام</h2>
          </div>
          {loading ? (
            <PanelLoading />
          ) : pending.length === 0 && lowStock.length === 0 ? (
            <div className="dash-empty">همهچیز تأیید شده — کاری نمانده است. ✓</div>
          ) : (
            <ul className="action-list">
              {pending.slice(0, 5).map((p) => (
                <IssueAction key={p.id} permit={p} />
              ))}
              {lowStock.slice(0, 3).map((i) => (
                <li key={i.id} className="action-item">
                  <span className="action-badge action-badge-warn">!</span>
                  <div className="action-body">
                    <div className="action-title">
                      کمموجود: {i.name}
                    </div>
                    <div className="action-sub">
                      {i.warehouseName} — قابل فروش {faDigits(i.availableStock)} واحد
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/inventory?low=1">مشاهده</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cash strip */}
        <div className="card dash-panel">
          <div className="dash-panel-head">
            <h2>حساب نقدی</h2>
          </div>
          <div className="cash-strip">
            <div className="cash-main">
              <div className="cash-label">موجودی</div>
              <div className="cash-value num">
                {cash.isPending ? '…' : faMoneyCompact(balance)}
              </div>
            </div>
            <div className="cash-line">
              <span className="cash-line-label">تعهد خرید (برداشتشده)</span>
              <span className="num cash-neg">{faMoneyCompact(-committed)}</span>
            </div>
            <div className="cash-line">
              <span className="cash-line-label">فروش معلق (واریز در انتظار)</span>
              <span className="num cash-pos">+{faMoneyCompact(expected)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Activity + capacity */}
      <section className="dash-row">
        <div className="card dash-panel">
          <div className="dash-panel-head">
            <h2>آخرین حرکات</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/permits">همه</Link>
            </Button>
          </div>
          {loading ? (
            <PanelLoading />
          ) : recent.length === 0 ? (
            <div className="dash-empty">هنوز حرکتی ثبت نشده است.</div>
          ) : (
            <ul className="activity-list">
              {recent.map((p) => (
                <li key={p.id} className="activity-row">
                  <DirectionChip type={p.permitType} />
                  <span className="activity-id">#{faDigits(p.id)}</span>
                  <span className="activity-w">
                    {p.lines.map((l) => l.itemName).slice(0, 2).join('، ')}
                  </span>
                  <span className="activity-amount num">
                    {faMoneyCompact(p.totalAmount)}
                  </span>
                  <StatusChip status={p.status} />
                  <span className="activity-time">{faRelative(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Capacity */}
        <div className="card dash-panel">
          <div className="dash-panel-head">
            <h2>ظرفیت انبارها</h2>
          </div>
          {warehouses.isPending ? (
            <PanelLoading />
          ) : (warehouses.data ?? []).length === 0 ? (
            <div className="dash-empty">هنوز انباری ثبت نشده است.</div>
          ) : (
            <ul className="capacity-list">
              {(warehouses.data ?? []).map((w) => {
                const uses = (items.data ?? [])
                  .filter((i) => i.warehouseId === w.id)
                  .reduce((s, i) => s + i.quantityOnHand, 0)
                const cap = w.capacity ?? 0
                const pct = cap > 0 ? Math.min(100, Math.round((uses / cap) * 100)) : 0
                return (
                  <li key={w.id} className="capacity-row">
                    <div className="capacity-head">
                      <span className="capacity-name">{w.name}</span>
                      <span className="capacity-num num">
                        {faDigits(pct)}٪
                      </span>
                    </div>
                    <div className="capacity-bar">
                      <div
                        className="capacity-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}

/* ---------- sub-components ---------- */

function KpiCard({
  label,
  value,
  sub,
  link,
  accent,
}: {
  label: string
  value: string
  sub?: string
  link: string
  accent?: 'warning' | 'danger'
}) {
  return (
    <Link to={link} className={`card kpi-card${accent ? ` kpi-${accent}` : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value num">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </Link>
  )
}

function IssueAction({ permit }: { permit: Permit }) {
  const confirmP = useConfirmPurchase()
  const confirmS = useConfirmSale()
  const cancel = useCancelPermit()
  const [busy, setBusy] = useState<'none' | 'confirm' | 'cancel'>('none')

  const isPurchase = permit.permitType === 'PURCHASE'

  const doConfirm = async () => {
    setBusy('confirm')
    try {
      if (isPurchase) await confirmP.mutateAsync(permit.id)
      else await confirmS.mutateAsync(permit.id)
    } finally {
      setBusy('none')
    }
  }
  const doCancel = async () => {
    setBusy('cancel')
    try {
      await cancel.mutateAsync(permit.id)
    } finally {
      setBusy('none')
    }
  }

  return (
    <li className="action-item">
      <span className={`action-badge ${isPurchase ? 'action-badge-in' : 'action-badge-out'}`}>
        {isPurchase ? <ArrowDownToLine size={12} /> : <ArrowUpFromLine size={12} />}
      </span>
      <div className="action-body">
        <div className="action-title">
          مجوز {isPurchase ? 'خرید' : 'فروش'} #{faDigits(permit.id)}
        </div>
        <div className="action-sub">
          {faMoneyCompact(permit.totalAmount)} · {permit.warehouseName} ·{' '}
          {faDateTime(permit.createdAt)}
        </div>
      </div>
      <div className="action-cta">
        <Button size="sm" variant="secondary" loading={busy === 'confirm'} onClick={doConfirm}>
          <Check size={14} aria-hidden /> تأیید
        </Button>
        <Button size="sm" variant="ghost" loading={busy === 'cancel'} onClick={doCancel}>
          <X size={14} aria-hidden /> لغو
        </Button>
      </div>
    </li>
  )
}

function PanelLoading() {
  return (
    <div className="dash-panel-skel" aria-busy>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
      ))}
    </div>
  )
}