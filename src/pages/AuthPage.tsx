import { Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export type AuthMode = 'login' | 'register'

type AuthPageProps = {
  mode: AuthMode
}

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate()
  const { login, register, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', communityRulesAccepted: false })
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const isRegister = mode === 'register'

  const submitLabel = useMemo(() => (isRegister ? 'Create account' : 'Log in'), [isRegister])

  const handleChange = (field: 'name' | 'email' | 'password' | 'confirmPassword' | 'communityRulesAccepted', value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: '' }))
    setFormError('')
  }

  const getFriendlyErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return 'Please check your details and try again.'
        case 401:
          return 'Your email or password is incorrect.'
        case 403:
          return 'This account is not allowed to sign in right now.'
        case 409:
          return 'An account with this email already exists.'
        case 429:
          return 'Too many attempts. Please wait a moment and try again.'
        case 500:
          return 'We could not complete this request right now. Please try again later.'
        default:
          return error.message || 'Something went wrong. Please try again.'
      }
    }

    return 'Something went wrong. Please try again.'
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFieldErrors({})

    const nextFieldErrors: Record<string, string> = {}
    const name = formData.name.trim()
    const email = formData.email.trim()
    const password = formData.password

    if (isRegister && name.length < 2) {
      nextFieldErrors.name = 'Please enter a valid name.'
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextFieldErrors.email = 'Please enter a valid email address.'
    }

    if (password.length < 8) {
      nextFieldErrors.password = 'Password must be at least 8 characters.'
    }

    if (isRegister && formData.confirmPassword !== password) {
      nextFieldErrors.confirmPassword = 'Passwords do not match.'
    }

    if (isRegister && !formData.communityRulesAccepted) {
      nextFieldErrors.communityRulesAccepted = 'You must accept the NOVA Community & Safety Rules.'
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      if (isRegister) {
        await register(name, email, password, formData.communityRulesAccepted)
      } else {
        await login(email, password)
      }

      navigate('/', { replace: true })
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-cyan-50 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black shadow-lg shadow-violet-500/20">
                N
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-violet-100">NOVA</p>
                <p className="text-sm text-violet-100">Safe social connection</p>
              </div>
            </div>

            <div className="mt-12 max-w-md">
              <p className="text-xs uppercase tracking-[0.28em] text-violet-100">Family-first network</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">A calmer, more meaningful place to connect.</h1>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="font-semibold">Safety-first moderation</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-violet-100">
              Sexual/adult content, harassment, scams and abusive behavior are not allowed. We help keep every space respectful, secure and welcoming.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-violet-600">{isRegister ? 'Create account' : 'Welcome back'}</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{isRegister ? 'Join NOVA' : 'Log in to NOVA'}</h2>
            </div>
            <Sparkles className="h-5 w-5 text-violet-600" aria-hidden="true" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {isRegister ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    value={formData.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    aria-invalid={Boolean(fieldErrors.name)}
                  />
                  {fieldErrors.name ? <span className="mt-1 block text-xs text-rose-600">{fieldErrors.name}</span> : null}
                </label>
              </div>
            ) : null}

            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={formData.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="name@example.com"
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? <span className="mt-1 block text-xs text-rose-600">{fieldErrors.email}</span> : null}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {fieldErrors.password ? <span className="mt-1 block text-xs text-rose-600">{fieldErrors.password}</span> : null}
            </label>

            {isRegister ? (
              <label className="block text-sm font-medium text-slate-700">
                Confirm password
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(event) => handleChange('confirmPassword', event.target.value)}
                  placeholder="Repeat your password"
                  className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                {fieldErrors.confirmPassword ? <span className="mt-1 block text-xs text-rose-600">{fieldErrors.confirmPassword}</span> : null}
              </label>
            ) : null}

            {isRegister ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">NOVA Community & Safety Rules</p>
                <p className="mt-2 leading-6 text-amber-800">
                  NOVA is a family-friendly platform and does not allow pornography, explicit sexual content, sexual solicitation, exploitation, sexual harassment, sexually explicit images/videos, or links/files promoting prohibited sexual content.
                </p>
                <label className="mt-3 flex items-start gap-3 text-sm text-amber-900">
                  <input
                    type="checkbox"
                    checked={formData.communityRulesAccepted}
                    onChange={(event) => handleChange('communityRulesAccepted', event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-violet-600 focus:ring-violet-500"
                    aria-invalid={Boolean(fieldErrors.communityRulesAccepted)}
                  />
                  <span>
                    I understand and agree to follow NOVA Community & Safety Rules.
                  </span>
                </label>
                {fieldErrors.communityRulesAccepted ? <span className="mt-2 block text-xs text-rose-600">{fieldErrors.communityRulesAccepted}</span> : null}
              </div>
            ) : (
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                <span>Keep me signed in on this device.</span>
              </label>
            )}

            {formError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" aria-live="polite">
                {formError}
              </div>
            ) : null}

            <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={isSubmitting || authLoading}>
              {isSubmitting ? 'Please wait...' : submitLabel}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-violet-700 hover:text-violet-800">
              {isRegister ? 'Log in' : 'Register'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
