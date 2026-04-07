import { useCallback } from 'react'
import { useExamState, useExamDispatch } from '../context/ExamContext'
import type { ExamFile } from '../types/exam'

export function useExamFile() {
  const state = useExamState()
  const dispatch = useExamDispatch()

  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null

  const serialize = useCallback((): string => {
    const file: ExamFile = {
      version: 1,
      exam: state.exam,
      questions: state.questions,
    }
    return JSON.stringify(file, null, 2)
  }, [state.exam, state.questions])

  const save = useCallback(async (): Promise<boolean> => {
    if (!api) return false
    const result = await api.saveExam(serialize(), state.filePath)
    if (result.success && result.filePath) {
      dispatch({ type: 'MARK_CLEAN', filePath: result.filePath })
      api.setTitle(`${result.filePath.split(/[/\\]/).pop()} - IKU Exam Generator`)
    }
    return result.success
  }, [api, serialize, state.filePath, dispatch])

  const saveAs = useCallback(async (): Promise<boolean> => {
    if (!api) return false
    const result = await api.saveExamAs(serialize())
    if (result.success && result.filePath) {
      dispatch({ type: 'MARK_CLEAN', filePath: result.filePath })
      api.setTitle(`${result.filePath.split(/[/\\]/).pop()} - IKU Exam Generator`)
    }
    return result.success
  }, [api, serialize, dispatch])

  const open = useCallback(async (): Promise<boolean> => {
    if (!api) return false
    const result = await api.openExam()
    if (result.success && result.data && result.filePath) {
      try {
        const file: ExamFile = JSON.parse(result.data)
        if (file.exam && file.questions) {
          dispatch({
            type: 'LOAD_EXAM',
            exam: file.exam,
            questions: file.questions,
            filePath: result.filePath,
          })
          api.setTitle(`${result.filePath.split(/[/\\]/).pop()} - IKU Exam Generator`)
          return true
        }
      } catch {
        // Invalid JSON
      }
    }
    return false
  }, [api, dispatch])

  const newExam = useCallback(() => {
    dispatch({ type: 'NEW_EXAM' })
    if (api) api.setTitle('Untitled - IKU Exam Generator')
  }, [api, dispatch])

  const checkUnsaved = useCallback(async (thenDo: () => void): Promise<void> => {
    if (!state.isDirty) {
      thenDo()
      return
    }
    if (!api) {
      thenDo()
      return
    }
    const result = await api.confirmUnsaved()
    if (result === 'save') {
      const saved = await save()
      if (saved) thenDo()
    } else if (result === 'discard') {
      thenDo()
    }
    // 'cancel' — do nothing
  }, [state.isDirty, api, save])

  return { save, saveAs, open, newExam, checkUnsaved }
}
