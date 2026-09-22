export type CategoryId =
  | 'finance'
  | 'calculators'
  | 'date-time'
  | 'converters'
  | 'education'
  | 'creator-tools'

export interface Category {
  id: CategoryId
  name: string
  emoji: string
  tagline: string
  description: string
  icon: string
  toolCount: number
}

export interface Tool {
  id: string
  name: string
  slug: string
  path: string
  description: string
  categoryId: CategoryId
  categoryName: string
  icon: string
  isPopular?: boolean
  isFunctional?: boolean
  badge?: string
  keywords: string[]
}
