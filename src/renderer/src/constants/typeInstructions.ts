import type { QuestionType } from '../types/exam'

export const TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
  mc: 'Multiple Choice — Fill in the circle completely as shown: ● . Select only ONE answer per question.',
  ms: 'Multi-Select — Fill in the square completely as shown: ■ . Select ONE or MORE correct answers.',
  open: 'Open Ended — Write your answer clearly in the designated Answer Area.',
  match: 'Matching — Write the corresponding letter (A, B, C…) for each numbered item in the Answer Section.',
  fill: 'Fill in the Blanks — Write your answers clearly in the Answer Section boxes.',
}
