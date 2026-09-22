import { useEffect } from 'react'

export interface BreadcrumbItem {
  name: string
  path: string
}

export interface FAQItemSEO {
  question: string
  answer: string
}

export interface PageSEOMetadata {
  title: string
  description: string
  canonicalPath?: string
  noindex?: boolean
  ogType?: 'website' | 'article'
  schema?: Record<string, unknown> | Array<Record<string, unknown>>
}

// Configurable base domain template - easy to swap in production
export const SITE_DOMAIN = 'https://smarttools.in'

export function getFullUrl(path: string = '/'): string {
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
  }
  return `${SITE_DOMAIN}${path.startsWith('/') ? path : `/${path}`}`
}

export function setMetaTag(selector: string, attribute: string, value: string, createAttr: Record<string, string>) {
  let element = document.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    Object.entries(createAttr).forEach(([k, v]) => element!.setAttribute(k, v))
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

export function setCanonicalUrl(url: string) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

export function setRobots(noindex: boolean = false) {
  const content = noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large'
  setMetaTag('meta[name="robots"]', 'content', content, { name: 'robots' })
}

export function injectStructuredData(schema?: Record<string, unknown> | Array<Record<string, unknown>>) {
  const existingScript = document.getElementById('structured-data')
  if (existingScript) {
    existingScript.remove()
  }

  if (!schema) return

  const script = document.createElement('script')
  script.id = 'structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema)
  document.head.appendChild(script)
}

export function usePageSEO({
  title,
  description,
  canonicalPath = '/',
  noindex = false,
  ogType = 'website',
  schema,
}: PageSEOMetadata) {
  useEffect(() => {
    // 1. Title
    document.title = title

    // 2. Meta description
    setMetaTag('meta[name="description"]', 'content', description, { name: 'description' })

    // 3. Robots
    setRobots(noindex)

    // 4. Canonical URL
    const fullCanonicalUrl = getFullUrl(canonicalPath)
    setCanonicalUrl(fullCanonicalUrl)

    // 5. Open Graph
    setMetaTag('meta[property="og:title"]', 'content', title, { property: 'og:title' })
    setMetaTag('meta[property="og:description"]', 'content', description, { property: 'og:description' })
    setMetaTag('meta[property="og:url"]', 'content', fullCanonicalUrl, { property: 'og:url' })
    setMetaTag('meta[property="og:type"]', 'content', ogType, { property: 'og:type' })

    // 6. Twitter Card
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary', { name: 'twitter:card' })
    setMetaTag('meta[name="twitter:title"]', 'content', title, { name: 'twitter:title' })
    setMetaTag('meta[name="twitter:description"]', 'content', description, { name: 'twitter:description' })

    // 7. Inject JSON-LD Structured Data
    injectStructuredData(schema)

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'instant' })

    return () => {
      // Clean up script on unmount
      const script = document.getElementById('structured-data')
      if (script) script.remove()
    }
  }, [title, description, canonicalPath, noindex, ogType, schema])
}

/**
 * Generate WebSite JSON-LD Schema for Homepage
 */
export function createWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SmartTools India',
    url: getFullUrl('/'),
    description: 'Free online calculators, converters and everyday utility tools for students, professionals, and internet users in India.',
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getFullUrl('/tools')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Generate WebApplication JSON-LD Schema for Tool Pages
 */
export function createWebApplicationSchema(toolName: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${toolName} — SmartTools India`,
    url: getFullUrl(path),
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description: description,
    inLanguage: 'en-IN',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
  }
}

/**
 * Generate BreadcrumbList JSON-LD Schema
 */
export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getFullUrl(item.path),
    })),
  }
}

/**
 * Generate FAQPage JSON-LD Schema strictly from visible FAQs
 */
export function createFAQSchema(faqs: FAQItemSEO[]) {
  if (!faqs || faqs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
