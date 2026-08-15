/* =============================================================
   <Facade /> — single import for the design system.
   -------------------------------------------------------------
   The rest of the app consumes THIS file's exports (and tokens) so
   an eventual dark theme / design tweak stays centralized here and
   in tokens.css. It's the "design-system interface" — the RTL labels
   and Persian copy live here, not scattered across pages.
   ============================================================= */

import type { ComponentProps } from 'react'
import { Button as UIButton } from '../ui/button'
import { StatusChip, DirectionChip, StockAlertChip } from '../ui/chips'
import { Spinner } from '../ui/spinner'

export const Button = UIButton
export type ButtonProps = ComponentProps<typeof UIButton>

/* RTL-aware labels so <Button variant="secondary"> etc. stay short */
export const SURFACE_LABELS = {
  cancel: 'لغو',
  save: 'ذخیره',
  create: 'ایجاد',
  edit: 'ویرایش',
  delete: 'حذف',
  confirm: 'تأیید',
  issue: 'صدور',
  search: 'جستجو',
  reset: 'بازنشانی',
  back: 'بازگشت',
} as const

export interface FacadeComponents {
  Button: typeof UIButton
  StatusChip: typeof StatusChip
  DirectionChip: typeof DirectionChip
  StockAlertChip: typeof StockAlertChip
  Spinner: typeof Spinner
}

/** Bundle the design system primitives — import once, spread where needed */
export function bundleFacade(): FacadeComponents {
  return {
    Button: UIButton,
    StatusChip,
    DirectionChip,
    StockAlertChip,
    Spinner,
  }
}