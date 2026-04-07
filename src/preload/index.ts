import { contextBridge, ipcRenderer } from 'electron'

export interface SavedExamMeta {
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
}

export interface ElectronAPI {
  saveExam: (data: string, filePath: string | null) => Promise<{ success: boolean; filePath?: string }>
  saveExamAs: (data: string) => Promise<{ success: boolean; filePath?: string }>
  openExam: () => Promise<{ success: boolean; data?: string; filePath?: string }>
  confirmUnsaved: () => Promise<'save' | 'discard' | 'cancel'>
  setTitle: (title: string) => void
  print: () => void
  savePdf: (defaultName?: string) => Promise<{ success: boolean; filePath?: string }>
  saveMap: (mapJson: string, defaultName?: string) => Promise<{ success: boolean; filePath?: string }>
  forceClose: () => void
  onMenuAction: (callback: (action: string) => void) => () => void
  // Local exam store
  storeList: () => Promise<SavedExamMeta[]>
  storeSave: (data: string, id?: string) => Promise<string>
  storeLoad: (id: string) => Promise<string | null>
  storeDelete: (id: string) => Promise<boolean>
  storeDuplicate: (id: string) => Promise<string | null>
}

const api: ElectronAPI = {
  saveExam: (data, filePath) => ipcRenderer.invoke('file:save', data, filePath),
  saveExamAs: (data) => ipcRenderer.invoke('file:save-as', data),
  openExam: () => ipcRenderer.invoke('file:open'),
  confirmUnsaved: () => ipcRenderer.invoke('dialog:unsaved'),
  setTitle: (title) => ipcRenderer.send('title:update', title),
  print: () => ipcRenderer.send('app:print'),
  savePdf: (defaultName?: string) => ipcRenderer.invoke('app:save-pdf', defaultName),
  saveMap: (mapJson: string, defaultName?: string) => ipcRenderer.invoke('app:save-map', mapJson, defaultName),
  forceClose: () => ipcRenderer.send('app:force-close'),
  onMenuAction: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('menu:action', handler)
    return () => ipcRenderer.removeListener('menu:action', handler)
  },
  // Local exam store
  storeList: () => ipcRenderer.invoke('store:list'),
  storeSave: (data, id) => ipcRenderer.invoke('store:save', data, id),
  storeLoad: (id) => ipcRenderer.invoke('store:load', id),
  storeDelete: (id) => ipcRenderer.invoke('store:delete', id),
  storeDuplicate: (id) => ipcRenderer.invoke('store:duplicate', id),
  // Map & Results
  storeSaveMap: (id: string, mapJson: string) => ipcRenderer.invoke('store:save-map', id, mapJson),
  storeLoadMap: (id: string) => ipcRenderer.invoke('store:load-map', id),
  storeSaveResults: (id: string, resultsJson: string) => ipcRenderer.invoke('store:save-results', id, resultsJson),
  storeLoadResults: (id: string) => ipcRenderer.invoke('store:load-results', id),
  // Evaluation
  evaluatePickPdf: () => ipcRenderer.invoke('evaluate:pick-pdf'),
  evaluateRun: (pdfPath: string, mapJson: string, backendUrl: string) => ipcRenderer.invoke('evaluate:run', pdfPath, mapJson, backendUrl),
  evaluateListResults: () => ipcRenderer.invoke('evaluate:list-results'),
  evaluateLoadResult: (path: string) => ipcRenderer.invoke('evaluate:load-result', path),
}

contextBridge.exposeInMainWorld('electronAPI', api)
