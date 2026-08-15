/* =============================================================
   Cash — read-only singleton account + derived permit effects.
   ============================================================= */

import { PageHeader } from '../../components/layout/AppLayout'
import { useCash, usePermits } from '../../lib/hooks'
import { faDateLong, faDigits, faMoneyCompact, faRelative } from '../../lib/format'
import { StatusChip, DirectionChip } from '../../components/ui/chips'
import { Wallet } from 'lucide-react'
import './cash.css'

export function CashPage() {
  const cash = useCash()
  const permits = usePermits()

  const issuedP = (permits.data ?? []).filter((p) => p.status === 'ISSUED')
  const committed = issuedP
    .filter((p) => p.permitType === 'PURCHASE')
    .reduce((s, p) => s + Number(p.totalAmount), 0)
  const expected = issuedP
    .filter((p) => p.permitType === 'SALE')
    .reduce((s, p) => s + Number(p.totalAmount), 0)

  const rows = [...(permits.data ?? [])]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 30)

  return (
    <>
      <PageHeader title="حساب نقدی" subtitle="موجودی نقدی شرکت — فقط از طریق مجوزها تغییر میکند" />

      <section className="cash-overview" aria-label="خلاصه حساب">
        <div className="card cash-total">
          <div className="cash-total-label">موجودی نقدی</div>
          <div className="cash-total-value num">
            {cash.isPending ? '…' : faMoneyCompact(Number(cash.data?.balance ?? 0))}
          </div>
        </div>
        <div className="card cash-commit">
          <div className="cash-line">
            <span>تعهد خرید (برداشتشده)</span>
            <span className="num cash-neg">{faMoneyCompact(-committed)}</span>
          </div>
          <div className="cash-line">
            <span>فروش معلق (در انتظار واریز)</span>
            <span className="num cash-pos">+{faMoneyCompact(expected)}</span>
          </div>
        </div>
      </section>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="panel-subhead">
          <h2>حرکات مؤثر بر حساب</h2>
        </div>
        {permits.isPending ? (
          <div aria-busy style={{ padding: 'var(--space-4)' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <Wallet size={28} className="empty-icon" aria-hidden />
            <p>هنوز حرکتی بر حساب ثبت نشده است.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>نوع</th>
                <th className="t-num">اثر نقدی</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const amount = Number(p.totalAmount)
                const effect =
                  p.permitType === 'PURCHASE' ? -amount : amount
                return (
                  <tr key={p.id}>
                    <td className="t-num perm-id">{faDigits(p.id)}</td>
                    <td>
                      <DirectionChip type={p.permitType} />
                    </td>
                    <td className="t-num">
                      <span className={effect <= 0 ? 'cash-neg' : 'cash-pos'}>
                        {effect > 0 ? '+' : ''}
                        {faMoneyCompact(effect)}
                      </span>
                    </td>
                    <td>
                      <StatusChip status={p.status} />
                    </td>
                    <td className="perm-date">
                      <span>{faDateLong(p.createdAt)}</span>
                      <span className="cell-sub">{faRelative(p.createdAt)}</span>
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