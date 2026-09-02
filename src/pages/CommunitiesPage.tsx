import { Plus, Sparkles, Users } from 'lucide-react'
import { communities } from '../data/mockData'
import { Button } from '../components/ui/Button'

export function CommunitiesPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-violet-600">Groups</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Communities</h2>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
          Create community
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">Recommended communities</p>
            <Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />
          </div>
          <div className="mt-4 space-y-4">
            {communities.map((community) => (
              <article key={community.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                <img src={community.cover} alt={community.name} className="h-32 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{community.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{community.category}</p>
                    </div>
                    <Button variant={community.joined ? 'secondary' : 'primary'} size="sm">
                      {community.joined ? 'Joined' : 'Join'}
                    </Button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{community.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {community.members}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">Your communities</p>
            <span className="text-xs text-slate-500">3 active</span>
          </div>
          <div className="mt-4 space-y-3">
            {communities.slice(0, 3).map((community) => (
              <div key={`${community.id}-joined`} className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <img src={community.cover} alt={community.name} className="h-12 w-12 rounded-2xl object-cover" />
                  <div>
                    <p className="font-medium text-slate-800">{community.name}</p>
                    <p className="text-xs text-slate-500">{community.members}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Open</Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
