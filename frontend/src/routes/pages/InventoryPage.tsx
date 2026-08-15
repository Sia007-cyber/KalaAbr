/* =============================================================
   Inventory — layered stock projection (on hand / incoming / reserved
   / available). Read-only; mutations happen through permits.
   Filtered to low-stock when ?low=1.
   ============================================================= */

import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/AppLayout'
import { useItems } from '../../lib/hooks'
import { faDigits } from '../../lib/format'
import { Button } from '../../components/ui/button'
import { StockAlertChip } from '../../components/ui/chips'
import { Link } from 'react-router-dom'
import { Boxes } from 'lucide-react'
import './inventory.css'

export function InventoryPage() {
  const [params] = useSearchParams()
  const lowOnly = params.get('low') === '1'
  const items = useItems()

  const rows = (items.data ?? [])
    .filter((i) => (lowOnly ? i.availableStock < 2 : true))
    .sort((a, b) => a.name.localeCompare(b.name, 'fa'))

  return (
    <>
      <PageHeader
        title="موجودی"
        subtitle="موجودی لایهبندیشده — قابل فروش همیشه از مجوزهای صادرشده محاسبه میشود"
        filters={
          <Link to={lowOnly ? '/inventory' : '/inventory?low=1'}>
            <Button variant={lowOnly ? 'secondary' : 'ghost'} size="sm">
              فقط کمموجود
            </Button>
          </Link>
        }
        actions={
          <Button asChild variant="primary">
            <Link to="/permits/new?type=purchase">ثبت ورود کالا</Link>
          </Button>
        }
      />

      <div className="card inventory-card">
        {items.isPending ? (
          <div aria-busy style={{ padding: 'var(--space-4)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <Boxes size={28} className="empty-icon" aria-hidden />
            <p>{lowOnly ? 'کالای کمموجودی نیست.' : 'هنوز کالایی ثبت نشده است.'}</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>کالا</th>
                <th className="t-num">انبار</th>
                <th className="t-num">موجود</th>
                <th className="t-num">رسید در راه</th>
                <th className="t-num">رزروشده</th>
                <th className="t-num">قابل فروش</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link className="cell-primary" to={`/items/${i.id}`}>
                      {i.name}
                    </Link>
                    <span className="cell-sub">{i.unitOfMeasure}</span>
                  </td>
                  <td className="t-num">{i.warehouseName}</td>
                  <td className="t-num cell-onhand">{faDigits(i.quantityOnHand)}</td>
                  <td className="t-num cell-incoming">{faDigits(i.incomingStock)}</td>
                  <td className="t-num cell-reserved">{faDigits(i.reservedStock)}</td>
                  <td className="t-num cell-available">{faDigits(i.availableStock)}</td>
                  <td>{i.availableStock < 2 && <StockAlertChip available={i.availableStock} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}