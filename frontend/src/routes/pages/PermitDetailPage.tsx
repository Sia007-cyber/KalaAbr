/* =============================================================
   Permit detail — one permit: meta strip, lines table, totals,
   and the lifecycle action the current state allows.
   Confirm / cancel mirror the backend exactly:
     ISSUED purchase  → cash already debited; تأیید adds on-hand;
                        لغو refunds the debit.
     ISSUED sale      → nothing on cash yet; تأیید pays + removes
                        on-hand; لغو just frees the reservation.
   ============================================================= */

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

import { PageHeader } from '../../components/layout/AppLayout'
import { StatusChip, DirectionChip } from '../../components/ui/chips'
import { Button } from '../../components/ui/button'
import {
  useCancelPermit,
  useConfirmPurchase,
  useConfirmSale,
  usePermit,
} from '../../lib/hooks'
import {
  faDateTime,
  faDigits,
  faMoney,
  faNumber,
} from '../../lib/format'
import type { Permit } from '../../types/api'
import './permit-detail.css'

export function PermitDetailPage() {
  const { id } = useParams()
  const permitId = Number(id)
  const { data: permit, isPending, isError } = usePermit(permitId)

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

  if (isError || !permit) {
    return <NotFound />
  }

  return <PermitBody permit={permit} />
}

/* ---------------- body ---------------- */

