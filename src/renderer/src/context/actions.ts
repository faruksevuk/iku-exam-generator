import type { ExamInfo, Question, QuestionType } from '../types/exam'

export type ExamAction =
  | { type: 'SET_EXAM_FIELD'; field: keyof ExamInfo; value: string }
  | { type: 'LOAD_EXAM'; exam: ExamInfo; questions: Question[]; filePath: string }
  | { type: 'NEW_EXAM' }
  | { type: 'INIT_QUESTIONS' }
  | { type: 'ADD_QUESTION' }
  | { type: 'DELETE_QUESTION'; index: number }
  | { type: 'DUPLICATE_QUESTION'; index: number }
  | { type: 'UPDATE_QUESTION'; index: number; field: keyof Question; value: any }
  | { type: 'UPDATE_QUESTION_FIELDS'; index: number; fields: Partial<Question> }
  | { type: 'SET_QUESTION_IMAGE'; index: number; field: 'imagePreview' | 'correctImagePreview'; dataUrl: string }
  | { type: 'REORDER_QUESTIONS'; questions: Question[] }
  | { type: 'SAVE_ORIGINAL_ORDER' }
  | { type: 'RESTORE_ORIGINAL_ORDER' }
  | { type: 'SET_ACTIVE_QUESTION'; index: number }
  | { type: 'SET_STEP'; step: number }
  | { type: 'MARK_CLEAN'; filePath: string }
  | { type: 'SET_EXAM_ID'; id: string | null }
