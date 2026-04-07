import { memo, useCallback } from 'react'
import { useExamState, useExamDispatch } from '@/context/ExamContext'
import { QTYPES } from '@/constants'
import styles from './Sidebar.module.css'

export const Sidebar = memo(function Sidebar() {
  const { questions, activeQuestionIndex } = useExamState()
  const dispatch = useExamDispatch()

  const handleSelect = useCallback(
    (index: number) => {
      dispatch({ type: 'SET_ACTIVE_QUESTION', index })
    },
    [dispatch]
  )

  const handleAdd = useCallback(() => {
    dispatch({ type: 'ADD_QUESTION' })
  }, [dispatch])

  return (
    <div className={styles.sidebar}>
      {questions.map((q, i) => {
        const typeInfo = QTYPES.find((t) => t.id === q.type)
        const isActive = i === activeQuestionIndex

        return (
          <div
            key={i}
            className={isActive ? styles.itemActive : styles.itemInactive}
            onClick={() => handleSelect(i)}
          >
            <span className={styles.badge}>
              {typeInfo?.icon}
            </span>
            Q{i + 1}
            {q.text.trim() && <span className={styles.check}>&#10003;</span>}
          </div>
        )
      })}

      <button className={styles.addBtn} onClick={handleAdd}>
        + Add
      </button>
    </div>
  )
})
