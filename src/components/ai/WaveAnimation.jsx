/**
 * WaveAnimation.jsx
 * Animated sound-wave bars shown while the voice assistant is listening.
 * Pure CSS animation — zero dependencies.
 */

export default function WaveAnimation({ active = false, size = 'md' }) {
  const barCount = 5
  const sizeMap = {
    sm: { bar: 'w-0.5', container: 'h-4', gap: 'gap-0.5' },
    md: { bar: 'w-1',   container: 'h-6', gap: 'gap-0.5' },
    lg: { bar: 'w-1.5', container: 'h-8', gap: 'gap-1'   },
  }
  const { bar, container, gap } = sizeMap[size] || sizeMap.md

  const delays = ['0ms', '80ms', '160ms', '80ms', '0ms']
  const heights = ['30%', '60%', '100%', '60%', '30%']

  return (
    <div className={`flex items-center ${gap} ${container}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={`${bar} rounded-full bg-violet-500 dark:bg-violet-400 origin-center transition-all`}
          style={{
            height: active ? heights[i] : '20%',
            animation: active
              ? `aiWave 0.9s ease-in-out infinite alternate`
              : 'none',
            animationDelay: delays[i],
            opacity: active ? 1 : 0.4,
            transition: 'height 0.2s ease, opacity 0.2s ease',
          }}
        />
      ))}
    </div>
  )
}
