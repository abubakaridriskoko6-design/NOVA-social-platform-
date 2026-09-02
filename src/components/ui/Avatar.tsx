type AvatarProps = {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline'
}

const sizeMap = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
}

export function Avatar({ src, alt, size = 'md', status }: AvatarProps) {
  return (
    <div className={`relative inline-flex ${sizeMap[size]}`}>
      <img src={src} alt={alt} className="h-full w-full rounded-full object-cover ring-2 ring-white shadow-sm" />
      {status ? (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          aria-label={status === 'online' ? 'Online' : 'Offline'}
        />
      ) : null}
    </div>
  )
}
