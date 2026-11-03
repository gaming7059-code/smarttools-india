import React, { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'scale' | 'none'
  threshold?: number
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.08,
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
        rootMargin: '0px 0px -20px 0px',
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

  const getRevealClass = () => {
    if (direction === 'scale') {
      return isRevealed ? 'scroll-reveal-scale is-revealed' : 'scroll-reveal-scale'
    }
    if (direction === 'none') {
      return isRevealed ? 'scroll-reveal-fade is-revealed' : 'scroll-reveal-fade'
    }
    return isRevealed ? 'scroll-reveal is-revealed' : 'scroll-reveal'
  }

  return (
    <div
      ref={elementRef}
      className={`${getRevealClass()} ${className}`}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
