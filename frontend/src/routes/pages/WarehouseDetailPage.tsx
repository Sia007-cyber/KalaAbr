/* =============================================================
   Warehouse detail — one warehouse: identity + capacity, the live
   stock picture of everything stored in it, and the item list with
   per-item live numbers.
   -------------------------------------------------------------
   All stock figures come from /api/items (which recomputes live
   incoming/reserved from ISSUED permits on every read) and /api/permits,
   so the numbers always agree with the item detail pages.
     on-hand   = sum of confirmed stock across the warehouse's items
     incoming  = qty committed via ISSUED purchases (not yet arrived)
     reserved  = qty promised via ISSUED sales (not yet shipped)
     available = on-hand − reserved
   ============================================================= */

import { Link, useParams } from 'react-router-dom'
import { Warehouse as WarehouseIcon } from 'lucide-react'

import { PageHeader } from '../../components/layout/AppLayout'
import { StockAlertChip } from '../../components/ui/chips'
import { Button } from '../../components/ui/button'
import { useItems, usePermits, useWarehouse } from '../../lib/hooks'
import { faDigits, faNumber } from '../../lib/format'
import type { Item, Permit, Warehouse } from '../../types/api'
import './warehouse-detail.css'

export function WarehouseDetailPage() {
  const { id } = useParams()
  const warehouseId = Number(id)
  const { data: warehouse, isPending, isError } = useWarehouse(warehouseId)

  if (isPending) {
    return (
      <>
        <PageHeader title="…" />
        <div aria-busy className="card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 40, marginBottom: 10 }} />
          ))}
        </div>
      </>
    )
  }

  if (isError || !warehouse) {
    return <NotFound />
  }

  return <WarehouseBody warehouse={warehouse} />
}

/* ---------------- body ---------------- */

