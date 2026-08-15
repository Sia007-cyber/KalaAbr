/* =============================================================
   RegisterPage — /register. Centered Persian RTL card, RHF + Zod
   inline validation (mirrors backend rules), calls /api/auth/register.
   On success → redirect to /login (no auto-login by design).
   ============================================================= */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Wordmark } from '../../components/brand/Wordmark'
import { ApiError } from '../../lib/api'
import { useIsAuthenticated, useRegister } from '../../lib/hooks'
import { useState } from 'react'
import logoUrl from '../../assets/logo-mark.svg'
import './auth.css'

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد')
    .max(50, 'نام کاربری حداکثر ۵۰ کاراکتر')
    .regex(/^[^\s]+$/, 'نام کاربری نمی‌تواند شامل فاصله باشد'),
  email: z
    .string()
    .trim()
    .min(1, 'ایمیل را وارد کنید')
    .email('ایمیل معتبر نیست'),
  password: z.string().min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const registerApi = useRegister()
  const authed = useIsAuthenticated()
  const [registered, setRegistered] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', password: '' },
  })

  if (authed) return <Navigate to="/dashboard" replace />

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerApi.mutateAsync(values)
      setRegistered(true)
    } catch (err) {
      setError('root', {
        message:
          err instanceof ApiError
            ? err.message
            : 'اتصال به سرور برقرار نشد؛ دوباره تلاش کنید.',
      })
    }
  })

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-logo">
          <img src={logoUrl} alt="" />
          <Wordmark />
        </div>

        {registered ? (
          <>
            <div className="auth-head">
              <h1 className="auth-title">ثبتنام موفق</h1>
              <p className="auth-sub">
                حساب شما ساخته شد؛ برای ورود به سیستم اقدام کنید.
              </p>
            </div>
            <Button
              asChild
              variant="primary"
              size="lg"
            >
              <Link to="/login">رفتن به ورود</Link>
            </Button>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className="auth-head">
              <h1 className="auth-title">ساخت حساب کاربری</h1>
              <p className="auth-sub">
                برای استفاده از کالاابر یک حساب بسازید
              </p>
            </div>

            {errors.root && (
              <p className="form-err" style={{ marginTop: 'var(--space-3)' }} role="alert">
                <CircleAlert size={16} aria-hidden />
                {errors.root.message}
              </p>
            )}

            <div className="field" style={{ marginTop: 'var(--space-4)' }}>
              <label className="field-label" htmlFor="username">
                نام کاربری
              </label>
              <input
                id="username"
                className={`input${errors.username ? ' is-invalid' : ''}`}
                type="text"
                autoComplete="username"
                autoFocus
                dir="ltr"
                aria-invalid={errors.username ? true : undefined}
                {...register('username')}
              />
              {errors.username && (
                <span className="field-error" role="alert">
                  {errors.username.message}
                </span>
              )}
            </div>

            <div className="field" style={{ marginTop: 'var(--space-4)' }}>
              <label className="field-label" htmlFor="email">
                ایمیل
              </label>
              <input
                id="email"
                className={`input${errors.email ? ' is-invalid' : ''}`}
                type="email"
                autoComplete="email"
                dir="ltr"
                inputMode="email"
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
              {errors.email && (
                <span className="field-error" role="alert">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="field" style={{ marginTop: 'var(--space-4)' }}>
              <label className="field-label" htmlFor="password">
                رمز عبور
              </label>
              <input
                id="password"
                className={`input${errors.password ? ' is-invalid' : ''}`}
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.password ? true : undefined}
                {...register('password')}
              />
              {errors.password && (
                <span className="field-error" role="alert">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
            >
              ساخت حساب
            </Button>
          </form>
        )}

        <p className="auth-foot">
          قبلاً ثبتنام کردهاید؟
          <Link to="/login">ورود</Link>
        </p>
      </div>
    </div>
  )
}