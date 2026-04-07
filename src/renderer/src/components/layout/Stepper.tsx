import { memo, useCallback } from 'react'
import { useExamState, useExamDispatch } from '@/context/ExamContext'
import styles from './Stepper.module.css'

const STEPS = ['Exam Info', 'Questions', 'Preview & Print'] as const

export const Stepper = memo(function Stepper() {
  const { step, questions } = useExamState()
  const dispatch = useExamDispatch()

  // Dashboard (step -1) hides the stepper entirely
  if (step === -1) return null

  const handleClick = useCallback(
    (index: number) => {
      if (index === -1) {
        dispatch({ type: 'SET_STEP', step: -1 })
        return
      }
      if (index === 0) {
        dispatch({ type: 'SET_STEP', step: 0 })
        return
      }
      if (questions.length > 0) {
        dispatch({ type: 'SET_STEP', step: index })
      }
    },
    [dispatch, questions.length]
  )

  return (
    <div className={styles.stepper}>
      <div
        className={styles.homeBtn}
        onClick={() => handleClick(-1)}
        title="Back to My Exams"
      >
        &larr; My Exams
      </div>
      {STEPS.map((label, i) => {
        let className: string
        if (i === step) {
          className = styles.stepActive
        } else if (i < step) {
          className = styles.stepDone
        } else {
          className = styles.stepPending
        }

        return (
          <div key={label} className={className} onClick={() => handleClick(i)}>
            {i < step ? '\u2713 ' : ''}
            {label}
          </div>
        )
      })}
    </div>
  )
})
