import { useEffect, useState } from 'react'
import { CheckCircle2, User } from 'lucide-react'

const DEFAULT_AVATAR = '/avatars/tenant/avatar-1.png'
const AVATAR_COUNT = 10 // probes avatar-1.png through avatar-10.png

function buildCandidates() {
  return Array.from({ length: AVATAR_COUNT }, (_, i) => `/avatars/tenant/avatar-${i + 1}.png`)
}

/**
 * Renders a tenant avatar image with an initials fallback.
 * Accepts any size key: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
export function TenantAvatar({ src, name = '', size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false)

  // Reset error state if src changes
  useEffect(() => { setFailed(false) }, [src])

  const sizes = {
    xs: 'w-6  h-6  text-[10px]',
    sm: 'w-8  h-8  text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }
  const cls = `${sizes[size] ?? sizes.md} rounded-xl object-cover flex-shrink-0 ${className}`

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('') || '?'

  const imgSrc = src || DEFAULT_AVATAR

  if (!failed) {
    return (
      <img
        src={imgSrc}
        alt={name || 'Avatar'}
        onError={() => setFailed(true)}
        className={cls}
      />
    )
  }

  // Initials fallback — keeps existing design token
  return (
    <div
      className={`${sizes[size] ?? sizes.md} rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}

/**
 * Avatar picker grid — probes public paths at runtime.
 * Calls onChange(path) with a string like "/avatars/tenant/avatar-3.png".
 * Stores NOTHING itself — the parent owns the value.
 */
export default function AvatarPicker({ value, onChange }) {
  const [available, setAvailable] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.allSettled(
      buildCandidates().map(
        (src) =>
          new Promise((res, rej) => {
            const img = new Image()
            img.onload = () => res(src)
            img.onerror = () => rej()
            img.src = src
          })
      )
    ).then((results) => {
      if (!alive) return
      const found = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
      setAvailable(found.length ? found : [DEFAULT_AVATAR])
      setReady(true)
    })
    return () => { alive = false }
  }, [])

  const selected = value || DEFAULT_AVATAR

  if (!ready) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
        Loading avatars…
      </div>
    )
  }

  if (available.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
        <User className="w-7 h-7 text-slate-300" />
        <p className="text-xs text-slate-400">
          No avatars found. Place PNG files in{' '}
          <span className="font-mono">public/avatars/tenant/</span>
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {available.map((src) => {
        const active = src === selected
        return (
          <button
            key={src}
            type="button"
            onClick={() => onChange(src)}
            className={[
              'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-blue-400/60',
              active
                ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/20'
                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:scale-105',
            ].join(' ')}
          >
            <img src={src} alt="Avatar option" className="w-full h-full object-cover" />
            {active && (
              <span className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                <CheckCircle2 className="w-5 h-5 text-blue-600 drop-shadow" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
