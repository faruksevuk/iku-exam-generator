import { dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'

const FILE_FILTERS = [
  { name: 'IKU Exam Files', extensions: ['ikuexam'] },
  { name: 'JSON Files', extensions: ['json'] },
  { name: 'All Files', extensions: ['*'] }
]

export async function saveExamAs(
  win: BrowserWindow,
  data: string
): Promise<{ success: boolean; filePath?: string }> {
  const result = await dialog.showSaveDialog(win, {
    title: 'Save Exam',
    defaultPath: 'exam.ikuexam',
    filters: FILE_FILTERS
  })

  if (result.canceled || !result.filePath) {
    return { success: false }
  }

  await writeFile(result.filePath, data, 'utf-8')
  return { success: true, filePath: result.filePath }
}

export async function saveExam(
  win: BrowserWindow,
  data: string,
  filePath: string | null
): Promise<{ success: boolean; filePath?: string }> {
  if (!filePath) {
    return saveExamAs(win, data)
  }

  await writeFile(filePath, data, 'utf-8')
  return { success: true, filePath }
}

export async function openExam(
  win: BrowserWindow
): Promise<{ success: boolean; data?: string; filePath?: string }> {
  const result = await dialog.showOpenDialog(win, {
    title: 'Open Exam',
    filters: FILE_FILTERS,
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false }
  }

  const filePath = result.filePaths[0]
  const data = await readFile(filePath, 'utf-8')
  return { success: true, data, filePath }
}

export async function confirmUnsavedChanges(
  win: BrowserWindow
): Promise<'save' | 'discard' | 'cancel'> {
  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Do you want to save before continuing?',
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2
  })

  if (result.response === 0) return 'save'
  if (result.response === 1) return 'discard'
  return 'cancel'
}
