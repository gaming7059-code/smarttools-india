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

  const getTransformClasses = () => {
    if (isRevealed) {
      return 'opacity-100 translate-y-0 scale-100'
    }
    switch (direction) {
      case 'up':
        return 'opacity-0 translate-y-6 scale-100'
      case 'scale':
        return 'opacity-0 translate-y-2 scale-[0.97]'
      case 'none':
      default:
        return 'opacity-0'
    }
  }

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform] ${getTransformClasses()} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
