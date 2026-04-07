import type { QuestionType } from '../types/exam'

export interface QTypeInfo {
  id: QuestionType
  icon: string
  label: string
}

// Icons chosen for maximum visual distinction at small sizes:
// MC = radio button (one selection), MS = checklist (multiple),
// Open = pencil writing, Match = link/connect, Fill = text cursor
export const QTYPES: readonly QTypeInfo[] = [
  { id: 'mc', icon: '\u{1F518}', label: 'Multiple Choice' },   // 🔘
  { id: 'ms', icon: '\u2611\uFE0F', label: 'Multi-Select' },   // ☑️
  { id: 'open', icon: '\u{1F4DD}', label: 'Open Ended' },      // 📝
  { id: 'match', icon: '\u{1F517}', label: 'Matching' },        // 🔗
  { id: 'fill', icon: '\u{1F524}', label: 'Fill Blanks' },      // 🔤
] as const
