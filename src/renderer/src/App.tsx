import { useEffect, useCallback } from 'react'
import { ExamProvider, useExamState } from './context/ExamContext'
import { useExamFile } from './hooks/useExamFile'
import { Layout } from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import { ExamInfoForm } from './components/exam-info/ExamInfoForm'
import { QuestionEditor } from './components/question-editor/QuestionEditor'
import Preview from './components/preview/Preview'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

function AppContent() {
  const { step, isDirty } = useExamState()
  const { save, saveAs, open, newExam, checkUnsaved } = useExamFile()

  const api =
    typeof window !== 'undefined' ? (window as any).electronAPI : null

  const handleMenuAction = useCallback(
    async (action: string) => {
      switch (action) {
        case 'new':
          await checkUnsaved(() => newExam())
          break
        case 'open':
          await checkUnsaved(() => open())
          break
        case 'save':
          await save()
          break
        case 'save-as':
          await saveAs()
          break
        case 'print':
          if (api?.print) api.print()
          else window.print()
          break
        case 'check-before-close':
          await checkUnsaved(() => {
            if (api) api.forceClose()
          })
          break
        case 'about':
          alert(
            'IKU Exam Generator v1.0.5\n\n' +
              'OCR-Compatible Exam Creator\n' +
              'Istanbul Kultur University',
          )
          break
      }
    },
    [checkUnsaved, newExam, open, save, saveAs, api],
  )

  useEffect(() => {
    if (!api?.onMenuAction) return
    const cleanup = api.onMenuAction(handleMenuAction)
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [api, handleMenuAction])

  useEffect(() => {
    if (!api?.setTitle) return
    const prefix = isDirty ? '* ' : ''
    api.setTitle(`${prefix}IKU Exam Generator`)
  }, [isDirty, api])

  return (
    <Layout>
      {step === -1 && <Dashboard />}
      {step === 0 && <ExamInfoForm />}
      {step === 1 && <QuestionEditor />}
      {step === 2 && <Preview />}
    </Layout>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ExamProvider>
        <AppContent />
      </ExamProvider>
    </ErrorBoundary>
  )
}
