import { useState, useCallback } from 'react'
import styles from './Results.module.css'

interface ResultsProps {
  examId: string
  data: any
  onBack: () => void
  onSave: (data: any) => Promise<void>
}

export default function Results({ examId, data, onBack, onSave }: ResultsProps) {
  const [results, setResults] = useState<any>(data)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [expandedQ, setExpandedQ] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState('')

  const students = results?.students || []
  const selected = students[selectedIdx] || null
  const totalStudents = students.length
  const maxPts = students[0]?.totalMaxPoints || 0
  const avgScore = totalStudents > 0
    ? Math.round(students.reduce((s: number, st: any) => s + (st.totalScore || 0), 0) / totalStudents * 10) / 10
    : 0
  const needsReview = students.filter((s: any) =>
    Object.values(s.questions || {}).some((q: any) => q.needsReview || (q.confidence || 1) < 0.80)
  ).length

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const handleScoreChange = useCallback((studentIdx: number, qNum: string, newScore: number) => {
    setResults((prev: any) => {
      const u = JSON.parse(JSON.stringify(prev))
      const s = u.students[studentIdx]
      if (s?.questions?.[qNum]) {
        s.questions[qNum].score = newScore
        s.questions[qNum].manualOverride = true
        s.totalScore = Math.round(
          Object.values(s.questions).reduce((sum: number, q: any) => sum + (q.score || 0), 0) * 100
        ) / 100
      }
      return u
    })
    setDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    await onSave(results)
    setDirty(false)
    showToast('Results saved')
  }, [results, onSave])

  const handleDownloadExcel = useCallback(() => {
    const eId = results?.examId || examId
    const link = document.createElement('a')
    link.href = `http://localhost:8000/results/${eId}/excel`
    link.download = `${eId}_results.xlsx`
    link.click()
  }, [results, examId])

  const confClass = (c: number) => c >= 0.85 ? styles.confHigh : c >= 0.60 ? styles.confLow : styles.confVeryLow
  const statusClass = (s: string) => {
    const m: Record<string, string> = { correct: styles.statusCorrect, wrong: styles.statusWrong, partial: styles.statusPartial, blank: styles.statusBlank }
    return m[s] || styles.statusPending
  }

  const toggleExpand = (qn: string) => {
    setExpandedQ(prev => prev === qn ? null : qn)
  }

  const formatExpected = (expected: any, type: string) => {
    if (!expected) return 'N/A'
    if (type === 'multiple_choice') return `Correct: ${expected.correctOption || '?'}`
    if (type === 'multi_select') return `Correct: [${(expected.correctOptions || []).join(', ')}]`
    if (type === 'matching') {
      const m = expected.correctMatches || {}
      return Object.entries(m).map(([k, v]) => `${k} -> ${v}`).join(', ')
    }
    if (type === 'fill_blanks') {
      const b = expected.correctBlanks || {}
      return Object.entries(b).map(([k, v]) => `#${k}: "${v}"`).join(', ')
    }
    if (type === 'open_ended') return expected.text || 'See rubric'
    return JSON.stringify(expected)
  }

  return (
    <div className={styles.container}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Evaluation Results</h1>
          <p>{results?.examId || examId} &mdash; {totalStudents} student{totalStudents !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.headerBtns}>
          <button className={styles.backBtn} onClick={onBack}>&larr; Dashboard</button>
          <button className={styles.saveBtn} onClick={handleSave}>{dirty ? 'Save Changes' : 'Saved'}</button>
          <button className={styles.excelBtn} onClick={handleDownloadExcel}>Download Excel</button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalStudents}</div>
          <div className={styles.statLabel}>Students</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{avgScore}</div>
          <div className={styles.statLabel}>Avg / {maxPts}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{needsReview}</div>
          <div className={styles.statLabel}>Need Review</div>
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.leftPanel}>
          <div className={styles.studentList}>
            {students.map((s: any, idx: number) => {
              const pct = s.totalMaxPoints > 0 ? Math.round(s.totalScore / s.totalMaxPoints * 100) : 0
              const warn = Object.values(s.questions || {}).some((q: any) => q.needsReview || (q.confidence || 1) < 0.80)
              return (
                <div key={idx} className={selectedIdx === idx ? styles.studentRowActive : styles.studentRow} onClick={() => { setSelectedIdx(idx); setExpandedQ(null) }}>
                  <span className={styles.studentNum}>{s.studentNumber || `#${idx + 1}`}</span>
                  <span className={styles.studentScore}>{s.totalScore}/{s.totalMaxPoints}</span>
                  <div className={styles.studentMeta}>
                    <span className={styles.studentPct}>{pct}%</span>
                    {warn && <span className={styles.studentWarning}>Review</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.rightPanel}>
          {selected ? (
            <div className={styles.detail}>
              {/* Student number header with image + override */}
              <div className={styles.detailHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span className={styles.detailTitle}>Student Number:</span>
                    <input
                      type="text"
                      value={selected.studentNumber || ''}
                      className={styles.snInput}
                      onChange={(e) => {
                        setResults((prev: any) => {
                          const u = JSON.parse(JSON.stringify(prev))
                          u.students[selectedIdx].studentNumber = e.target.value
                          return u
                        })
                        setDirty(true)
                      }}
                    />
                    <span className={confClass(selected.studentNumberConfidence || 0)}>
                      {Math.round((selected.studentNumberConfidence || 0) * 100)}% conf
                    </span>
                  </div>
                  {selected.studentNumberImage && (
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--cl-muted)' }}>Scanned:</span>
                      <img
                        src={`data:image/jpeg;base64,${selected.studentNumberImage}`}
                        alt="Student number scan"
                        style={{ display: 'block', maxWidth: 300, border: '1px solid var(--cl-border)', borderRadius: 4, marginTop: 3 }}
                      />
                    </div>
                  )}
                </div>
                <span className={styles.detailScore}>{selected.totalScore} / {selected.totalMaxPoints}</span>
              </div>

              {Object.entries(selected.questions || {}).map(([qn, qr]: [string, any]) => {
                const isExpanded = expandedQ === qn
                return (
                  <div key={qn} className={`${styles.qRow} ${statusClass(qr.status)}`}>
                    <div className={styles.qRowHeader} onClick={() => toggleExpand(qn)} style={{ cursor: 'pointer' }}>
                      <div className={styles.qRowLeft}>
                        <span className={styles.qNum}>Q{qn}</span>
                        <span className={styles.qType}>{(qr.type || '').replace(/_/g, ' ')}</span>
                        {qr.needsReview && <span className={styles.reviewBadge}>Review</span>}
                        {qr.manualOverride && <span className={styles.overrideBadge}>Overridden</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={confClass(qr.confidence || 0)}>{Math.round((qr.confidence || 0) * 100)}%</span>
                        <span style={{ fontSize: 12, color: 'var(--cl-muted)' }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                      </div>
                    </div>

                    {/* Summary always visible */}
                    <div className={styles.qScoreRow}>
                      <span className={styles.qScoreLabel}>Score:</span>
                      <input
                        type="number" className={styles.qScoreInput}
                        value={qr.score ?? 0} min={0} max={qr.maxPoints || 100} step={0.5}
                        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) handleScoreChange(selectedIdx, qn, v) }}
                      />
                      <span className={styles.qScoreMax}>/ {qr.maxPoints}</span>
                    </div>

                    {/* Expanded detail — shows on click */}
                    {isExpanded && (
                      <div className={styles.expandedDetail}>
                        {/* Explanation */}
                        {qr.explanation && (
                          <div className={styles.detailSection}>
                            <div className={styles.detailSectionLabel}>AI Result</div>
                            <div className={styles.qExplanation}>{qr.explanation}</div>
                          </div>
                        )}

                        {/* Expected answer */}
                        <div className={styles.detailSection}>
                          <div className={styles.detailSectionLabel}>Expected Answer</div>
                          <div className={styles.expectedText}>{formatExpected(qr.expected, qr.type)}</div>
                        </div>

                        {/* Open-ended: show only the solution area crop */}
                        {qr.type === 'open_ended' && qr.solutionAreaImage && (
                          <div className={styles.detailSection}>
                            <div className={styles.detailSectionLabel}>Student's Written Answer</div>
                            <img
                              src={`data:image/jpeg;base64,${qr.solutionAreaImage}`}
                              alt="Solution area"
                              className={styles.answerImg}
                            />
                          </div>
                        )}

                        {/* Other types: show the full question bounding box */}
                        {qr.type !== 'open_ended' && qr.answerImage && (
                          <div className={styles.detailSection}>
                            <div className={styles.detailSectionLabel}>Student's Answer (Scanned)</div>
                            <img
                              src={`data:image/jpeg;base64,${qr.answerImage}`}
                              alt="Student answer"
                              className={styles.answerImg}
                            />
                          </div>
                        )}

                        {/* OCR readings for match/fill */}
                        {qr.ocrAnswers && (
                          <div className={styles.detailSection}>
                            <div className={styles.detailSectionLabel}>OCR Readings</div>
                            <div className={styles.ocrGrid}>
                              {Object.entries(qr.ocrAnswers).map(([idx, val]: [string, any]) => (
                                <div key={idx} className={styles.ocrItem}>
                                  <span className={styles.ocrIdx}>#{idx}</span>
                                  <span className={styles.ocrVal}>{val || '(blank)'}</span>
                                  <span className={styles.ocrConf}>{Math.round((qr.ocrConfidences?.[idx] || 0) * 100)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expected text for open-ended */}
                        {qr.expectedText && (
                          <div className={styles.detailSection}>
                            <div className={styles.detailSectionLabel}>Grading Rubric</div>
                            <div className={styles.rubricText}>{qr.expectedText}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={styles.emptyDetail}>Select a student to view details</div>
          )}
        </div>
      </div>
    </div>
  )
}
