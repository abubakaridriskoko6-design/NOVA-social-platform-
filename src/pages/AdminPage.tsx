import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, ShieldCheck, Users, FileWarning, DollarSign, Activity, BadgeCheck } from 'lucide-react'
import { apiRequest } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

type DashboardResponse = {
  metrics: {
    totalUsers?: number
    activeUsers?: number
    newUsers?: number
    suspendedUsers?: number
    bannedUsers?: number
    totalPosts?: number
    reportsReceived?: number
    pendingReports?: number
    pendingModerationItems?: number
    resolvedReports?: number
    activeSubscriptions?: number
    subscriptionRevenue?: number
    creatorEarnings?: number
    platformRevenue?: number
    pendingPayouts?: number
    totalReports?: number
  }
  recentReports?: Array<Record<string, unknown>>
  recentModerationActions?: Array<Record<string, unknown>>
  recentAdminActivity?: Array<Record<string, unknown>>
}

const metricCards = [
  { label: 'Total users', key: 'totalUsers', icon: Users, tone: 'violet' },
  { label: 'Active users', key: 'activeUsers', icon: BadgeCheck, tone: 'emerald' },
  { label: 'Pending reports', key: 'pendingReports', icon: FileWarning, tone: 'amber' },
  { label: 'Subscription revenue', key: 'subscriptionRevenue', icon: DollarSign, tone: 'cyan' },
  { label: 'Pending payouts', key: 'pendingPayouts', icon: ArrowUpRight, tone: 'slate' },
  { label: 'Platform revenue', key: 'platformRevenue', icon: Activity, tone: 'rose' },
] as const

export function AdminPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await apiRequest<DashboardResponse>('/api/admin/dashboard')
        setData(response)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load admin dashboard.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const summary = useMemo(() => {
    const metrics = data?.metrics ?? {}
    return metricCards.map((card) => ({
      ...card,
      value: metrics[card.key] ?? 0,
    }))
  }, [data])

  if (user && !['ADMIN', 'SUPER_ADMIN'].includes(user.role ?? 'USER')) {
    return (
      <div className="p-6 text-sm text-slate-600">
        You do not have access to the admin dashboard.
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-600">Loading dashboard…</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      </div>
    )
  }

  const recentReports = data?.recentReports ?? []
  const recentActivity = data?.recentAdminActivity ?? []
  const moderationActions = data?.recentModerationActions ?? []

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600">Operations</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Administration dashboard</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Protected admin view
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-2xl ${tone === 'violet' ? 'bg-violet-100 text-violet-700' : tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : tone === 'amber' ? 'bg-amber-100 text-amber-700' : tone === 'cyan' ? 'bg-cyan-100 text-cyan-700' : tone === 'slate' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent reports</h2>
            <Button variant="ghost" size="sm" className="text-violet-700">Review all</Button>
          </div>
          <div className="space-y-3">
            {recentReports.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No reports yet.</div>
            ) : (
              recentReports.slice(0, 5).map((report, index) => (
                <div key={String(report.id ?? index)} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{String(report.category ?? 'Report')}</p>
                    <p className="text-xs text-slate-500">{String(report.details ?? report.reason ?? 'No summary')}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                    {String(report.status ?? 'OPEN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent moderation actions</h2>
            <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            {moderationActions.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No moderation actions found.</div>
            ) : (
              moderationActions.slice(0, 5).map((action, index) => (
                <div key={String((action as any).id ?? index)} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">{String((action as any).actionType ?? 'Action')}</p>
                  <p className="mt-1 text-xs text-slate-500">{String((action as any).details ?? 'No details')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent admin activity</h2>
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No recent admin actions.</div>
          ) : (
            recentActivity.slice(0, 6).map((entry, index) => (
              <div key={String((entry as any).id ?? index)} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">{String((entry as any).actionType ?? 'Admin action')}</span>
                <span className="text-xs text-slate-500">{String((entry as any).createdAt ?? 'recently')}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
