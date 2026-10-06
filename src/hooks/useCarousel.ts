import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { imageAttributes } from '../lib/publicAsset'

export async function prepareImage(src: string, sizes?: string) {
  const image = new Image()
  const attributes = imageAttributes(src, sizes)
  if ('sizes' in attributes) image.sizes = attributes.sizes ?? ''
  if ('srcSet' in attributes) image.srcset = attributes.srcSet ?? ''
  image.src = attributes.src
  try { await image.decode(); return true } catch { return false }
}

/** Only animate visible carousels; stop for keyboard focus, reduced motion and hidden tabs. */
export function useCarousel(count: number, delay: number, target: RefObject<HTMLElement | null>, prepare?: (index: number) => Promise<boolean>, paused = false) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const current = useRef(0)
  const sequence = useRef(0)

  const select = useCallback(async (index: number) => {
    const sequenceId = ++sequence.current
    if (index === current.current) return
    if (prepare && !await prepare(index)) return
    if (sequenceId !== sequence.current) return
    setPreviousIndex(current.current)
    current.current = index
    setActiveIndex(index)
  }, [prepare])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = !('IntersectionObserver' in window)
    const update = () => {
      const next = visible && !document.hidden && !motion.matches
      if (!next) sequence.current++
      setCanPlay(next)
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false
      update()
    }, { threshold: .1 }) : null
    if (target.current) observer?.observe(target.current)
    document.addEventListener('visibilitychange', update)
    motion.addEventListener('change', update)
    update()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', update)
      motion.removeEventListener('change', update)
      sequence.current++
    }
  }, [target])

  useEffect(() => {
    if (!canPlay || focused || paused) return
    const timer = window.setTimeout(() => { void select((activeIndex + 1) % count) }, delay)
    return () => window.clearTimeout(timer)
  }, [activeIndex, canPlay, focused, paused, count, delay, select])

  useEffect(() => {
    if (previousIndex === null) return
    const timer = window.setTimeout(() => setPreviousIndex(null), 900)
    return () => window.clearTimeout(timer)
  }, [previousIndex, activeIndex])

  return {
    activeIndex, previousIndex, select,
    interactionProps: {
      onFocusCapture: (event: React.FocusEvent<HTMLElement>) => setFocused(event.target.matches(':focus-visible')),
      onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      },
    },
  }
}
