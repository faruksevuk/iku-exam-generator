import { useCallback, useState, useEffect, useRef } from 'react'
import { useExamState, useExamDispatch } from '@/context/ExamContext'
import { usePageLayout, repackWithHeights, type MasonryPage } from '@/hooks/usePageLayout'
import { generateGroundTruthMap } from '@/utils/mapGenerator'
import type { ExamFile } from '@/types/exam'
import shared from '@/components/shared/shared.module.css'
import styles from './Preview.module.css'
import { PageCard } from './PageCard'
import { ExamHeader } from './ExamHeader'
import { QuestionBlock } from './QuestionBlock'

export default function Preview() {
  const { exam, questions, originalOrder, currentExamId } = useExamState()
  const dispatch = useExamDispatch()
  const { masonryLayout, autoInstructions, optimizeOrder, CONTENT_W, instrH, headerH, classifyWidth, shouldUseGrid } = usePageLayout(
    questions,
    exam.instructions,
  )

  const api = (window as any).electronAPI
  const totalPts = questions.reduce((sum, q) => sum + q.points, 0)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const printAreaRef = useRef<HTMLDivElement>(null)

  // Two-pass layout: first render with estimates, then measure and repack
  const [correctedLayout, setCorrectedLayout] = useState<MasonryPage[] | null>(null)
  const activeLayout = correctedLayout ?? masonryLayout

  useEffect(() => {
    // After first render, measure actual question heights and repack
    setCorrectedLayout(null) // reset on question change
  }, [questions, masonryLayout])

  useEffect(() => {
    if (correctedLayout !== null) return // already corrected
    // Wait for DOM to render, then measure
    const timer = setTimeout(() => {
      const el = printAreaRef.current
      if (!el) return
      const blocks = el.querySelectorAll<HTMLElement>('[data-map-element="question"]')
      if (blocks.length === 0) return

      const measured = new Map<number, number>()
      blocks.forEach((block) => {
        const qNum = parseInt(block.dataset.mapQ || '0', 10)
        const qIndex = qNum - 1
        measured.set(qIndex, block.offsetHeight)
      })

      const repacked = repackWithHeights(questions, measured, headerH, instrH)
      setCorrectedLayout(repacked)
    }, 50)
    return () => clearTimeout(timer)
  }, [masonryLayout, correctedLayout, questions, headerH, instrH])

  const showToastMsg = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const pdfFileName = () => {
    const code = exam.courseCode || 'EXAM'
    const type = exam.examType || 'exam'
    const year = exam.date ? exam.date.split('-')[0] : new Date().getFullYear().toString()
    return `${code}-${type}-${year}`
  }

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: 1 })
  }, [dispatch])

  const handleOptimize = useCallback(() => {
    dispatch({ type: 'SAVE_ORIGINAL_ORDER' })
    const optimized = optimizeOrder()
    dispatch({ type: 'REORDER_QUESTIONS', questions: optimized })
    setCorrectedLayout(null)
  }, [dispatch, optimizeOrder])

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESTORE_ORIGINAL_ORDER' })
    setCorrectedLayout(null)
  }, [dispatch])

  const autoSave = useCallback(async () => {
    if (!api?.storeSave) return
    const file: ExamFile = { version: 1, exam, questions }
    const data = JSON.stringify(file, null, 2)
    const id = await api.storeSave(data, currentExamId || undefined)
    dispatch({ type: 'SET_EXAM_ID', id })
    dispatch({ type: 'MARK_CLEAN', filePath: '' })

    // Also save the map alongside the exam (for evaluation later)
    if (api?.storeSaveMap) {
      // Wait a tick for DOM to be stable, then generate map
      setTimeout(() => {
        const map = generateGroundTruthMap(exam.courseCode, exam.examType, exam.date, questions)
        api.storeSaveMap(id, JSON.stringify(map, null, 2))
      }, 100)
    }
  }, [api, exam, questions, currentExamId, dispatch])

  const handlePrint = useCallback(async () => {
    await autoSave()
    if (api?.print) api.print()
    else window.print()
  }, [api, autoSave])

  const handleSavePdf = useCallback(async () => {
    await autoSave()
    if (!api?.savePdf) { window.print(); return }
    const result = await api.savePdf(pdfFileName())
    if (result.success) showToastMsg('PDF saved')
  }, [api, autoSave, exam])

  const handleExportMap = useCallback(async () => {
    if (!api?.saveMap) return
    const map = generateGroundTruthMap(exam.courseCode, exam.examType, exam.date, questions)
    const mapJson = JSON.stringify(map, null, 2)
    const result = await api.saveMap(mapJson, pdfFileName())
    if (result.success) showToastMsg('Ground truth map exported')
  }, [api, exam])

  const handleSaveExam = useCallback(async () => {
    await autoSave()
    showToastMsg('Exam saved successfully')
  }, [autoSave])

  const handleExit = useCallback(() => {
    dispatch({ type: 'SET_STEP', step: -1 })
  }, [dispatch])

  return (
    <>
      {showToast && (
        <div className={styles.toastOverlay}>
          <div className={styles.toast}>
            <span className={styles.toastIcon}>&#10003;</span>
            {toastMessage}
          </div>
        </div>
      )}

      <div className={`${shared.card} no-print`}>
        <div className={styles.toolbar}>
          <div>
            <h3 className={styles.toolbarTitle}>
              Preview &mdash; {activeLayout.length} page
              {activeLayout.length !== 1 ? 's' : ''}
            </h3>
            <p className={styles.toolbarHint}>
              Review your exam. Print directly or save as PDF.
            </p>
          </div>
          <div className={styles.toolbarBtns}>
            <button className={shared.btnSecondary} onClick={handleBack}>&larr; Edit</button>
            <button className={`${shared.btnSecondary} ${styles.btnOptimize}`} onClick={handleOptimize}>
              Optimize Order
            </button>
            {originalOrder && (
              <button className={`${shared.btnSecondary} ${styles.btnReset}`} onClick={handleReset}>
                Reset Order
              </button>
            )}
          </div>
        </div>
        <div className={styles.actionRow}>
          <div className={styles.actionRowLeft}>
            <button className={styles.btnSave} onClick={handleSaveExam}>Save Exam</button>
            <button className={styles.btnMap} onClick={handleExportMap}>Export Map</button>
          </div>
          <div className={styles.actionRowRight}>
            <button className={styles.btnPdf} onClick={handleSavePdf}>Save as PDF</button>
            <button className={shared.btnPrimary} onClick={handlePrint}>Print</button>
          </div>
        </div>
      </div>

      <div id="print-area" className={styles.printArea} ref={printAreaRef}>
        {activeLayout.map((page, pageIdx) => (
          <PageCard
            key={pageIdx}
            pageIndex={pageIdx}
            totalPages={activeLayout.length}
            courseCode={exam.courseCode}
            examType={exam.examType}
            date={exam.date}
            contentHeight={page.maxH}
          >
            {pageIdx === 0 && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                <ExamHeader exam={exam} totalPts={totalPts} autoInstructions={autoInstructions} />
              </div>
            )}
            {page.items.map((item) => {
              const leftPct = (item.x / CONTENT_W) * 100
              const widthPct = (item.w / CONTENT_W) * 100
              const q = questions[item.qIndex]
              const wClass = item.widthClass
              return (
                <QuestionBlock
                  key={item.qIndex}
                  q={q}
                  qNum={item.qIndex + 1}
                  widthClass={wClass}
                  useGrid={shouldUseGrid(q, wClass)}
                  style={{
                    position: 'absolute',
                    top: item.y,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    boxSizing: 'border-box',
                  }}
                />
              )
            })}
          </PageCard>
        ))}
      </div>

      <div className={`${styles.exitRow} no-print`}>
        <button className={styles.exitBtn} onClick={handleExit}>&larr; Back to My Exams</button>
      </div>
    </>
  )
}
