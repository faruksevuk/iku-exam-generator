import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import { examReducer, initialState, type ExamState } from './examReducer'
import type { ExamAction } from './actions'

const ExamStateContext = createContext<ExamState | null>(null)
const ExamDispatchContext = createContext<Dispatch<ExamAction> | null>(null)

export function ExamProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(examReducer, initialState)

  return (
    <ExamStateContext.Provider value={state}>
      <ExamDispatchContext.Provider value={dispatch}>
        {children}
      </ExamDispatchContext.Provider>
    </ExamStateContext.Provider>
  )
}

export function useExamState(): ExamState {
  const ctx = useContext(ExamStateContext)
  if (!ctx) throw new Error('useExamState must be used within ExamProvider')
  return ctx
}

export function useExamDispatch(): Dispatch<ExamAction> {
  const ctx = useContext(ExamDispatchContext)
  if (!ctx) throw new Error('useExamDispatch must be used within ExamProvider')
  return ctx
}
