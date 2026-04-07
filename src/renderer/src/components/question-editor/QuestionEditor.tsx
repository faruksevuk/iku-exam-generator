import { useCallback } from 'react'
import { useExamState, useExamDispatch } from '@/context/ExamContext'
import { Sidebar } from './Sidebar'
import { EditorPanel } from './EditorPanel'
import shared from '@/components/shared/shared.module.css'
import styles from './QuestionEditor.module.css'

export function QuestionEditor() {
  const { questions, activeQuestionIndex } = useExamState()
  const dispatch = useExamDispatch()

  const isFirst = activeQuestionIndex === 0
  const isLast = activeQuestionIndex === questions.length - 1

  const goInfo = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: 0 })
  }, [dispatch])

  const goPrev = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_QUESTION', index: activeQuestionIndex - 1 })
  }, [dispatch, activeQuestionIndex])

  const goNext = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_QUESTION', index: activeQuestionIndex + 1 })
  }, [dispatch, activeQuestionIndex])

  const goPreview = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: 2 })
  }, [dispatch])

  return (
    <div className={shared.card}>
      <h2 className={styles.heading}>Question Editor</h2>

      <div className={styles.layout}>
        <Sidebar />
        <EditorPanel />
      </div>

      <div className={styles.footer} style={{ marginTop: 14 }}>
        <button className={shared.btnSecondary} onClick={goInfo}>
          &larr; Info
        </button>

        <div className={styles.footerRight}>
          {!isFirst && (
            <button className={shared.btnSecondary} onClick={goPrev}>
              &larr; Prev
            </button>
          )}
          {!isLast && (
            <button className={shared.btnPrimary} onClick={goNext}>
              Next &rarr;
            </button>
          )}
          {isLast && (
            <button className={shared.btnPrimary} onClick={goPreview}>
              Preview &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
