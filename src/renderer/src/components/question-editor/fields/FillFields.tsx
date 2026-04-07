import { memo, useCallback, type ChangeEvent } from 'react'
import { useExamDispatch } from '@/context/ExamContext'
import type { Question } from '@/types/exam'
import { blankCount } from '@/utils/helpers'
import shared from '@/components/shared/shared.module.css'
import styles from './fields.module.css'

interface FillFieldsProps {
  q: Question
  index: number
}

export const FillFields = memo(function FillFields({ q, index }: FillFieldsProps) {
  const dispatch = useExamDispatch()

  const handleFillTextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value
      const count = blankCount(newText)
      const current = q.fillAnswers

      let newAnswers: string[]
      if (count > current.length) {
        newAnswers = [...current, ...Array(count - current.length).fill('')]
      } else {
        newAnswers = current.slice(0, count)
      }

      dispatch({
        type: 'UPDATE_QUESTION_FIELDS',
        index,
        fields: {
          fillText: newText,
          fillAnswers: newAnswers,
        },
      })
    },
    [dispatch, index, q.fillAnswers]
  )

  const handleAnswerChange = useCallback(
    (blankIndex: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const updated = [...q.fillAnswers]
      updated[blankIndex] = e.target.value
      dispatch({
        type: 'UPDATE_QUESTION_FIELDS',
        index,
        fields: { fillAnswers: updated },
      })
    },
    [dispatch, index, q.fillAnswers]
  )

  const count = blankCount(q.fillText)

  return (
    <div>
      <div className={shared.formGroup}>
        <label className={shared.label}>Text with Blanks (use ___)</label>
        <textarea
          className={shared.textarea}
          value={q.fillText}
          onChange={handleFillTextChange}
          placeholder="The capital of France is ___ and the capital of Germany is ___."
        />
      </div>

      {count > 0 && (
        <div className={styles.blankAnswerRow}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className={styles.blankItem}>
              <span className={styles.blankLabel}>#{i + 1}</span>
              <input
                className={`${shared.input} ${styles.blankInput}`}
                value={q.fillAnswers[i] || ''}
                onChange={handleAnswerChange(i)}
                placeholder={`Answer ${i + 1}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
