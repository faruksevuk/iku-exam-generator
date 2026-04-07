import { memo } from 'react'
import type { Question } from '@/types/exam'
import { SPACES } from '@/constants/spaces'
import { blankCount } from '@/utils/helpers'
import styles from './QuestionBlock.module.css'

import type { WidthClass } from '@/hooks/usePageLayout'

interface QuestionBlockProps {
  q: Question
  qNum: number
  style?: React.CSSProperties
  widthClass?: WidthClass
  useGrid?: boolean
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const QuestionBlock = memo(function QuestionBlock({
  q,
  qNum,
  style,
  widthClass = 'full',
  useGrid = false,
}: QuestionBlockProps) {
  const space = SPACES.find((s) => s.id === q.spaceId)
  const spacePx = space?.px || 0

  return (
    <div className={styles.block} data-map-element="question" data-map-q={qNum} data-map-type={q.type} style={style}>
      {/* Header */}
      <div className={styles.blockHeader}>
        <span className={styles.qLabel}>Question{qNum}</span>
        <span className={styles.ptsBadge}>
          {q.points} pts
          {q.penaltyPerItem > 0 && q.type !== 'open' && (
            <span className={styles.penaltyInfo}> (-{q.penaltyPerItem} per false)</span>
          )}
        </span>
      </div>

      {/* Image (above question text) */}
      {q.imagePreview && (
        <img src={q.imagePreview} alt="" className={styles.qImage} />
      )}

      {/* Question text */}
      <div className={styles.qText}>{q.text || '(No text)'}</div>

      {/* Multiple Choice */}
      {q.type === 'mc' && (
        <div className={useGrid ? styles.optionGrid : undefined}>
          {q.options.map((opt, i) => (
            <div key={i} className={styles.optionRow}>
              <div
                className={styles.mcCircle}
                data-map-element="mc-bubble"
                data-map-q={qNum}
                data-map-option={ALPHA[i]}
              />
              <span className={`${styles.optionText} ${styles.optionBold}`}>
                {ALPHA[i]})
              </span>
              <span className={styles.optionText}>{opt}</span>
            </div>
          ))}
        </div>
      )}

      {/* Multi-Select */}
      {q.type === 'ms' && (
        <div className={useGrid ? styles.optionGrid : undefined}>
          {q.options.map((opt, i) => (
            <div key={i} className={styles.optionRow}>
              <div
                className={styles.msSquare}
                data-map-element="ms-checkbox"
                data-map-q={qNum}
                data-map-option={ALPHA[i]}
              />
              <span className={`${styles.optionText} ${styles.optionBold}`}>
                {ALPHA[i]})
              </span>
              <span className={styles.optionText}>{opt}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fill in the Blanks */}
      {q.type === 'fill' && q.fillText && (
        <div className={styles.fillText}>
          {q.fillText.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span
                  className={styles.fillBlank}
                  data-map-element="fill-blank"
                  data-map-q={qNum}
                  data-map-blank={i + 1}
                />
              )}
            </span>
          ))}
        </div>
      )}

      {/* Matching table */}
      {q.type === 'match' && (
        <table className={styles.matchTable}>
          <thead>
            <tr>
              <th className={styles.matchTh}>#</th>
              <th className={styles.matchTh}>Left</th>
              <th className={styles.matchTh}>#</th>
              <th className={styles.matchTh}>Right</th>
            </tr>
          </thead>
          <tbody>
            {q.matchLeft.map((left, i) => (
              <tr key={i}>
                <td className={styles.matchTdCenter}>{i + 1}</td>
                <td className={styles.matchTd}>{left}</td>
                <td className={styles.matchTdCenter}>{ALPHA[i]}</td>
                <td className={styles.matchTd}>{q.matchRight[i] ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Answer boxes for match / fill — each box is mapped */}
      {(q.type === 'match' || q.type === 'fill') && (
        <AnswerSection q={q} qNum={qNum} />
      )}

      {/* Solution area — the bounding box for open-ended / mc / ms */}
      {spacePx > 0 && (
        <div
          className={styles.solutionArea}
          style={{ height: spacePx }}
          data-map-element="solution-area"
          data-map-q={qNum}
          data-map-type={q.type}
        >
          <span className={styles.borderLabelTL}>SolutionArea{qNum}</span>
          <span className={styles.borderLabelBR}>SolutionArea{qNum}</span>
        </div>
      )}
    </div>
  )
})

/* ---------- AnswerSection ---------- */

function AnswerSection({ q, qNum }: { q: Question; qNum: number }) {
  const count =
    q.type === 'match' ? q.matchLeft.length : blankCount(q.fillText)

  if (count === 0) return null

  const answers = q.type === 'match' ? q.matchCorrect : q.fillAnswers

  return (
    <div
      className={styles.answerBox}
      data-map-element="answer-section"
      data-map-q={qNum}
      data-map-type={q.type}
    >
      <span className={styles.borderLabelTL}>SolutionArea{qNum}</span>
      <span className={styles.borderLabelBR}>SolutionArea{qNum}</span>
      <div className={styles.answerBoxItems}>
        {Array.from({ length: count }).map((_, i) => {
          const ansLen = (answers[i] || '').length || 2
          const boxW = Math.max(55, Math.min(150, ansLen * 13 + 26))
          return (
            <div key={i} className={styles.answerItem}>
              <span className={styles.answerItemLabel}>{i + 1}:</span>
              <div
                className={styles.answerItemBox}
                style={{ width: boxW }}
                data-map-element="answer-box"
                data-map-q={qNum}
                data-map-box={i + 1}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
