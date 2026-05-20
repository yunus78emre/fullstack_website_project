/**
 * Category Color System
 *
 * Every category stored in the database has a unique `color` field (hex #RRGGBB)
 * chosen by an admin. That color is the single source of truth and should be
 * used everywhere (admin, advisor, student) to visually identify the category.
 *
 * Legacy name-based mappings below are retained ONLY as a last-resort fallback
 * for older rows that may not yet have a persisted color.
 */

import type { CSSProperties } from 'react'

// ─── Curated palette that admins can pick from when creating/editing a category
// Kept visually distinct so the chip/dot UI remains legible across light/dark modes.
export const CATEGORY_COLOR_PALETTE: string[] = [
  '#3b82f6', // blue-500
  '#f97316', // orange-500
  '#10b981', // emerald-500
  '#a855f7', // purple-500
  '#ef4444', // red-500
  '#eab308', // yellow-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#84cc16', // lime-500
  '#f43f5e', // rose-500
  '#0ea5e9', // sky-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#64748b', // slate-500
]

// Normalize & validate a hex color. Returns lowercase #rrggbb or null.
export function normalizeHexColor(input?: string | null): string | null {
  if (!input) return null
  const trimmed = input.trim().toLowerCase()
  return /^#[0-9a-f]{6}$/.test(trimmed) ? trimmed : null
}

// ─── Legacy fallback (name-based, deterministic) ──────────────────────────────

const fallbackPalette = [
  'bg-red-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-lime-500',
  'bg-rose-500',
]

const legacyNameColorMap: Record<string, string> = {
  'TUBITAK': 'bg-blue-500',
  'Teknofest': 'bg-orange-500',
  'Graduation Project': 'bg-emerald-500',
  'Research Assistant': 'bg-purple-500',
}

/**
 * Returns a Tailwind background class, deterministically chosen from the name.
 * Only used as a last-resort fallback when no persisted hex color is available.
 */
export function resolveCategoryColor(name?: string): string {
  if (!name) return 'bg-muted-foreground'
  if (legacyNameColorMap[name]) return legacyNameColorMap[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return fallbackPalette[Math.abs(hash) % fallbackPalette.length]
}

/**
 * Central helper for rendering a category chip/dot.
 *
 * Preferred: pass `color` (hex). Returns inline style.
 * Fallback: pass `name` only. Returns a Tailwind class.
 *
 * Usage:
 *   const { className, style } = getCategoryColorProps({ color, name })
 *   <span className={cn('h-2 w-2 rounded-full', className)} style={style} />
 */
export function getCategoryColorProps(input?: {
  color?: string | null
  name?: string | null
}): { className: string; style?: CSSProperties } {
  const hex = normalizeHexColor(input?.color)
  if (hex) return { className: '', style: { backgroundColor: hex } }
  return { className: resolveCategoryColor(input?.name ?? undefined) }
}
