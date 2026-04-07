import type { ExamInfo, Question } from '../types/exam'
import type { ExamAction } from './actions'
import { DEFAULT_QUESTION, DEFAULT_EXAM } from '../constants/defaults'
import { deepClone } from '../utils/helpers'

export interface ExamState {
  exam: ExamInfo
  questions: Question[]
  activeQuestionIndex: number
  originalOrder: Question[] | null
  step: number           // -1 = dashboard, 0 = exam info, 1 = editor, 2 = preview
  filePath: string | null
  isDirty: boolean
  currentExamId: string | null
}

export const initialState: ExamState = {
  exam: { ...DEFAULT_EXAM },
  questions: [],
  activeQuestionIndex: 0,
  originalOrder: null,
  step: -1,              // Start on dashboard
  filePath: null,
  isDirty: false,
  currentExamId: null,
}

export function examReducer(state: ExamState, action: ExamAction): ExamState {
  switch (action.type) {
    case 'SET_EXAM_FIELD':
      return {
        ...state,
        exam: { ...state.exam, [action.field]: action.value },
        isDirty: true,
      }

    case 'LOAD_EXAM':
      return {
        ...state,
        exam: action.exam,
        questions: action.questions,
        activeQuestionIndex: 0,
        originalOrder: null,
        step: 0,
        filePath: action.filePath,
        isDirty: false,
      }

    case 'NEW_EXAM':
      return { ...initialState, step: 0 }

    case 'INIT_QUESTIONS':
      if (state.questions.length > 0) return state
      return {
        ...state,
        questions: [deepClone(DEFAULT_QUESTION)],
        activeQuestionIndex: 0,
        originalOrder: null,
      }

    case 'ADD_QUESTION': {
      const newQuestions = [...state.questions, deepClone(DEFAULT_QUESTION)]
      return {
        ...state,
        questions: newQuestions,
        activeQuestionIndex: newQuestions.length - 1,
        isDirty: true,
      }
    }

    case 'DELETE_QUESTION': {
      if (state.questions.length <= 1) return state
      const next = state.questions.filter((_, j) => j !== action.index)
      return {
        ...state,
        questions: next,
        activeQuestionIndex: Math.min(state.activeQuestionIndex, next.length - 1),
        isDirty: true,
      }
    }

    case 'DUPLICATE_QUESTION': {
      const copy = deepClone(state.questions[action.index])
      const next = [...state.questions]
      next.splice(action.index + 1, 0, copy)
      return {
        ...state,
        questions: next,
        activeQuestionIndex: action.index + 1,
        isDirty: true,
      }
    }

    case 'UPDATE_QUESTION': {
      const next = [...state.questions]
      next[action.index] = { ...next[action.index], [action.field]: action.value }
      // When switching to open-ended, ensure minimum space (Tiny) and no penalty
      if (action.field === 'type' && action.value === 'open') {
        if (next[action.index].spaceId === 0) next[action.index].spaceId = 1
        next[action.index].penaltyPerItem = 0
      }
      return { ...state, questions: next, isDirty: true }
    }

    case 'UPDATE_QUESTION_FIELDS': {
      const next = [...state.questions]
      next[action.index] = { ...next[action.index], ...action.fields }
      return { ...state, questions: next, isDirty: true }
    }

    case 'SET_QUESTION_IMAGE': {
      const next = [...state.questions]
      next[action.index] = { ...next[action.index], [action.field]: action.dataUrl }
      return { ...state, questions: next, isDirty: true }
    }

    case 'REORDER_QUESTIONS':
      return {
        ...state,
        questions: action.questions,
        activeQuestionIndex: 0,
        isDirty: true,
      }

    case 'SAVE_ORIGINAL_ORDER':
      if (state.originalOrder) return state
      return { ...state, originalOrder: state.questions.map(q => deepClone(q)) }

    case 'RESTORE_ORIGINAL_ORDER':
      if (!state.originalOrder) return state
      return {
        ...state,
        questions: state.originalOrder.map(q => deepClone(q)),
        originalOrder: null,
        activeQuestionIndex: 0,
      }

    case 'SET_ACTIVE_QUESTION':
      return { ...state, activeQuestionIndex: action.index }

    case 'SET_STEP':
      return { ...state, step: action.step }

    case 'MARK_CLEAN':
      return { ...state, isDirty: false, filePath: action.filePath }

    case 'SET_EXAM_ID':
      return { ...state, currentExamId: action.id }

    default:
      return state
  }
}
