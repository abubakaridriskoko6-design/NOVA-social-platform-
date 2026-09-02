import { Bookmark, MessageCircle, MoreHorizontal, Share2, ShieldAlert, ThumbsUp } from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import type { Post } from '../types'

type PostCardProps = {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.author.avatar} alt={post.author.name} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{post.author.name}</p>
              {post.author.verified ? (
                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">Verified</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{post.author.handle}</span>
              <span>•</span>
              <span>{post.time}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label="More actions"
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {post.category ? (
        <div className="mt-3 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">
          {post.category}
        </div>
      ) : null}

      <p className="mt-4 text-[15px] leading-7 text-slate-700">{post.content}</p>

      {post.image ? (
        <img src={post.image} alt="Post visual" className="mt-4 h-72 w-full rounded-[24px] object-cover" />
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <Button variant="ghost" size="sm" className="px-2 text-slate-600" icon={<ThumbsUp className="h-4 w-4" aria-hidden="true" />}>
            {post.likes}
          </Button>
          <Button variant="ghost" size="sm" className="px-2 text-slate-600" icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}>
            {post.comments}
          </Button>
          <Button variant="ghost" size="sm" className="px-2 text-slate-600" icon={<Share2 className="h-4 w-4" aria-hidden="true" />}>
            {post.shares}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="px-2 text-slate-600" icon={<Bookmark className="h-4 w-4" aria-hidden="true" />}>
            {post.saved}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-rose-600"
            icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
          >
            Report
          </Button>
        </div>
      </div>
    </article>
  )
}