function PermitBody({ permit }: { permit: Permit }) {
  const isPurchase = permit.permitType === 'PURCHASE'
  const isIssued = permit.status === 'ISSUED'
  const isConfirmed = permit.status === 'CONFIRMED'
  const isCancelled = permit.status === 'CANCELLED'

  const confirmPurchase = useConfirmPurchase()
  const confirmSale = useConfirmSale()
  const cancel = useCancelPermit()
  const confirm = isPurchase ? confirmPurchase : confirmSale
  const busy = confirmPurchase.isPending || confirmSale.isPending || cancel.isPending

  const navigate = useNavigate()
  const [dialog, setDialog] = useState<'confirm' | 'cancel' | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)

  const total = Number(permit.totalAmount)

  const close = () => {
    setDialog(null)
    setActionErr(null)
  }

  const runAction = async (kind: 'confirm' | 'cancel') => {
    const mutate = kind === 'confirm'
      ? confirm.mutateAsync
      : cancel.mutateAsync
    try {
      const updated = await mutate(permit.id)
      close()
      void navigate(`/permits/${updated.id}`, { replace: true })
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'عملیات ناموفق بود')
    }
  }

  return (
    <>
      <PageHeader
        title={`مجوز #${faDigits(permit.id)}`}
        subtitle={isPurchase ? 'خرید ورودی کالا' : 'فروش خروجی کالا'}
        breadcrumb={
          <>
            <h1 className="page-title">مجوز #{faDigits(permit.id)}</h1>
            <p className="page-subtitle">{isPurchase ? 'خرید ورودی کالا' : 'فروش خروجی کالا'}</p>
          </>
        }
        actions={
          isConfirmed && permit.confirmedAt ? (
            <span className="pd-confirmed-stamp">
              <Checkmark />
              تأیید شد · {faDateTime(permit.confirmedAt)}
            </span>
          ) : undefined
        }
      />

      <div className="card pd-meta">
        <MetaItem label="وضعیت">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <StatusChip status={permit.status} />
            <DirectionChip type={permit.permitType} />
          </span>
        </MetaItem>
        <MetaItem label="انبار">{permit.warehouseName}</MetaItem>
        <MetaItem label="تاریخ صدور">{faDateTime(permit.createdAt)}</MetaItem>
        {isConfirmed && permit.confirmedAt && (
          <MetaItem label="تاریخ تأیید">{faDateTime(permit.confirmedAt)}</MetaItem>
        )}
        <MetaItem label="تعداد ردیفها">{faDigits(permit.lines.length)}</MetaItem>
      </div>

      <div className="card pd-card">
        <table className="table pd-table">
          <thead>
            <tr>
              <th>#</th>
              <th>کالا</th>
              <th className="t-num">تعداد</th>
              <th className="t-num">قیمت واحد</th>
              <th className="t-num">جمع ردیف</th>
              <th className="t-num pd-status-cell">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {permit.lines.map((line) => (
              <tr key={line.id}>
                <td className="t-num perm-id">{faDigits(line.id)}</td>
                <td>
                  <Link className="cell-primary" to={`/items/${line.itemId}`}>
                    {line.itemName}
                  </Link>
                </td>
                <td className="t-num">{faNumber(line.quantity)}</td>
                <td className="t-num">{faMoney(line.unitPrice)}</td>
                <td className="t-num pd-line-total">
                  {faMoney(Number(line.unitPrice) * line.quantity)}
                </td>
                <td className="t-num pd-status-cell">
                  {isPurchase ? (
                    isConfirmed
                      ? <span className="chip chip-confirmed"><span className="chip-dot" /> موجودی افزوده شد</span>
                      : isCancelled
                        ? <span className="chip chip-cancelled"><span className="chip-dot" /> بدون اثر</span>
                        : <span className="chip chip-issued"><span className="chip-dot" /> در راه</span>
                  ) : (
                    isConfirmed
                      ? <span className="chip chip-confirmed"><span className="chip-dot" /> موجودی کاسته شد</span>
                      : isCancelled
                        ? <span className="chip chip-cancelled"><span className="chip-dot" /> بدون اثر</span>
                        : <span className="chip chip-issued"><span className="chip-dot" /> رزرو شده</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pd-footer">
          <div className="pd-totals">
            {isPurchase && (
              <>
                {isCancelled ? (
                  <div className="pd-total-line is-pos">
                    <span>وجه برداشتشده برگشت داده شد</span>
                    <strong>{faMoney(total)}</strong>
                  </div>
                ) : (
                  <>
                    <div className={`pd-total-line${isConfirmed ? '' : ' is-neg'}`}>
                      <span>{isConfirmed ? 'وجه پرداختی' : 'برداشت فوری (تعهد خرید)'}</span>
                      <strong>{faMoney(-total)}</strong>
                    </div>
                    {!isConfirmed && (
                      <div className="pd-total-line is-pos">
                        <span>بازگشت در صورت لغو</span>
                        <strong>{faMoney(total)}</strong>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {!isPurchase && (
              isCancelled ? (
                <div className="pd-total-line">
                  <span>واریز لغو شد</span>
                  <strong>{faMoney(0)}</strong>
                </div>
              ) : (
                <div className={`pd-total-line${isConfirmed ? ' is-pos' : ''}`}>
                  <span>{isConfirmed ? 'واریز به حساب' : 'واریز پس از تأیید'}</span>
                  <strong>{isConfirmed ? faMoney(total) : faMoney(0)}</strong>
                </div>
              )
            )}
            <div className="pd-total-line pd-grand">
              <span>جمع کل مجوز</span>
              <strong>{faMoney(total)}</strong>
            </div>
            <div className="pd-note">
              {isCancelled ? (
                <><span className="dot is-mid" /> مجوز لغو شده است — اثری روی حساب یا موجودی ندارد</>
              ) : isPurchase ? (
                <><span className="dot is-neg" /> وجه در لحظهٔ صدور از حساب کاسته میشود</>
              ) : (
                <><span className="dot is-pos" /> واریز وجه هنگام تأیید فروش</>
              )}
            </div>
          </div>

          {isIssued && (
            <div className="pd-actions">
              <Button variant="danger-ghost" onClick={() => setDialog('cancel')}>
                لغو مجوز
              </Button>
              <Button variant="primary" onClick={() => setDialog('confirm')}>
                {isPurchase ? 'تأیید مجوز خرید' : 'پرداخت و تأیید'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <ActionDialog
        kind={dialog}
        isPurchase={isPurchase}
        total={total}
        busy={busy}
        err={actionErr}
        onClose={close}
        onRun={() => runAction(dialog!)}
      />
    </>
  )
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pd-meta-item">
      <span className="pd-meta-label">{label}</span>
      <span className="pd-meta-value">{children}</span>
    </div>
  )
}

function Checkmark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="none">
      <circle cx="8" cy="8" r="7" stroke="var(--success-600)" strokeWidth="1.5" />
      <path d="M4.8 8.2l2.2 2.2 4.2-4.6" stroke="var(--success-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------- confirm / cancel dialog ---------------- */

interface ActionDialogProps {
  kind: 'confirm' | 'cancel' | null
  isPurchase: boolean
  total: number
  busy: boolean
  err: string | null
  onClose: () => void
  onRun: () => void
}

function ActionDialog({ kind, isPurchase, total, busy, err, onClose, onRun }: ActionDialogProps) {
  const open = kind !== null
  if (!open) return null

  const isConfirm = kind === 'confirm'
  const title = isConfirm
    ? (isPurchase ? 'تأیید مجوز خرید' : 'پرداخت و تأیید مجوز فروش')
    : 'لغو مجوز'

  const desc = isConfirm
    ? isPurchase
      ? 'این ردیفها به موجودی واقعی انبار افزوده میشوند.'
      : 'وجه مجوز به حساب اضافه شده و کالاها از موجودی واقعی کاسته میشوند.'
    : isPurchase
      ? 'وجه برداشتشده در زمان صدور، به حساب برگردانده میشود و مجوز بیاثر میشود.'
      : 'رزرو کالاها آزاد میشود و مجوز بیاثر میشود. وجهی برای بازگرداندن وجود ندارد.'

  const bullets: React.ReactNode[] = isConfirm
    ? [
        <li key="a">
          <span className={`dot ${isPurchase ? 'is-pos' : 'is-neg'}`} />
          {isPurchase
            ? 'برداشت وجه قبلاً در زمان صدور انجام شده؛ تأیید هیچ اثر نقدی جدیدی ندارد.'
            : 'واریز '}
          <strong>{!isPurchase && faMoney(total)}</strong>
          {!isPurchase && ' به حساب'}
        </li>,
        <li key="b">
          <span className={`dot ${isPurchase ? 'is-pos' : 'is-neg'}`} />
          {isPurchase ? 'افزودن موجودی انبار' : 'کاستن از موجودی انبار'}
        </li>,
      ]
    : [
        <li key="a">
          <span className="dot is-mid" />
          {isPurchase ? (
            <>بازگشت <strong>{faMoney(total)}</strong> به حساب</>
          ) : (
            'آزادسازی رزرو کالاها'
          )}
        </li>,
        <li key="b">
          <span className="dot is-mid" />
          تغییر وضعیت مجوز به «لغو شده» — قابل بازگشت نیست
        </li>,
      ]

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dlg-overlay" />
        <Dialog.Content className="dlg-content" aria-describedby={undefined}>
          <Dialog.Title className="dlg-title">{title}</Dialog.Title>
          <Dialog.Description className="dlg-desc">{desc}</Dialog.Description>
          <ul className="dlg-bullets">{bullets}</ul>
          {err && <div className="form-err" role="alert">{err}</div>}
          <div className="dlg-actions">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={busy}>انصراف</Button>
            </Dialog.Close>
            <Button
              variant={isConfirm ? 'primary' : 'danger'}
              loading={busy}
              onClick={onRun}
            >
              {isConfirm ? 'تأیید نهایی' : 'لغو مجوز'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------------- not found ---------------- */

function NotFound() {
  return (
    <>
      <PageHeader title="مجوز پیدا نشد" />
      <div className="card empty pd-missing">
        <AlertTriangle size={28} className="empty-icon" aria-hidden />
        <p>مجوز موردنظر وجود ندارد یا حذف شده است.</p>
        <Button asChild variant="primary">
          <Link to="/permits">بازگشت به مجوزها</Link>
        </Button>
      </div>
    </>
  )
}
