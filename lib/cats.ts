import { Category } from '@/types/bucket'

export const CATS: Record<Category, { label: string; ink: string; tint: string }> = {
  travel:     { label: 'Travel',     ink: '#b0603a', tint: '#f0e0d0' },
  experience: { label: 'Experience', ink: '#a83f63', tint: '#f3dde3' },
  skill:      { label: 'Skill',      ink: '#3f7355', tint: '#dde9df' },
  goal:       { label: 'Goal',       ink: '#5b4694', tint: '#e6e0f1' },
}

export const CAT_KEYS = Object.keys(CATS) as Category[]

export const ROT = [-1.5, 0.9, -0.7, 1.3, -1.1, 0.6]

export function fmtDate(d: string | null): string {
  if (!d) return 'someday'
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt.getTime())) return 'someday'
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
