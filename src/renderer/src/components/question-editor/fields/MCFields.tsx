import { memo, useCallback, type ChangeEvent } from 'react'
import { useExamDispatch } from '@/context/ExamContext'
import type { Question } from '@/types/exam'
import shared from '@/components/shared/shared.module.css'
import styles from './fields.module.css'

interface MCFieldsProps {
  q: Question
  index: number
}

const LETTERS = 'ABCDEFGHIJ'

export const MCFields = memo(function MCFields({ q, index }: MCFieldsProps) {
  const dispatch = useExamDispatch()
  const isMulti = q.type === 'ms'

  const handleOptionText = useCallback(
    (optIndex: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const updated = [...q.options]
      updated[optIndex] = e.target.value
      dispatch({ type: 'UPDATE_QUESTION', index, field: 'options', value: updated })
    },
    [dispatch, index, q.options]
  )

  const handleSelectCorrect = useCallback(
    (optIndex: number) => {
      if (isMulti) {
        const current = [...q.correctAnswers]
        const pos = current.indexOf(optIndex)
        if (pos >= 0) {
          current.splice(pos, 1)
        } else {
          current.push(optIndex)
        }
        dispatch({ type: 'UPDATE_QUESTION', index, field: 'correctAnswers', value: current })
      } else {
        dispatch({ type: 'UPDATE_QUESTION', index, field: 'correctAnswer', value: optIndex })
      }
    },
    [dispatch, index, isMulti, q.correctAnswers]
  )

  const handleRemoveOption = useCallback(
    (optIndex: number) => {
      if (q.options.length <= 2) return
      const updated = q.options.filter((_, i) => i !== optIndex)

      if (isMulti) {
        const adjusted = q.correctAnswers
          .filter((ci) => ci !== optIndex)
          .map((ci) => (ci > optIndex ? ci - 1 : ci))
        dispatch({ type: 'UPDATE_QUESTION', index, field: 'options', value: updated })
        dispatch({ type: 'UPDATE_QUESTION', index, field: 'correctAnswers', value: adjusted })
      } else {
        let newCorrect = q.correctAnswer
        if (q.correctAnswer === optIndex) newCorrect = 0
        else if (q.correctAnswer > optIndex) newCorrect = q.correctAnswer - 1
        dispatch({ type: 'UPDATE_QUESTION', index, field: 'options', value: updated })
        dispatch({ type: 'UPDATE_QUESTION', index, field: 'correctAnswer', value: newCorrect })
      }
    },
    [dispatch, index, isMulti, q.options, q.correctAnswer, q.correctAnswers]
  )

  const handleAddOption = useCallback(() => {
    if (q.options.length >= 6) return
    dispatch({
      type: 'UPDATE_QUESTION',
      index,
      field: 'options',
      value: [...q.options, ''],
    })
  }, [dispatch, index, q.options])

  return (
    <div>
      {q.options.map((opt, i) => {
        const isSelected = isMulti
          ? q.correctAnswers.includes(i)
          : q.correctAnswer === i

        return (
          <div key={i} className={styles.optionRow}>
            {isMulti ? (
              <div
                className={isSelected ? styles.squareActive : styles.square}
                onClick={() => handleSelectCorrect(i)}
              >
                {isSelected && '\u2713'}
              </div>
            ) : (
              <div
                className={isSelected ? styles.circleActive : styles.circle}
                onClick={() => handleSelectCorrect(i)}
              />
            )}
            <span className={styles.optionLabel}>{LETTERS[i]}</span>
            <input
              className={`${shared.input} ${styles.optionInput}`}
              value={opt}
              onChange={handleOptionText(i)}
              placeholder={`Option ${LETTERS[i]}`}
            />
            {q.options.length > 2 && (
              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveOption(i)}
              >
                &times;
              </button>
            )}
          </div>
        )
      })}

      {q.options.length < 6 && (
        <button className={styles.addOptionBtn} onClick={handleAddOption}>
          + Add Option
        </button>
      )}
    </div>
  )
})
