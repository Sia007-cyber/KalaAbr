/* =============================================================
   LoginPage — /login. Centered Persian RTL card, RHF + Zod inline
   validation, calls /api/auth/login, stores the token, then
   redirects into the dashboard (respecting RequireAuth's `from`).
   ============================================================= */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Wordmark } from '../../components/brand/Wordmark'
import { ApiError } from '../../lib/api'
import { useIsAuthenticated, useLogin } from '../../lib/hooks'
import logoUrl from '../../assets/logo-mark.svg'
import './auth.css'

const schema = z.object({
  identifier: z.string().trim().min(1, 'نام کاربری یا ایمیل را وارد کنید'),
  password: z.string().min(1, 'رمز عبور را وارد کنید'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const authed = useIsAuthenticated()

  const from =
    (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  })

  /* Already signed in? Don't bounce around — go straight in. */
  if (authed) return <Navigate to={from} replace />

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync({
        /* Backend accepts username OR email — one identifier field works
           for both; it resolves username first, then email. */
        username: values.identifier,
        password: values.password,
      })
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('root', { message: err.message })
      } else {
        setError('root', {
          message:
            err instanceof ApiError
              ? err.message
              : 'اتصال به سرور برقرار نشد؛ دوباره تلاش کنید.',
        })
      }
    }
  })

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <div className="auth-logo">
          <img src={logoUrl} alt="" />
          <Wordmark />
        </div>

        <div className="auth-head">
          <h1 className="auth-title">ورود به سیستم</h1>
          <p className="auth-sub">با نام کاربری یا ایمیل وارد شوید</p>
        </div>

        {errors.root && (
          <p className="form-err" role="alert">
            <CircleAlert size={16} aria-hidden />
            {errors.root.message}
          </p>
        )}

        <div className="field">
          <label className="field-label" htmlFor="identifier">
            نام کاربری یا ایمیل
          </label>
          <input
            id="identifier"
            className={`input${errors.identifier ? ' is-invalid' : ''}`}
            type="text"
            autoComplete="username"
            autoFocus
            aria-invalid={errors.identifier ? true : undefined}
            {...register('identifier')}
          />
          {errors.identifier && (
            <span className="field-error" role="alert">
              {errors.identifier.message}
            </span>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">
            رمز عبور
          </label>
          <input
            id="password"
            className={`input${errors.password ? ' is-invalid' : ''}`}
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          {errors.password && (
            <span className="field-error" role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          ورود
        </Button>

        <p className="auth-foot">
          حساب کاربری ندارید؟
          <Link to="/register">ثبتنام کنید</Link>
        </p>
      </form>
    </div>
  )
}