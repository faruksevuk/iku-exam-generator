import { memo, useCallback, useState, type ChangeEvent } from 'react'
import { useExamDispatch } from '@/context/ExamContext'
import type { Question } from '@/types/exam'
import { validateImageFile, readFileAsDataURL } from '@/utils/validation'
import shared from '@/components/shared/shared.module.css'
import styles from './fields.module.css'

interface OpenFieldsProps {
  q: Question
  index: number
}

export const OpenFields = memo(function OpenFields({ q, index }: OpenFieldsProps) {
  const dispatch = useExamDispatch()
  const [imageError, setImageError] = useState<string | null>(null)

  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: 'UPDATE_QUESTION', index, field: 'correctText', value: e.target.value })
    },
    [dispatch, index]
  )

  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const result = validateImageFile(file)
      if (!result.valid) { setImageError(result.error || 'Invalid image.'); return }
      setImageError(null)
      try {
        // Store the local file path for the JSON map (not the base64 data)
        const filePath = (file as any).path || file.name
        // Also read a small preview for the UI
        const dataUrl = await readFileAsDataURL(file)
        dispatch({
          type: 'UPDATE_QUESTION_FIELDS',
          index,
          fields: {
            correctImagePreview: dataUrl,
            // Store path in correctText metadata — we append it after a separator
            // Actually, let's just use the correctImagePreview field and extract path in mapGenerator
          },
        })
        // Store file path as a data attribute we can read later
        // For now, the Electron file input provides file.path
        ;(window as any).__lastExpectedAnswerPath = (window as any).__lastExpectedAnswerPath || {}
        ;(window as any).__lastExpectedAnswerPath[index] = filePath
      } catch { setImageError('Failed to read image file.') }
      e.target.value = ''
    },
    [dispatch, index]
  )

  const handleRemoveImage = useCallback(() => {
    dispatch({ type: 'UPDATE_QUESTION', index, field: 'correctImagePreview', value: null })
    if ((window as any).__lastExpectedAnswerPath) {
      delete (window as any).__lastExpectedAnswerPath[index]
    }
  }, [dispatch, index])

  // Get stored file path if available
  const storedPath = (window as any).__lastExpectedAnswerPath?.[index] || ''

  return (
    <div className={styles.expectedAnswer}>
      <span className={styles.expectedLabel}>Expected Answer / AI Evaluation Rubric</span>

      <div className={styles.aiHint}>
        This answer will be evaluated by AI. You can provide both text criteria and a reference image.
        Use the text field to specify what the AI should look for (key concepts, required formulas, grading rubric, partial credit rules, etc.)
      </div>

      <label className={styles.expectedSubLabel}>Text Criteria</label>
      <textarea
        className={`${shared.textarea} ${styles.expectedTextarea}`}
        value={q.correctText}
        onChange={handleTextChange}
        placeholder="e.g. Student must mention: (1) definition of polymorphism, (2) at least one real-world example. Partial credit: 3pts per point."
      />

      <label className={styles.expectedSubLabel}>Reference Image (optional)</label>
      {!q.correctImagePreview ? (
        <>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageUpload}
            style={{ fontSize: 12 }}
          />
          {imageError && <span className={shared.errorText}>{imageError}</span>}
        </>
      ) : (
        <div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={q.correctImagePreview}
              alt="Reference"
              style={{ maxWidth: 200, borderRadius: 6, border: '1px solid #ddd' }}
            />
            <button
              onClick={handleRemoveImage}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 20, height: 20, borderRadius: '50%',
                background: '#dc2626', color: '#fff', border: 'none',
                fontSize: 11, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >&times;</button>
          </div>
          {storedPath && (
            <div style={{ fontSize: 10, color: 'var(--cl-muted)', marginTop: 4, wordBreak: 'break-all' }}>
              Path: {storedPath}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
