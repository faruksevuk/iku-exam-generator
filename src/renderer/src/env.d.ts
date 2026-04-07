/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module 'qrcode-generator' {
  function qrcode(typeNumber: number, errorCorrectionLevel: string): {
    addData(data: string): void
    make(): void
    createDataURL(cellSize?: number, margin?: number): string
  }
  export default qrcode
}

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
}

interface Window {
  electronAPI: {
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
    storeList: () => Promise<SavedExamMeta[]>
    storeSave: (data: string, id?: string) => Promise<string>
    storeLoad: (id: string) => Promise<string | null>
    storeDelete: (id: string) => Promise<boolean>
    storeDuplicate: (id: string) => Promise<string | null>
  }
}
