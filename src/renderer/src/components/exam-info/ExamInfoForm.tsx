import { memo, useCallback, type ChangeEvent } from 'react'
import { useExamState, useExamDispatch } from '@/context/ExamContext'
import { EXAM_TYPES } from '@/constants/examTypes'
import type { ExamInfo } from '@/types/exam'
import shared from '@/components/shared/shared.module.css'
import styles from './ExamInfoForm.module.css'

export const ExamInfoForm = memo(function ExamInfoForm() {
  const { exam } = useExamState()
  const dispatch = useExamDispatch()

  const handleChange = useCallback(
    (field: keyof ExamInfo) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        dispatch({ type: 'SET_EXAM_FIELD', field, value: e.target.value })
      },
    [dispatch]
  )

  const handleNext = useCallback(() => {
    dispatch({ type: 'INIT_QUESTIONS' })
    dispatch({ type: 'SET_STEP', step: 1 })
  }, [dispatch])

  return (
    <div className={shared.card}>
      <h2 className={styles.heading}>Exam Information</h2>

      <div className={styles.grid}>
        <div className={shared.formGroup}>
          <label className={shared.label}>Faculty</label>
          <input
            className={shared.input}
            value={exam.faculty}
            onChange={handleChange('faculty')}
            placeholder="Faculty"
          />
        </div>

        <div className={shared.formGroup}>
          <label className={shared.label}>Department</label>
          <input
            className={shared.input}
            value={exam.department}
            onChange={handleChange('department')}
            placeholder="Department"
          />
        </div>

        <div className={shared.formGroup}>
          <label className={shared.label}>Course Name</label>
          <input
            className={shared.input}
            value={exam.course}
            onChange={handleChange('course')}
            placeholder="Course Name"
          />
        </div>

        <div className={shared.formGroup}>
          <label className={shared.label}>Course Code</label>
          <input
            className={shared.input}
            value={exam.courseCode}
            onChange={handleChange('courseCode')}
            placeholder="Course Code"
          />
        </div>
      </div>

      <div className={shared.formGroup} style={{ marginTop: 10 }}>
        <label className={shared.label}>Exam Type</label>
        <select
          className={shared.select}
          value={exam.examType}
          onChange={handleChange('examType')}
        >
          <option value="">Select exam type</option>
          {EXAM_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.grid} style={{ marginTop: 10 }}>
        <div className={shared.formGroup}>
          <label className={shared.label}>Date</label>
          <input
            className={shared.input}
            type="date"
            value={exam.date}
            onChange={handleChange('date')}
          />
        </div>

        <div className={shared.formGroup}>
          <label className={shared.label}>Duration (minutes)</label>
          <input
            className={shared.input}
            type="number"
            value={exam.duration}
            onChange={handleChange('duration')}
            placeholder="90"
          />
        </div>
      </div>

      <div className={`${shared.formGroup} ${styles.instructionsRow}`}>
        <label className={shared.label}>Custom Instructions</label>
        <textarea
          className={shared.textarea}
          value={exam.instructions}
          onChange={handleChange('instructions')}
          placeholder={"Each line becomes a bullet point on the exam paper.\ne.g.:\nNo calculators allowed.\nShow all your work.\nCheating will result in zero grade."}
          style={{ minHeight: 80 }}
        />
        {exam.instructions.trim() && (
          <div className={styles.bulletPreview}>
            <span className={styles.bulletPreviewLabel}>Preview:</span>
            <ul className={styles.bulletList}>
              {exam.instructions.split('\n').filter(l => l.trim()).map((line, i) => (
                <li key={i}>{line.trim()}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.footer} style={{ marginTop: 14 }}>
        <button className={shared.btnPrimary} onClick={handleNext}>
          Edit Questions &rarr;
        </button>
      </div>
    </div>
  )
})
