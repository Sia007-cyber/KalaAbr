/* =============================================================
   Button — Radix Slot asChild, so <Button asChild><a href></a></Button>
   composes with Router <Link>. Style variants via .btn-* classes.
   ============================================================= */

import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'danger-ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'
  asChild?: boolean
  loading?: boolean
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  'danger-ghost': 'btn-danger-ghost',
}

const sizeClass = (size: ButtonProps['size']) => {
  switch (size) {
    case 'sm': return 'btn-sm'
    case 'lg': return 'btn-lg'
    case 'icon': return 'btn-icon'
    case 'icon-sm': return 'btn-sm btn-icon'
    default: return ''
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      asChild = false,
      loading = false,
      className = '',
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    const cls = `btn ${variantClass[variant]} ${sizeClass(size)} ${className}`.trim()
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cls}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'