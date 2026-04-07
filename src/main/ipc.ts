import { ipcMain, BrowserWindow, dialog } from 'electron'
import { writeFile, readFile } from 'fs/promises'
import { saveExam, saveExamAs, openExam, confirmUnsavedChanges } from './fileOps'
import { listExams, saveExamLocal, loadExam, deleteExam, duplicateExam, saveMap, loadMap, saveResults, loadResults } from './examStore'
import { join } from 'path'
import { app } from 'electron'

export function registerIpcHandlers(win: BrowserWindow): void {
  // --- File dialogs ---
  ipcMain.handle('file:save', async (_e, data: string, filePath: string | null) => {
    return saveExam(win, data, filePath)
  })

  ipcMain.handle('file:save-as', async (_e, data: string) => {
    return saveExamAs(win, data)
  })

  ipcMain.handle('file:open', async () => {
    return openExam(win)
  })

  ipcMain.handle('dialog:unsaved', async () => {
    return confirmUnsavedChanges(win)
  })

  // --- Local exam storage ---
  ipcMain.handle('store:list', async () => {
    return listExams()
  })

  ipcMain.handle('store:save', async (_e, data: string, id?: string) => {
    return saveExamLocal(data, id)
  })

  ipcMain.handle('store:load', async (_e, id: string) => {
    return loadExam(id)
  })

  ipcMain.handle('store:delete', async (_e, id: string) => {
    return deleteExam(id)
  })

  ipcMain.handle('store:duplicate', async (_e, id: string) => {
    return duplicateExam(id)
  })

  // --- Window ---
  ipcMain.on('title:update', (_e, title: string) => {
    win.setTitle(title)
  })

  // Physical print — opens system print dialog
  ipcMain.on('app:print', () => {
    win.webContents.print(
      {
        silent: false,
        printBackground: true,
        pageSize: 'A4' as any,
        header: '',
        footer: '',
      },
      (success, failureReason) => {
        if (!success && failureReason) {
          console.error('Print failed:', failureReason)
        }
      }
    )
  })

  // Save ground truth JSON map alongside exam
  ipcMain.handle('app:save-map', async (_e, mapJson: string, defaultName?: string) => {
    try {
      const result = await dialog.showSaveDialog(win, {
        title: 'Save Ground Truth Map',
        defaultPath: `${defaultName || 'exam'}_map.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      })
      if (result.canceled || !result.filePath) return { success: false }
      await writeFile(result.filePath, mapJson, 'utf-8')
      return { success: true, filePath: result.filePath }
    } catch (err) {
      console.error('Save map failed:', err)
      return { success: false }
    }
  })

  // Save as PDF — generates PDF file and opens save dialog
  ipcMain.handle('app:save-pdf', async (_e, defaultName?: string) => {
    try {
      const pdfData = await win.webContents.printToPDF({
        landscape: false,
        pageSize: 'A4',
        printBackground: true,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      })

      const result = await dialog.showSaveDialog(win, {
        title: 'Save as PDF',
        defaultPath: `${defaultName || 'exam'}.pdf`,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      })

      if (result.canceled || !result.filePath) {
        return { success: false }
      }

      await writeFile(result.filePath, pdfData)
      return { success: true, filePath: result.filePath }
    } catch (err) {
      console.error('Save PDF failed:', err)
      return { success: false }
    }
  })

  // ── Map & Results storage ──
  ipcMain.handle('store:save-map', async (_e, id: string, mapJson: string) => {
    await saveMap(id, mapJson)
  })

  ipcMain.handle('store:load-map', async (_e, id: string) => {
    return loadMap(id)
  })

  ipcMain.handle('store:save-results', async (_e, id: string, resultsJson: string) => {
    await saveResults(id, resultsJson)
  })

  ipcMain.handle('store:load-results', async (_e, id: string) => {
    return loadResults(id)
  })

  // ── Evaluate exam: pick scanned PDF, send to backend ──
  ipcMain.handle('evaluate:pick-pdf', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Scanned Exam PDF',
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false }
    }
    return { success: true, filePath: result.filePaths[0] }
  })

  ipcMain.handle('evaluate:run', async (_e, pdfPath: string, mapJson: string, backendUrl: string) => {
    try {
      const pdfBuffer = await readFile(pdfPath)

      // Build multipart form data manually for Node.js fetch
      const boundary = '----ExamEvalBoundary' + Date.now()
      const parts: Buffer[] = []

      // PDF file part
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="pdf_file"; filename="scan.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
      ))
      parts.push(pdfBuffer)
      parts.push(Buffer.from('\r\n'))

      // Map JSON part
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="map_file"; filename="map.json"\r\nContent-Type: application/json\r\n\r\n`
      ))
      parts.push(Buffer.from(mapJson))
      parts.push(Buffer.from('\r\n'))

      // End boundary
      parts.push(Buffer.from(`--${boundary}--\r\n`))

      const body = Buffer.concat(parts)

      const response = await fetch(`${backendUrl}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      })

      if (!response.ok) {
        const text = await response.text()
        return { success: false, error: `Backend error: ${response.status} ${text}` }
      }

      const data = await response.json()

      // Save results locally
      const resultsDir = join(app.getPath('userData'), 'results')
      const { mkdir } = await import('fs/promises')
      await mkdir(resultsDir, { recursive: true })
      const resultPath = join(resultsDir, `${data.examId || 'eval'}_${Date.now()}.json`)
      await writeFile(resultPath, JSON.stringify(data, null, 2), 'utf-8')

      return { success: true, data, resultPath }
    } catch (err: any) {
      return { success: false, error: err.message || 'Unknown error' }
    }
  })

  // List saved evaluation results
  ipcMain.handle('evaluate:list-results', async () => {
    try {
      const resultsDir = join(app.getPath('userData'), 'results')
      const { readdir } = await import('fs/promises')
      const { existsSync } = await import('fs')
      if (!existsSync(resultsDir)) return []
      const files = await readdir(resultsDir)
      return files.filter(f => f.endsWith('.json')).map(f => join(resultsDir, f))
    } catch {
      return []
    }
  })

  ipcMain.handle('evaluate:load-result', async (_e, path: string) => {
    try {
      const data = await readFile(path, 'utf-8')
      return { success: true, data: JSON.parse(data) }
    } catch {
      return { success: false }
    }
  })
}
