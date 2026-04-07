import { memo, useCallback, type ChangeEvent } from 'react'
import { useExamDispatch } from '@/context/ExamContext'
import type { Question } from '@/types/exam'
import shared from '@/components/shared/shared.module.css'
import styles from './fields.module.css'

interface MatchFieldsProps {
  q: Question
  index: number
}

const LETTERS = 'ABCDEFGHIJ'

export const MatchFields = memo(function MatchFields({ q, index }: MatchFieldsProps) {
  const dispatch = useExamDispatch()

  const handleLeftChange = useCallback(
    (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const updated = [...q.matchLeft]
      updated[i] = e.target.value
      dispatch({ type: 'UPDATE_QUESTION', index, field: 'matchLeft', value: updated })
    },
    [dispatch, index, q.matchLeft]
  )

  const handleRightChange = useCallback(
    (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const updated = [...q.matchRight]
      updated[i] = e.target.value
      dispatch({ type: 'UPDATE_QUESTION', index, field: 'matchRight', value: updated })
    },
    [dispatch, index, q.matchRight]
  )

  const handleAddPair = useCallback(() => {
    dispatch({
      type: 'UPDATE_QUESTION_FIELDS',
      index,
      fields: {
        matchLeft: [...q.matchLeft, ''],
        matchRight: [...q.matchRight, ''],
        matchCorrect: [...q.matchCorrect, ''],
      },
    })
  }, [dispatch, index, q.matchLeft, q.matchRight, q.matchCorrect])

  const handleRemovePair = useCallback(() => {
    if (q.matchLeft.length <= 2) return
    dispatch({
      type: 'UPDATE_QUESTION_FIELDS',
      index,
      fields: {
        matchLeft: q.matchLeft.slice(0, -1),
        matchRight: q.matchRight.slice(0, -1),
        matchCorrect: q.matchCorrect.slice(0, -1),
      },
    })
  }, [dispatch, index, q.matchLeft, q.matchRight, q.matchCorrect])

  const handleCorrectChange = useCallback(
    (i: number) => (e: ChangeEvent<HTMLSelectElement>) => {
      const updated = [...q.matchCorrect]
      updated[i] = e.target.value
      dispatch({ type: 'UPDATE_QUESTION', index, field: 'matchCorrect', value: updated })
    },
    [dispatch, index, q.matchCorrect]
  )

  return (
    <div>
      <div className={styles.matchColumns}>
        {/* Left column */}
        <div className={styles.matchColumn}>
          {q.matchLeft.map((item, i) => (
            <div key={i} className={styles.matchItemRow}>
              <span className={styles.matchItemLabel}>{i + 1}.</span>
              <input
                className={`${shared.input} ${styles.matchItemInput}`}
                value={item}
                onChange={handleLeftChange(i)}
                placeholder={`Item ${i + 1}`}
              />
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className={styles.matchColumn}>
          {q.matchRight.map((item, i) => (
            <div key={i} className={styles.matchItemRow}>
              <span className={styles.matchItemLabel}>{LETTERS[i]}.</span>
              <input
                className={`${shared.input} ${styles.matchItemInput}`}
                value={item}
                onChange={handleRightChange(i)}
                placeholder={`Match ${LETTERS[i]}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Add / Remove buttons */}
      <div className={styles.pairBtnRow}>
        <button className={styles.pairBtn} onClick={handleAddPair}>
          + Pair
        </button>
        {q.matchLeft.length > 2 && (
          <button className={styles.pairRemoveBtn} onClick={handleRemovePair}>
            &minus;
          </button>
        )}
      </div>

      {/* Correct Matches */}
      <div style={{ marginTop: 6 }}>
        <span className={shared.label}>Correct Matches</span>
        <div className={styles.correctMatchRow}>
          {q.matchLeft.map((_, i) => (
            <div key={i} className={styles.correctMatchItem}>
              <span className={styles.correctMatchLabel}>{i + 1} &rarr;</span>
              <select
                className={`${shared.select} ${styles.correctMatchSelect}`}
                value={q.matchCorrect[i] || ''}
                onChange={handleCorrectChange(i)}
              >
                <option value="">--</option>
                {q.matchRight.map((_, ri) => (
                  <option key={ri} value={LETTERS[ri]}>
                    {LETTERS[ri]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
