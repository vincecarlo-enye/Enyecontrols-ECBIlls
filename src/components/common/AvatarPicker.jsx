import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

const avatarModules = import.meta.glob('../../assets/avatars/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

function sortAvatarName(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

export const AVATAR_OPTIONS = Object.entries(avatarModules)
  .map(([path, src]) => {
    const id = path.split('/').pop()
    return {
      id,
      label: `Avatar ${id?.replace(/\.png$/i, '')}`,
      src,
    }
  })
  .sort((a, b) => sortAvatarName(a.id, b.id))

export const DEFAULT_AVATAR = AVATAR_OPTIONS[0]?.id || ''

export function normalizeAvatarValue(value) {
  if (!value) return DEFAULT_AVATAR
  const match = AVATAR_OPTIONS.find(
    (avatar) =>
      avatar.id === value ||
      avatar.src === value ||
      String(value).endsWith(`/${avatar.id}`)
  )
  return match?.id || value
}

export function getAvatarPublicPath(value) {
  const normalized = normalizeAvatarValue(value)
  return normalized ? `/avatars/${normalized}` : ''
}

export function resolveAvatarSrc(value) {
  const selected = normalizeAvatarValue(value)
  const option = AVATAR_OPTIONS.find(
    (avatar) =>
      avatar.id === selected ||
      avatar.src === selected ||
      selected.endsWith(`/${avatar.id}`)
  )

  if (option) return option.src
  return selected
}

function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || '?'
  )
}

export function TenantAvatar({ src, name = '', size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }
  const sizeClass = sizes[size] ?? sizes.md

  if (!failed && src) {
    return (
      <img
        src={resolveAvatarSrc(src)}
        alt={name ? `${name} avatar` : 'Tenant avatar'}
        onError={() => setFailed(true)}
        className={`${sizeClass} rounded-xl object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}

export default function AvatarPicker({ value, onChange }) {
  const selected = value || DEFAULT_AVATAR

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
      {AVATAR_OPTIONS.map((avatar) => {
        const active =
          avatar.id === selected ||
          avatar.src === selected ||
          selected.endsWith(`/${avatar.id}`)

        return (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onChange(avatar.id)}
            aria-label={`Select ${avatar.label}`}
            aria-pressed={active}
            className={[
              'relative aspect-square overflow-hidden rounded-xl border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-blue-400/60',
              active
                ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/20'
                : 'border-transparent hover:border-slate-300 hover:scale-105 dark:hover:border-slate-600',
            ].join(' ')}
          >
            <img
              src={avatar.src}
              alt=""
              className="h-full w-full object-cover"
              draggable="false"
            />
            {active && (
              <span className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                <CheckCircle2 className="h-5 w-5 text-blue-600 drop-shadow" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
