import { memo, useCallback } from 'react'
import { useExamDispatch } from '@/context/ExamContext'
import { SPACES } from '@/constants'
import type { Question } from '@/types/exam'
import shared from '@/components/shared/shared.module.css'
import styles from './fields.module.css'

interface SpaceSelectorProps {
  q: Question
  index: number
}

export const SpaceSelector = memo(function SpaceSelector({ q, index }: SpaceSelectorProps) {
  const dispatch = useExamDispatch()

  const handleSelect = useCallback(
    (spaceId: number) => {
      dispatch({ type: 'UPDATE_QUESTION', index, field: 'spaceId', value: spaceId })
    },
    [dispatch, index]
  )

  const isOpen = q.type === 'open'
  const label = isOpen ? 'Answer Area' : 'Solution Area'
  // Open-ended: skip "None" (min Tiny), show all including XXL
  // Other types: show up to XL, no XXL, include None
  const availableSpaces = isOpen
    ? SPACES.filter(s => s.id > 0)
    : SPACES.filter(s => s.id <= 5)

  return (
    <div style={{ marginTop: 8 }}>
      <label className={shared.label}>{label}{isOpen && <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--cl-muted)' }}> (required for open-ended)</span>}</label>
      <div className={styles.spaceRow}>
        {availableSpaces.map((s) => (
          <button
            key={s.id}
            className={q.spaceId === s.id ? styles.spaceBtnActive : styles.spaceBtn}
            onClick={() => handleSelect(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
})
