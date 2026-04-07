import { memo } from 'react'
import { LOGO } from '@/constants/logo'
import { EXAM_TYPES } from '@/constants/examTypes'
import type { ExamInfo } from '@/types/exam'

interface ExamHeaderProps {
  exam: ExamInfo
  totalPts: number
  autoInstructions: string[]
}

const STUDENT_ID_LENGTH = 10

export const ExamHeader = memo(function ExamHeader({
  exam,
  totalPts,
  autoInstructions,
}: ExamHeaderProps) {
  const examTypeLabel =
    EXAM_TYPES.find((t) => t.id === exam.examType)?.label ?? exam.examType

  return (
    <div style={{ marginBottom: 8 }}>
      {/* University header with border bottom */}
      <div
        style={{
          textAlign: 'center',
          borderBottom: '1.5px solid #333',
          paddingBottom: 6,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 2,
          }}
        >
          {LOGO ? (
            <img
              src={LOGO}
              alt="IKU"
              style={{ width: 48, height: 48, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                border: '1px solid #ccc',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 7,
                color: '#999',
              }}
            >
              LOGO
            </div>
          )}
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              T.C. &#304;stanbul K&uuml;lt&uuml;r &Uuml;niversitesi
            </div>
            <div style={{ fontSize: 9, color: '#444' }}>
              {exam.faculty} &mdash; {exam.department}
            </div>
          </div>
        </div>

        {/* Course title */}
        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>
          {exam.courseCode ? `[${exam.courseCode}] ` : ''}
          {exam.course} &mdash; {examTypeLabel} Exam
        </div>

        {/* Date / Duration / Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 9,
            color: '#555',
            marginTop: 2,
          }}
        >
          <span>Date: {exam.date || '__.__.____'}</span>
          <span>Duration: {exam.duration || '\u2014'} min</span>
          <span>Total: {totalPts} pts</span>
        </div>
      </div>

      {/* Student info — Full Name and Student Number side by side */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {/* Full Name */}
        <div
          style={{
            flex: 1,
            border: '1.5px solid #333',
            borderRadius: 3,
            padding: '5px 8px',
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#555',
              marginBottom: 3,
            }}
          >
            Full Name
          </div>
          <div style={{ height: 22, borderBottom: '2px solid #ccc' }} />
        </div>

        {/* Student Number — 10 characters */}
        <div
          data-map-element="student-number-region"
          style={{
            border: '1.5px solid #333',
            borderRadius: 3,
            padding: '5px 8px',
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#555',
              marginBottom: 3,
            }}
          >
            Student Number
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: STUDENT_ID_LENGTH }).map((_, i) => (
              <div
                key={i}
                data-map-element="student-number-box"
                data-map-digit={i}
                style={{
                  width: 28,
                  height: 34,
                  border: '2px solid #333',
                  borderRadius: 2,
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 7,
              color: '#999',
              margin: '2px 0 0',
              textAlign: 'center',
            }}
          >
            Write legibly inside each box
          </div>
        </div>
      </div>

      {/* Instructions */}
      {(exam.instructions || autoInstructions.length > 0) && (
        <div
          style={{
            background: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: 3,
            padding: '5px 8px',
            marginBottom: 8,
            fontSize: 9,
            color: '#444',
          }}
        >
          <strong>Instructions:</strong>
          <ul
            style={{
              margin: '3px 0 0',
              paddingLeft: 14,
              lineHeight: 1.6,
            }}
          >
            {exam.instructions && exam.instructions.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
              <li key={`custom-${i}`}>{line.trim()}</li>
            ))}
            {autoInstructions.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI evaluation notice */}
      <div
        style={{
          border: '1.5px solid #333',
          borderRadius: 3,
          padding: '5px 8px',
          marginBottom: 6,
          fontSize: 8,
          color: '#333',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ fontSize: 9 }}>&#9888; AI-Evaluated Exam</strong>
        <span style={{ display: 'block', marginTop: 2 }}>
          This exam paper will be digitally scanned and evaluated by an AI system.
          Do NOT scratch, fold, or damage the black corner markers (&FilledSmallSquare;), the QR code, or the answer boxes.
          Write your answers clearly and only inside the designated areas. Any damage to the markers may result in processing errors.
        </span>
      </div>
    </div>
  )
})
