import type { Question } from '../types/exam'

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function blankCount(text: string): number {
  return (text.match(/___/g) || []).length
}

export function accentForType(type: string): string {
  const map: Record<string, string> = {
    mc: 'var(--accent-mc)',
    ms: 'var(--accent-ms)',
    open: 'var(--accent-open)',
    match: 'var(--accent-match)',
    fill: 'var(--accent-fill)',
  }
  return map[type] || 'var(--cl-muted)'
}
