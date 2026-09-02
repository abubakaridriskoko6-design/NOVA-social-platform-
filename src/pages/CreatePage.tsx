import { Image, Video, ShieldAlert, Eye, Lock, Globe } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/Button'

export function CreatePage() {
  const [visibility, setVisibility] = useState('Friends')

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-violet-600">Create</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Share a new post</h2>
          </div>
          <Button variant="primary" size="sm">Draft saved</Button>
        </div>

        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <textarea
            aria-label="Post content"
            placeholder="What’s happening in your corner of the world?"
            className="min-h-[160px] w-full resize-none border-0 bg-transparent text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            className="flex items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <Image className="h-5 w-5" aria-hidden="true" />
            Add image
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <Video className="h-5 w-5" aria-hidden="true" />
            Add video
          </button>
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Visibility</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Public', icon: Globe },
              { label: 'Friends', icon: Eye },
              { label: 'Private', icon: Lock },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setVisibility(option.label)}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                  visibility === option.label
                    ? 'border-violet-200 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <option.icon className="h-4 w-4" aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-900">Content safety notice</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Sexual/adult content, harassment, scams, and abusive behavior are prohibited on NOVA. Please keep community spaces respectful, safe, and family-friendly.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="lg">Post to NOVA</Button>
        </div>
      </div>
    </div>
  )
}
