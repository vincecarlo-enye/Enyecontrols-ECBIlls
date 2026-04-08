import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DashboardCard from '@/components/ui/DashboardCard'

export default function SummaryCardStrip({
  cards = [],
  className = '',
  gapClassName = 'gap-4 sm:gap-5',
  cardClassName = 'w-[228px] flex-none sm:w-[252px]',
  stretch = false,
  stretchGridClassName = '',
}) {
  const scrollRef = useRef(null)
  const frameRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  if (!Array.isArray(cards) || cards.length === 0) return null

  const stretchGridClass = stretchGridClassName || (
    cards.length <= 1
      ? 'grid-cols-1'
      : cards.length === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : cards.length === 3
          ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  )

  const updateScrollState = () => {
    const node = scrollRef.current
    if (!node) return

    const maxScrollLeft = node.scrollWidth - node.clientWidth
    setCanScrollLeft(node.scrollLeft > 8)
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 8)
  }

  useEffect(() => {
    updateScrollState()
    const node = scrollRef.current
    if (!node) return

    const onScroll = () => {
      if (frameRef.current) return
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null
        updateScrollState()
      })
    }

    const handleResize = () => updateScrollState()
    node.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      node.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', handleResize)
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [cards.length])

  const scrollByAmount = (direction) => {
    const node = scrollRef.current
    if (!node) return
    const amount = Math.max(node.clientWidth * 0.7, 260)
    node.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  return (
    <div className={`relative ${className}`.trim()}>
      {!stretch && <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/90 to-transparent opacity-0 transition-opacity duration-200 dark:from-[#0d1118] dark:via-[#0d1118]/90" style={{ opacity: canScrollLeft ? 1 : 0 }} />}
      {!stretch && <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/90 to-transparent opacity-0 transition-opacity duration-200 dark:from-[#0d1118] dark:via-[#0d1118]/90" style={{ opacity: canScrollRight ? 1 : 0 }} />}

      {!stretch && (
        <button
          type="button"
          aria-label="Scroll summary cards left"
          onClick={() => scrollByAmount(-1)}
          disabled={!canScrollLeft}
          className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-700 shadow-[0_12px_30px_rgba(14,165,233,0.18)] ring-1 ring-cyan-100/80 backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-cyan-50 disabled:pointer-events-none disabled:opacity-0 dark:border-cyan-400/30 dark:bg-[#08111f] dark:text-cyan-200 dark:ring-cyan-400/10 dark:hover:bg-[#0c1728] md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {!stretch && (
        <button
          type="button"
          aria-label="Scroll summary cards right"
          onClick={() => scrollByAmount(1)}
          disabled={!canScrollRight}
          className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-700 shadow-[0_12px_30px_rgba(14,165,233,0.18)] ring-1 ring-cyan-100/80 backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-cyan-50 disabled:pointer-events-none disabled:opacity-0 dark:border-cyan-400/30 dark:bg-[#08111f] dark:text-cyan-200 dark:ring-cyan-400/10 dark:hover:bg-[#0c1728] md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div ref={scrollRef} className={stretch ? 'pb-3' : 'modern-scroll-strip overflow-x-auto pb-3'}>
        <div className={`${stretch ? `grid w-full ${stretchGridClass}` : 'flex min-w-max'} ${gapClassName}`.trim()}>
          {cards.map((card, index) => (
            <DashboardCard
              key={card.id || card.key || card.title || card.label || index}
              icon={card.icon}
              title={card.title || card.label}
              value={card.value}
              sub={card.sub}
              badge={card.badge ?? card.trend}
              badgeUp={card.badgeUp ?? card.trendUp}
              gradient={card.gradient}
              glow={card.glow ?? card.shadow}
              className={`${stretch ? 'min-w-0 w-full' : cardClassName} ${card.className || `stagger-${index + 1} animate-in`}`.trim()}
              onClick={card.onClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
