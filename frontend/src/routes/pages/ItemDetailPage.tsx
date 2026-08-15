/* =============================================================
   Item detail — one item: identity, live stock breakdown, capacity
   context, and the permit history touching this item.
   -------------------------------------------------------------
   Live stock (backend, never persisted) is recomputed on every read
   from ISSUED permits, so the page is always a real-time snapshot:
     on-hand  — confirmed stock, only moved by CONFIRMED permits
     incoming — qty committed via ISSUED purchases (not yet arrived)
     reserved — qty promised via ISSUED sales (not yet shipped)
     available = on-hand − reserved
   Permit history is derived client-side from the permits list.
   ============================================================= */

import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

import { PageHeader } from '../../components/layout/AppLayout'
import { DirectionChip, StatusChip, StockAlertChip } from '../../components/ui/chips'
import { Button } from '../../components/ui/button'
import { useItem, usePermits, useWarehouse } from '../../lib/hooks'
import { faDateTime, faDigits } from '../../lib/format'
import type { Item, Permit } from '../../types/api'
import './item-detail.css'

export function ItemDetailPage() {
  const { id } = useParams()
  const itemId = Number(id)
  const { data: item, isPending, isError } = useItem(itemId)

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

  if (isError || !item) {
    return <NotFound />
  }

  return <ItemBody item={item} />
}

/* ---------------- body ---------------- */

