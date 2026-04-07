import { memo, useState, type ChangeEvent } from 'react'
import { useExamState, useExamDispatch } from '@/context/ExamContext'
import { QTYPES } from '@/constants'
import type { QuestionType } from '@/types/exam'
import { validateImageFile, readFileAsDataURL } from '@/utils/validation'
import { MCFields } from './fields/MCFields'
import { OpenFields } from './fields/OpenFields'
import { MatchFields } from './fields/MatchFields'
import { FillFields } from './fields/FillFields'
import { SpaceSelector } from './fields/SpaceSelector'
import shared from '@/components/shared/shared.module.css'
import styles from './EditorPanel.module.css'

export const EditorPanel = memo(function EditorPanel() {
  const { questions, activeQuestionIndex } = useExamState()
  const dispatch = useExamDispatch()
  const [imageError, setImageError] = useState<string | null>(null)

  const q = questions[activeQuestionIndex]
  if (!q) return null

  const idx = activeQuestionIndex
  const total = questions.length

  const handleTypeChange = (typeId: QuestionType) => {
    dispatch({ type: 'UPDATE_QUESTION', index: idx, field: 'type', value: typeId })
  }

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'UPDATE_QUESTION', index: idx, field: 'text', value: e.target.value })
  }

  const handlePointsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val)) {
      dispatch({ type: 'UPDATE_QUESTION', index: idx, field: 'points', value: val })
    }
  }

  const handleDuplicate = () => {
    dispatch({ type: 'DUPLICATE_QUESTION', index: idx })
  }

  const handleDelete = () => {
    dispatch({ type: 'DELETE_QUESTION', index: idx })
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = validateImageFile(file)
    if (!result.valid) {
      setImageError(result.error || 'Invalid image.')
      return
    }
    setImageError(null)
    try {
      const dataUrl = await readFileAsDataURL(file)
      dispatch({ type: 'SET_QUESTION_IMAGE', index: idx, field: 'imagePreview', dataUrl })
    } catch {
      setImageError('Failed to read image file.')
    }
    // Reset input value so same file can be re-uploaded
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    dispatch({ type: 'UPDATE_QUESTION', index: idx, field: 'imagePreview', value: null })
  }

  return (
    <div className={styles.panel}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <h3 className={styles.headerLeft}>
          Question {idx + 1} <span style={{ fontWeight: 400, color: 'var(--cl-muted)' }}>/ {total}</span>
        </h3>
        <div className={styles.headerRight}>
          <span className={styles.ptsLabel}>Points</span>
          <input
            className={`${shared.input} ${styles.ptsInput}`}
            type="number"
            min={1}
            max={100}
            value={q.points}
            onChange={handlePointsChange}
          />
          {q.type !== 'open' && (
            <>
              <span className={styles.ptsLabel}>Penalty</span>
              <input
                className={`${shared.input} ${styles.ptsInput}`}
                type="number"
                min={0}
                step={0.5}
                value={q.penaltyPerItem}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0) {
                    dispatch({ type: 'UPDATE_QUESTION', index: idx, field: 'penaltyPerItem', value: val })
                  }
                }}
                title="Penalty per wrong item (e.g. per wrong option, per wrong blank)"
              />
            </>
          )}
          <button className={shared.btnSecondary} onClick={handleDuplicate} style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
            Duplicate
          </button>
          {total > 1 && (
            <button className={shared.btnDanger} onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Type Selector ── */}
      <div className={styles.typeSelector}>
        {QTYPES.map((t) => (
          <button
            key={t.id}
            className={q.type === t.id ? styles.typeBtnActive : styles.typeBtn}
            onClick={() => handleTypeChange(t.id)}
          >
            <span className={styles.typeIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Image Upload (above question text) ── */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Attachment (optional)</label>
        {!q.imagePreview ? (
          <div className={styles.imageZone}>
            <input
              className={styles.imageZoneInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageUpload}
            />
            <div className={styles.imageZoneText}>Click to upload an image</div>
            <div className={styles.imageZoneHint}>PNG, JPG, WebP &middot; Max 5 MB</div>
          </div>
        ) : (
          <div className={styles.imagePreview}>
            <img src={q.imagePreview} alt="Attached" className={styles.imagePreviewImg} />
            <button className={styles.imageRemoveBtn} onClick={handleRemoveImage} title="Remove image">
              &times;
            </button>
          </div>
        )}
        {imageError && <span className={shared.errorText}>{imageError}</span>}
      </div>

      {/* ── Question Text ── */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Question Text</label>
        <textarea
          className={`${shared.textarea} ${styles.questionTextarea}`}
          value={q.text}
          onChange={handleTextChange}
          placeholder="Type your question here..."
        />
      </div>

      <hr className={styles.divider} />

      {/* ── Type-specific Fields ── */}
      {(q.type === 'mc' || q.type === 'ms') && <MCFields q={q} index={idx} />}
      {q.type === 'open' && <OpenFields q={q} index={idx} />}
      {q.type === 'match' && <MatchFields q={q} index={idx} />}
      {q.type === 'fill' && <FillFields q={q} index={idx} />}

      <hr className={styles.divider} />

      {/* ── Space / Solution Area ── */}
      <SpaceSelector q={q} index={idx} />
    </div>
  )
})
