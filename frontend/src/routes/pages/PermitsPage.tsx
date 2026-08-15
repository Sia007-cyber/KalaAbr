/* =============================================================
   Permits — the chronological ledger. Filter by type/status.
   ============================================================= */

import { useState } from 'react'
import { PageHeader } from '../../components/layout/AppLayout'
import { usePermits, useWarehouses } from '../../lib/hooks'
import {
  faDateLong,
  faDigits,
  faMoneyCompact,
  faRelative,
} from '../../lib/format'
import { StatusChip, DirectionChip } from '../../components/ui/chips'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, FileStack } from 'lucide-react'
import type { PermitStatus, PermitType } from '../../types/api'
import './permits.css'

type StatusFilter = 'ALL' | PermitStatus
type TypeFilter = 'ALL' | PermitType

const STATUS_GROUP: StatusFilter[] = ['ALL', 'ISSUED', 'CONFIRMED', 'CANCELLED']
const TYPE_GROUP: TypeFilter[] = ['ALL', 'PURCHASE', 'SALE']

export function PermitsPage() {
  const permits = usePermits()
  const warehouses = useWarehouses()
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [type, setType] = useState<TypeFilter>('ALL')
  const [wh, setWh] = useState<number | 'ALL'>('ALL')

  const rows = (permits.data ?? [])
    .filter((p) => (status === 'ALL' ? true : p.status === status))
    .filter((p) => (type === 'ALL' ? true : p.permitType === type))
    .filter((p) => (wh === 'ALL' ? true : p.warehouseId === wh))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  return (
    <>
      <PageHeader
        title="مجوزها و حرکات"
        subtitle="دفتر هفتگی ورود و خروج کالا"
        filters={
          <>
            <FilterTabs value={status} onChange={setStatus} options={STATUS_GROUP} />
            <FilterTabs value={type} onChange={setType} options={TYPE_GROUP} />
            <select
              className="select wh-select"
              value={wh}
              onChange={(e) =>
                setWh(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              aria-label="فیلتر انبار"
            >
              <option value="ALL">همه انبارها</option>
              {(warehouses.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </>
        }
        actions={
          <>
            <Button asChild variant="secondary">
              <Link to="/permits/new?type=sale">
                <ArrowUpFromLine size={15} aria-hidden />
                مجوز فروش
              </Link>
            </Button>
            <Button asChild variant="primary">
              <Link to="/permits/new?type=purchase">
                <ArrowDownToLine size={15} aria-hidden />
                مجوز خرید
              </Link>
            </Button>
          </>
        }
      />

      <div className="card permits-card">
        {permits.isPending ? (
          <div aria-busy style={{ padding: 'var(--space-4)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <FileStack size={28} className="empty-icon" aria-hidden />
            <p>مجوزی مطابق فیلترها یافت نشد.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>نوع</th>
                <th>کالاها</th>
                <th className="t-num">مبلغ کل</th>
                <th>انبار</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="t-num perm-id">{faDigits(p.id)}</td>
                  <td>
                    <DirectionChip type={p.permitType} />
                  </td>
                  <td>
                    <Link className="cell-primary" to={`/permits/${p.id}`}>
                      {p.lines.slice(0, 2).map((l) => l.itemName).join('، ')}
                    </Link>
                  </td>
                  <td className="t-num perm-amount">{faMoneyCompact(p.totalAmount)}</td>
                  <td>{p.warehouseName}</td>
                  <td>
                    <StatusChip status={p.status} />
                  </td>
                  <td className="perm-date">
                    <span>{faDateLong(p.createdAt)}</span>
                    <span className="cell-sub">{faRelative(p.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/* ---------- filter tab strip ---------- */
function FilterTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: readonly T[]
}) {
  const label = (o: string) => {
    switch (o) {
      case 'ALL': return 'همه'
      case 'ISSUED': return 'صادرشده'
      case 'CONFIRMED': return 'تأییدشده'
      case 'CANCELLED': return 'لغوشده'
      case 'PURCHASE': return 'خرید'
      case 'SALE': return 'فروش'
      default: return o
    }
  }
  return (
    <div className="filter-tabs" role="tablist" aria-label="فیلتر">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={value === o}
          className={`filter-tab${value === o ? ' is-active' : ''}`}
          onClick={() => onChange(o)}
        >
          {label(o)}
        </button>
      ))}
    </div>
  )
}