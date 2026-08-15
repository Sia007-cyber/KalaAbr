/* =============================================================
   Warehouses — master data list with capacity utilization.
   ============================================================= */

import { PageHeader } from '../../components/layout/AppLayout'
import { useWarehouses, useItems } from '../../lib/hooks'
import { faDigits } from '../../lib/format'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { Warehouse as WarehouseIcon, Plus } from 'lucide-react'

export function WarehousesPage() {
  const warehouses = useWarehouses()
  const items = useItems()

  const usage = (warehouseId: number) =>
    (items.data ?? [])
      .filter((i) => i.warehouseId === warehouseId)
      .reduce((s, i) => s + i.quantityOnHand, 0)

  return (
    <>
      <PageHeader
        title="انبارها"
        actions={
          <Button asChild variant="primary">
            <Link to="/warehouses/new">
              <Plus size={15} aria-hidden /> انبار جدید
            </Link>
          </Button>
        }
      />
      <div className="card" style={{ overflow: 'hidden' }}>
        {warehouses.isPending ? (
          <div aria-busy style={{ padding: 'var(--space-4)' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8 }} />
            ))}
          </div>
        ) : (warehouses.data ?? []).length === 0 ? (
          <div className="empty">
            <WarehouseIcon size={28} className="empty-icon" aria-hidden />
            <p>هنوز انباری ثبت نشده است.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>انبار</th>
                <th>آدرس</th>
                <th className="t-num">موجود اشغالشده</th>
                <th className="t-num">ظرفیت</th>
                <th className="t-num">استفاده</th>
              </tr>
            </thead>
            <tbody>
              {(warehouses.data ?? []).map((w) => {
                const used = usage(w.id)
                const cap = w.capacity ?? 0
                const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0
                return (
                  <tr key={w.id}>
                    <td>
                      <Link className="cell-primary" to={`/warehouses/${w.id}`}>
                        {w.name}
                      </Link>
                    </td>
                    <td>{w.address ?? '—'}</td>
                    <td className="t-num">{faDigits(used)}</td>
                    <td className="t-num">{faDigits(cap)}</td>
                    <td className="t-num">
                      <span className="util">
                        <span className="util-bar">
                          <span className="util-fill" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="util-num num">{faDigits(pct)}٪</span>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}