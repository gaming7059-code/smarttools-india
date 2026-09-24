import React, { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'none'
  threshold?: number
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.1,
}) => {
  const [isRevealed, setIsRevealed] = useState(() => {
    if (typeof window === 'undefined') return true
    if (!('IntersectionObserver' in window)) return true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    return false
  })

  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isRevealed) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    const el = elementRef.current
    if (el) {
      observer.observe(el)
    }

    return () => {
      observer.disconnect()
    }
  }, [isRevealed, threshold])

  const initialTransform = direction === 'up' ? 'translate-y-5' : ''

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-700 ease-out will-change-[opacity,transform] ${
        isRevealed ? 'opacity-100 translate-y-0' : `opacity-0 ${initialTransform}`
      } ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