function WarehouseBody({ warehouse }: { warehouse: Warehouse }) {
  const items = useItems({ warehouseId: warehouse.id })
  const permits = usePermits()

  const rows = (items.data ?? [])
    .filter((i) => i.warehouseId === warehouse.id)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'fa'))

  const onHand = rows.reduce((s, i) => s + i.quantityOnHand, 0)
  const incoming = rows.reduce((s, i) => s + i.incomingStock, 0)
  const reserved = rows.reduce((s, i) => s + i.reservedStock, 0)
  const available = rows.reduce((s, i) => s + i.availableStock, 0)

  const capacity = warehouse.capacity
  const pct = capacity != null && capacity > 0
    ? Math.min(100, Math.round(((onHand + reserved) / capacity) * 100))
    : null
  const headroom = capacity != null ? Math.max(0, capacity - onHand - reserved) : 0
  const idleIncoming = Math.max(0, incoming - headroom)

  /* movement on this warehouse's permits: arrivals = confirmed purchases,
     outflows = confirmed sales (whole-permit qty — a permit lives in one
     warehouse, so the totals here are exact). */
  const activity = (permits.data ?? [])
    .filter((p) => p.warehouseId === warehouse.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const rowTotal = (p: Permit): number =>
    p.lines.reduce((s, l) => s + l.quantity, 0)
  const arrived = activity
    .filter((p) => p.permitType === 'PURCHASE' && p.status === 'CONFIRMED')
    .reduce((s, p) => s + rowTotal(p), 0)
  const shipped = activity
    .filter((p) => p.permitType === 'SALE' && p.status === 'CONFIRMED')
    .reduce((s, p) => s + rowTotal(p), 0)

  const lowCount = rows.filter((i) => i.availableStock < 2).length

  const footnote =
    arrived === 0 && shipped === 0
      ? `هماکنون ${faDigits(onHand)} واحد کالا در این انبار است — هنوز خرید یا فروش تأییدشدهای برای آن ثبت نشده است.`
      : arrived === 0
        ? `${faDigits(onHand)} واحد موجودی فعلی است؛ ${faDigits(shipped)} واحد از موجودی اولیه فروش رفته است.`
        : `${faDigits(arrived)} واحد خرید تأییدشده و ${faDigits(shipped)} واحد فروش تأییدشده در این انبار ثبت شده است؛ ${faDigits(onHand)} واحد موجودی فعلی است.`

  return (
    <>
      <PageHeader
        title={warehouse.name}
        subtitle={warehouse.address ?? '—'}
        breadcrumb={
          <>
            <h1 className="page-title">{warehouse.name}</h1>
            <p className="page-subtitle">انبار #{faDigits(warehouse.id)}</p>
          </>
        }
      />

      {/* identity + capacity strip */}
      <div className="card whd-meta">
        <MetaItem label="آدرس">{warehouse.address ?? '—'}</MetaItem>
        <MetaItem label="سقف ظرفیت">
          {capacity != null ? <>{faDigits(capacity)} واحد</> : 'ثبت نشده'}
        </MetaItem>
        <MetaItem label="موجود اشغالشده">{faDigits(onHand)} واحد</MetaItem>
        <MetaItem label="استفاده">
          {pct != null ? <>{faDigits(pct)}٪</> : '—'}
        </MetaItem>
      </div>

      {/* capacity context */}
      {capacity != null && capacity > 0 && (
        <div className="card whd-cap">
          <div className="whd-cap-head">
            <span className="whd-cap-label">ظرفیت انبار</span>
            <span className="whd-cap-num num">
              {faDigits(onHand + reserved + incoming)} / {faDigits(capacity)} واحد
            </span>
          </div>
          <div className="util-bar whd-cap-bar">
            <div className="util-fill whd-cap-fill" style={{ width: `${pct}%` }} />
          </div>
          {incoming > 0 && (
            <ul className="whd-cap-lines">
              <li>
                <span className="dot is-pos" />
                جا برای در راه: {faDigits(headroom)} واحد
              </li>
              {idleIncoming > 0 && (
                <li>
                  <span className="dot is-warn" />
                  مازاد بر ظرفیت (در راه): {faDigits(idleIncoming)} واحد
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* stock summary — aggregated across this warehouse's items */}
      <div className="whd-stock">
        <StockCell
          kind="onhand"
          value={onHand}
          label="موجود پایه"
          hint="مجموع موجودی واقعی کالاهای انبار"
        />
        <StockCell
          kind="incoming"
          value={incoming}
          label="در راه"
          hint="خریدهای صادرشده، هنوز نرسیده"
        />
        <StockCell
          kind="reserved"
          value={reserved}
          label="رزرو"
          hint="فروشهای صادرشده، در انتظار تأیید"
        />
        <StockCell
          kind="available"
          value={available}
          label="قابل فروش"
          hint="موجود پایه منهای رزرو"
        />
      </div>

      {/* item list */}
      <div className="card whd-items">
        <div className="dash-panel-head">
          <h2>کالاهای این انبار</h2>
          {lowCount > 0 && (
            <span className="whd-lowcount">{faDigits(lowCount)} کالای کمموجود</span>
          )}
        </div>
        {items.isPending ? (
          <div aria-busy>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="dash-empty">هنوز کالایی در این انبار ثبت نشده است.</div>
        ) : (
          <table className="table whd-table">
            <thead>
              <tr>
                <th>کالا</th>
                <th>دستهبندی</th>
                <th className="t-num">موجود پایه</th>
                <th className="t-num">در راه</th>
                <th className="t-num">رزرو</th>
                <th className="t-num">قابل فروش</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="whd-footnote">{footnote}</p>
    </>
  )
}

function ItemRow({ item }: { item: Item }) {
  const low = item.availableStock < 2
  return (
    <tr>
      <td>
        <Link className="cell-primary" to={`/items/${item.id}`}>
          {item.name}
        </Link>
        {low && <StockAlertChip available={item.availableStock} />}
      </td>
      <td>{item.categoryName ?? '—'}</td>
      <td className="t-num cell-onhand">{faDigits(item.quantityOnHand)}</td>
      <td className="t-num cell-incoming">{faDigits(item.incomingStock)}</td>
      <td className="t-num cell-reserved">{faDigits(item.reservedStock)}</td>
      <td className="t-num cell-available">{faDigits(item.availableStock)}</td>
    </tr>
  )
}

/* ---------------- sub-components ---------------- */

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="whd-meta-item">
      <span className="whd-meta-label">{label}</span>
      <span className="whd-meta-value">{children}</span>
    </div>
  )
}

function StockCell({
  kind,
  value,
  label,
  hint,
}: {
  kind: 'onhand' | 'incoming' | 'reserved' | 'available'
  value: number
  label: string
  hint: string
}) {
  return (
    <div className={`whd-cell is-${kind}`}>
      <span className="whd-cell-label">{label}</span>
      <span className="whd-cell-value num">{faNumber(value)}</span>
      <span className="whd-cell-hint">{hint}</span>
    </div>
  )
}

function NotFound() {
  return (
    <>
      <PageHeader title="انبار پیدا نشد" />
      <div className="card empty whd-missing">
        <WarehouseIcon size={28} className="empty-icon" aria-hidden />
        <p>انبار موردنظر وجود ندارد یا حذف شده است.</p>
        <Button asChild variant="primary">
          <Link to="/warehouses">بازگشت به انبارها</Link>
        </Button>
      </div>
    </>
  )
}
