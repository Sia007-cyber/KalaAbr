/* =============================================================
   StatusChip + DirectionChip + StockAlertChip — status/chip system.
   Icon + text, never color alone (color-blind + a11y).
   ============================================================= */

import { Check, Minus, Timer, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react'
import type { PermitStatus, PermitType } from '../../types/api'
import type { LucideIcon } from 'lucide-react'

const statusMeta: Record<
  PermitStatus,
  { label: string; cls: string; Icon: LucideIcon }
> = {
  ISSUED: { label: 'صادرشده', cls: 'chip-issued', Icon: Timer },
  CONFIRMED: { label: 'تأییدشده', cls: 'chip-confirmed', Icon: Check },
  CANCELLED: { label: 'لغوشده', cls: 'chip-cancelled', Icon: Minus },
}

export function StatusChip({ status }: { status: PermitStatus }) {
  const { label, cls, Icon } = statusMeta[status] ?? statusMeta.ISSUED
  return (
    <span className={`chip ${cls}`}>
      <Icon size={12} strokeWidth={2.4} aria-hidden />
      <span>{label}</span>
    </span>
  )
}

const directionMeta: Record<
  PermitType,
  { label: string; cls: string; Icon: LucideIcon }
> = {
  PURCHASE: { label: 'خرید', cls: 'chip-in', Icon: ArrowDownToLine },
  SALE: { label: 'فروش', cls: 'chip-out', Icon: ArrowUpFromLine },
}

export function DirectionChip({ type }: { type: PermitType }) {
  const { label, cls, Icon } = directionMeta[type] ?? directionMeta.PURCHASE
  return (
    <span className={`chip ${cls}`}>
      <Icon size={12} strokeWidth={2.4} aria-hidden />
      <span>{label}</span>
    </span>
  )
}

/** Stock alert chip: کمموجود / ناموجود. Only render when < 2 (i.e. attention). */
export function StockAlertChip({ available }: { available: number }) {
  if (available <= 0) {
    return (
      <span className="chip chip-outstock">
        <Minus size={12} aria-hidden />
        <span>ناموجود</span>
      </span>
    )
  }
  return (
    <span className="chip chip-lowstock">
      <AlertTriangle size={12} aria-hidden />
      <span>کمموجود</span>
    </span>
  )
}