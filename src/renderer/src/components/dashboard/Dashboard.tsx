import { useState, useEffect, useCallback } from 'react'
import { useExamDispatch } from '@/context/ExamContext'
import { EXAM_TYPES } from '@/constants/examTypes'
import type { ExamFile } from '@/types/exam'
import styles from './Dashboard.module.css'
import Results from '../results/Results'

interface SavedExamMeta {
  id: string
  courseCode: string
  course: string
  examType: string
  date: string
  faculty: string
  department: string
  questionCount: number
  totalPoints: number
  updatedAt: string
  hasMap: boolean
  hasResults: boolean
}

export default function Dashboard() {
  const dispatch = useExamDispatch()
  const [exams, setExams] = useState<SavedExamMeta[]>([])
  const [loading, setLoading] = useState(true)

  const api = (window as any).electronAPI

  const refresh = useCallback(async () => {
    if (!api?.storeList) {
      setLoading(false)
      return
    }
    const list = await api.storeList()
    setExams(list)
    setLoading(false)
  }, [api])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleNew = useCallback(() => {
    dispatch({ type: 'NEW_EXAM' })
  }, [dispatch])

  const handleEdit = useCallback(async (id: string) => {
    if (!api?.storeLoad) return
    const raw = await api.storeLoad(id)
    if (!raw) return
    try {
      const file: ExamFile = JSON.parse(raw)
      dispatch({
        type: 'LOAD_EXAM',
        exam: file.exam,
        questions: file.questions,
        filePath: '',
      })
      dispatch({ type: 'SET_EXAM_ID', id })
    } catch { /* ignore */ }
  }, [api, dispatch])

  const handleView = useCallback(async (id: string) => {
    if (!api?.storeLoad) return
    const raw = await api.storeLoad(id)
    if (!raw) return
    try {
      const file: ExamFile = JSON.parse(raw)
      dispatch({
        type: 'LOAD_EXAM',
        exam: file.exam,
        questions: file.questions,
        filePath: '',
      })
      dispatch({ type: 'SET_EXAM_ID', id })
      dispatch({ type: 'SET_STEP', step: 2 })
    } catch { /* ignore */ }
  }, [api, dispatch])

  const handleDuplicate = useCallback(async (id: string) => {
    if (!api?.storeDuplicate) return
    await api.storeDuplicate(id)
    refresh()
  }, [api, refresh])

  const handleDelete = useCallback(async (id: string, name: string) => {
    const ok = confirm(`Delete "${name}"? This cannot be undone.`)
    if (!ok) return
    if (!api?.storeDelete) return
    await api.storeDelete(id)
    refresh()
  }, [api, refresh])

  const [evaluating, setEvaluating] = useState<string | null>(null)
  const [evalResult, setEvalResult] = useState<any>(null)

  const handleEvaluate = useCallback(async (id: string) => {
    if (!api?.evaluatePickPdf || !api?.evaluateRun) return

    // Step 1: Load the stored map for this exam
    const mapRaw = await api.storeLoadMap?.(id)
    if (!mapRaw) {
      alert('No exam map found. Please open the exam in Preview and click "Save Exam" first to generate the coordinate map.')
      return
    }

    // Step 2: Pick the scanned PDF
    const pickResult = await api.evaluatePickPdf()
    if (!pickResult.success || !pickResult.filePath) return

    // Step 3: Send to backend
    setEvaluating(id)
    const backendUrl = 'http://localhost:8000'
    const result = await api.evaluateRun(pickResult.filePath, mapRaw, backendUrl)

    if (result.success && result.data) {
      // Save results locally alongside the exam
      await api.storeSaveResults?.(id, JSON.stringify(result.data, null, 2))
      setEvalResult(result.data)
      refresh() // refresh to show "has results" badge
      alert(`Evaluation complete! ${result.data.totalStudents} student(s) processed.`)
    } else {
      alert(`Evaluation failed: ${result.error || 'Unknown error'}`)
    }
    setEvaluating(null)
  }, [api, refresh])

  const [viewingResultsId, setViewingResultsId] = useState<string | null>(null)
  const [viewingResultsData, setViewingResultsData] = useState<any>(null)

  const handleViewResults = useCallback(async (id: string) => {
    if (!api?.storeLoadResults) return
    const raw = await api.storeLoadResults(id)
    if (!raw) { alert('No results found.'); return }
    try {
      const data = JSON.parse(raw)
      setViewingResultsId(id)
      setViewingResultsData(data)
    } catch { alert('Failed to parse results.') }
  }, [api])

  const handleSaveResults = useCallback(async (data: any) => {
    if (!viewingResultsId || !api?.storeSaveResults) return
    await api.storeSaveResults(viewingResultsId, JSON.stringify(data, null, 2))
    setViewingResultsData(data)
  }, [api, viewingResultsId])

  const handleBackFromResults = useCallback(() => {
    setViewingResultsId(null)
    setViewingResultsData(null)
    refresh()
  }, [refresh])

  const handleDownloadExcel = useCallback(async (id: string) => {
    if (!api?.storeLoadResults) return
    const raw = await api.storeLoadResults(id)
    if (!raw) { alert('No results. Evaluate first.'); return }

    // The backend already saved an Excel file — tell user where it is
    // Or we can trigger the backend to regenerate
    try {
      const data = JSON.parse(raw)
      const examId = data.examId || id
      // Try to download from backend
      const link = document.createElement('a')
      link.href = `http://localhost:8000/results/${examId}/excel`
      link.download = `${examId}_results.xlsx`
      link.click()
    } catch { alert('Failed to download Excel.') }
  }, [api])

  const formatDate = (iso: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } catch { return iso }
  }

  const typeLabel = (type: string) =>
    EXAM_TYPES.find(t => t.id === type)?.label || type

  if (loading) return null

  // Show Results screen when viewing results
  if (viewingResultsId && viewingResultsData) {
    return (
      <Results
        examId={viewingResultsId}
        data={viewingResultsData}
        onBack={handleBackFromResults}
        onSave={handleSaveResults}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Exams</h1>
          <p className={styles.subtitle}>
            {exams.length} saved exam{exams.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className={styles.newBtn} onClick={handleNew}>
          + New Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>&#128196;</div>
          <p className={styles.emptyText}>No exams yet</p>
          <p className={styles.emptyHint}>
            Click "New Exam" to create your first exam paper
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {exams.map(exam => (
            <div key={exam.id} className={styles.card} onClick={() => handleView(exam.id)}>
              <div className={styles.cardTop}>
                {exam.courseCode && (
                  <span className={styles.cardCode}>{exam.courseCode}</span>
                )}
                <span className={styles.cardType}>{typeLabel(exam.examType)}</span>
              </div>
              <h3 className={styles.cardTitle}>
                {exam.course || 'Untitled Exam'}
              </h3>
              <div className={styles.cardMeta}>
                <span>{exam.questionCount} question{exam.questionCount !== 1 ? 's' : ''}</span>
                <span>{exam.totalPoints} pts</span>
                {exam.date && <span>{exam.date}</span>}
                {exam.hasResults && <span style={{ color: 'var(--cl-success)', fontWeight: 600 }}>Evaluated</span>}
              </div>
              {exam.updatedAt && (
                <div style={{ fontSize: 9, color: '#aaa', marginBottom: 8 }}>
                  Last saved: {formatDate(exam.updatedAt)}
                </div>
              )}
              <div className={styles.cardActions}>
                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleEdit(exam.id) }}>Edit</button>
                <button
                  className={styles.actionBtnEval}
                  onClick={(e) => { e.stopPropagation(); handleEvaluate(exam.id) }}
                >
                  {evaluating === exam.id ? 'Evaluating...' : 'Evaluate'}
                </button>
                {exam.hasResults && (
                  <button className={styles.actionBtnResults} onClick={(e) => { e.stopPropagation(); handleViewResults(exam.id) }}>Results</button>
                )}
                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleDuplicate(exam.id) }}>Duplicate</button>
                <button className={styles.actionBtnDanger} onClick={(e) => { e.stopPropagation(); handleDelete(exam.id, exam.course || 'Untitled') }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
