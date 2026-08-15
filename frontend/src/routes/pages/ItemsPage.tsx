/* =============================================================
   Items — master data list with live stock in each row.
   ============================================================= */

import { PageHeader } from '../../components/layout/AppLayout'
import { useItems, useWarehouses } from '../../lib/hooks'
import { faDigits } from '../../lib/format'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { PackagePlus, Package } from 'lucide-react'

export function ItemsPage() {
  const items = useItems()
  const warehouses = useWarehouses()

  const rows = (items.data ?? []).sort((a, b) => a.name.localeCompare(b.name, 'fa'))
  const nameOf = (id: number | null) =>
    warehouses.data?.find((w) => w.id === id)?.name ?? '—'

  return (
    <>
      <PageHeader
        title="کالاها"
        actions={
          <Button asChild variant="primary">
            <Link to="/items/new">
              <PackagePlus size={15} aria-hidden /> کالای جدید
            </Link>
          </Button>
        }
      />
      <div className="card" style={{ overflow: 'hidden' }}>
        {items.isPending ? (
          <div aria-busy style={{ padding: 'var(--space-4)' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8 }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <Package size={28} className="empty-icon" aria-hidden />
            <p>هنوز کالایی ثبت نشده است.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>کالا</th>
                <th>دستهبندی</th>
                <th>انبار</th>
                <th className="t-num">موجود پایه</th>
                <th className="t-num">در راه</th>
                <th className="t-num">رزرو</th>
                <th className="t-num">قابل فروش</th>
                <th>واحد</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link className="cell-primary" to={`/items/${i.id}`}>
                      {i.name}
                    </Link>
                  </td>
                  <td>{i.categoryName ?? '—'}</td>
                  <td>{nameOf(i.warehouseId)}</td>
                  <td className="t-num cell-onhand">{faDigits(i.quantityOnHand)}</td>
                  <td className="t-num cell-incoming">{faDigits(i.incomingStock)}</td>
                  <td className="t-num cell-reserved">{faDigits(i.reservedStock)}</td>
                  <td className="t-num cell-available">{faDigits(i.availableStock)}</td>
                  <td>{i.unitOfMeasure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}