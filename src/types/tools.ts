export type CategoryId =
  | 'all'
  | 'calculators'
  | 'finance'
  | 'math'
  | 'converters'
  | 'date-time'
  | 'education'
  | 'creator-tools'
  | 'seo-tools'
  | 'pdf-tools'
  | 'games'

export interface Category {
  id: CategoryId
  name: string
  emoji: string
  tagline: string
  description: string
  icon: string
  toolCount: number
  path?: string
  itemLabel?: string
  accentGradient?: string
}

export interface Tool {
  id: string
  name: string
  slug: string
  path: string
  description: string
  categoryId: CategoryId
  categoryIds?: CategoryId[]
  categoryName: string
  icon: string
  isPopular?: boolean
  isFunctional?: boolean
  badge?: string
  keywords: string[]
}
