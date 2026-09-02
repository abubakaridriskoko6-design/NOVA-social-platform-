import { ChevronRight, Lock, ShieldCheck, Bell, UserCog, HelpCircle, SlidersHorizontal } from 'lucide-react'
import { settingsGroups } from '../data/mockData'

const iconMap = {
  account: UserCog,
  privacy: Lock,
  security: ShieldCheck,
  notifications: Bell,
  safety: SlidersHorizontal,
  help: HelpCircle,
}

export function SettingsPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-violet-600">Preferences</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Settings</h2>
        </div>

        <div className="mt-6 space-y-5">
          {settingsGroups.map((group) => {
            const Icon = iconMap[group.id as keyof typeof iconMap] ?? UserCog

            return (
              <section key={group.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="font-semibold text-slate-900">{group.title}</p>
                </div>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-sm">
                      <span className="text-slate-700">{item.label}</span>
                      <span className={`inline-flex items-center gap-2 ${item.highlight ? 'font-semibold text-violet-700' : 'text-slate-500'}`}>
                        {item.value}
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