function ItemBody({ item }: { item: Item }) {
  const { id, name } = item

  /* live warehouse for capacity context (exposure isn't in the Item DTO) */
  const wh = useWarehouse(item.warehouseId ?? 0)
  const permits = usePermits()

  const warehouse = wh.data ?? null
  const capacity = warehouse?.capacity ?? null

  const available = item.availableStock
  const onHand = item.quantityOnHand
  const incoming = item.incomingStock
  const reserved = item.reservedStock
  const idleIncoming = Math.max(0, incoming - (capacity != null ? Math.max(0, capacity - onHand - reserved) : 0))

  /* ÷ this item's own qty in a permit → "row total". Clamp to whole
     rows in-case the backend ever merges duplicate lines for an item. */
  const rowTotal = (p: Permit): number =>
    p.lines
      .filter((l) => l.itemId === id)
      .reduce((s, l) => s + l.quantity, 0)

  const activity = (permits.data ?? [])
    .filter((p) => p.lines.some((l) => l.itemId === id))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  /* quantity flows: arrivals = confirmed purchases, outflows =
     confirmed sales; incoming/reserved are already committed. */
  const arrived = activity
    .filter((p) => p.permitType === 'PURCHASE' && p.status === 'CONFIRMED')
    .reduce((s, p) => s + rowTotal(p), 0)
  const shipped = activity
    .filter((p) => p.permitType === 'SALE' && p.status === 'CONFIRMED')
    .reduce((s, p) => s + rowTotal(p), 0)

  /* lowest historical stock = on-hand − (arrivals yet to unwind the
     initial hand-count → tracked by the real activity below). When a
     retired item has no confirmed permits, project from on-hand. */
  const hitLow = available < 2

  const footnote =
    arrived === 0 && shipped === 0
      ? `موجودی پایهٔ فعلی ${faDigits(onHand)} واحد است — هنوز خرید یا فروش تأییدشدهای ثبت نشده است.`
      : arrived === 0
        ? `${faDigits(onHand)} واحد موجودی پایهٔ فعلی است؛ ${faDigits(shipped)} واحد از موجودی اولیه فروش رفته است.`
        : `${faDigits(arrived)} واحد خرید تأییدشده و ${faDigits(shipped)} واحد فروش تأییدشده ثبت شده است؛ ${faDigits(onHand)} واحد موجودی پایهٔ فعلی است.`

  return (
    <>
      <PageHeader
        title={name}
        subtitle={item.unitOfMeasure}
        breadcrumb={
          <>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {name}
              {hitLow && <StockAlertChip available={available} />}
            </h1>
            <p className="page-subtitle">
              کالا #{faDigits(id)} · {item.warehouseName ?? '—'}
            </p>
          </>
        }
      />

      {/* identity strip */}
      <div className="card itd-meta">
        <MetaItem label="دستهبندی">{item.categoryName ?? '—'}</MetaItem>
        <MetaItem label="کد کالا">#{faDigits(id)}</MetaItem>
        <MetaItem label="انبار">
          {item.warehouseId != null ? (
            <Link className="itd-link" to={`/warehouses/${item.warehouseId}`}>
              {item.warehouseName}
            </Link>
          ) : (
            '—'
          )}
        </MetaItem>
        <MetaItem label="واحد شمارش">{item.unitOfMeasure}</MetaItem>
      </div>

      {/* live stock */}
      <div className="itd-stock">
        <StockCell
          kind="onhand"
          value={onHand}
          label={`موجود پایه (${item.unitOfMeasure})`}
          hint="فقط مجوزهای تأییدشده آن را تغییر میدهند"
        />
        <StockCell
          kind="incoming"
          value={incoming}
          label={`در راه (${item.unitOfMeasure})`}
          hint="خرید صادرشده، هنوز نرسیده"
        />
        <StockCell
          kind="reserved"
          value={reserved}
          label={`رزرو (${item.unitOfMeasure})`}
          hint="فروش صادرشده، در انتظار تأیید"
        />
        <StockCell
          kind="available"
          value={available}
          label={`قابل فروش (${item.unitOfMeasure})`}
          hint="موجود پایه منهای رزرو"
        />
      </div>

      {/* ledger detail + capacity context */}
      <div className="dash-row">
        <div className="card dash-panel">
          <div className="dash-panel-head">
            <h2>نحوهٔ محاسبه موجودی</h2>
          </div>
          <div className="itd-ledger">
            <LedgerRow label="موجود پایه" value={onHand} accent />
            <LedgerRow label="رزرو فروش (ISSUED)" value={reserved} neg={reserved > 0} />
            <LedgerRow label="در راه (ISSUED خرید)" value={incoming} pos={incoming > 0} />
            <LedgerRow label="واردشده (تأیید خرید)" value={arrived} pos={arrived > 0} />
            <LedgerRow label="صادرشده (تأیید فروش)" value={shipped} neg={shipped > 0} />
            <LedgerRow label="قابل فروش" value={available} accent />
          </div>
        </div>

        <div className="card dash-panel">
          <div className="dash-panel-head">
            <h2>ظرفیت انبار</h2>
          </div>
          {capacity == null ? (
            <div className="dash-empty">برای این انبار سقف ظرفیتی ثبت نشده است.</div>
          ) : (
            <>
              <div className="itd-cap-head">
                <span className="itd-cap-name">{warehouse?.name}</span>
                <span className="itd-cap-num num">
                  {faDigits(onHand + reserved + incoming)} / {faDigits(capacity)}
                </span>
              </div>
              <div className="itd-cap-bar">
                <div className="itd-cap-fill" style={{ width: `${Math.min(100, Math.round(((onHand + reserved + incoming) / capacity) * 100))}%` }} />
              </div>

              {/* incoming that still fits the headroom vs. what overflows it */}
              {incoming > 0 && (
                <ul className="itd-cap-lines">
                  <li>
                    <span className="dot is-pos" />
                    جا برای در راه: {faDigits(Math.max(0, capacity - onHand - reserved))} واحد
                  </li>
                  {idleIncoming > 0 && (
                    <li>
                      <span className="dot is-warn" />
                      مازاد بر ظرفیت (در راه): {faDigits(idleIncoming)} واحد
                    </li>
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* permit history */}
      <div className="card itd-activity">
        <div className="dash-panel-head">
          <h2>حرکات این کالا</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/permits">همه مجوزها</Link>
          </Button>
        </div>
        {permits.isPending ? (
          <div aria-busy>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="dash-empty">هنوز مجوزی برای این کالا صادر نشده است.</div>
        ) : (
          <table className="table itd-table">
            <thead>
              <tr>
                <th>#</th>
                <th>نوع</th>
                <th>مقدار</th>
                <th>وضعیت</th>
                <th className="t-num">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((p) => {
                const isPurchase = p.permitType === 'PURCHASE'
                const cancelled = p.status === 'CANCELLED'
                return (
                  <tr key={p.id}>
                    <td>
                      <Link className="cell-primary itd-id" to={`/permits/${p.id}`}>
                        #{faDigits(p.id)}
                      </Link>
                    </td>
                    <td>
                      <DirectionChip type={p.permitType} />
                    </td>
                    <td className={`t-num ${cancelled ? 'itd-qty-muted' : isPurchase ? 'itd-qty-in' : 'itd-qty-out'}`}>
                      {isPurchase
                        ? <ArrowDownToLine size={13} aria-hidden />
                        : <ArrowUpFromLine size={13} aria-hidden />}
                      {faDigits(rowTotal(p))}
                    </td>
                    <td>
                      <StatusChip status={p.status} />
                    </td>
                    <td className="t-num itd-date">{faDateTime(p.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="itd-footnote">{footnote}</p>
    </>
  )
}

/* ---------------- sub-components ---------------- */

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="itd-meta-item">
      <span className="itd-meta-label">{label}</span>
      <span className="itd-meta-value">{children}</span>
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
  const cls = `itd-cell is-${kind}${kind === 'available' && value < 2 ? ' is-low' : ''}`
  return (
    <div className={cls}>
      <span className="itd-cell-label">{label}</span>
      <span className="itd-cell-value num">{faDigits(value)}</span>
      <span className="itd-cell-hint">{hint}</span>
    </div>
  )
}

function LedgerRow({
  label,
  value,
  pos,
  neg,
  accent,
}: {
  label: string
  value: number
  pos?: boolean
  neg?: boolean
  accent?: boolean
}) {
  const cls = accent ? 'itd-led-row is-accent' : pos ? 'itd-led-row is-pos' : neg ? 'itd-led-row is-neg' : 'itd-led-row'
  return (
    <div className={cls}>
      <span>{label}</span>
      <strong>{faDigits(value)}</strong>
    </div>
  )
}

function NotFound() {
  return (
    <>
      <PageHeader title="کالا پیدا نشد" />
      <div className="card empty itd-missing">
        <AlertTriangle size={28} className="empty-icon" aria-hidden />
        <p>کالای موردنظر وجود ندارد یا حذف شده است.</p>
        <Button asChild variant="primary">
          <Link to="/items">بازگشت به کالاها</Link>
        </Button>
      </div>
    </>
  )
}