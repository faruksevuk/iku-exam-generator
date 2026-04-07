import { app } from 'electron'
import { join } from 'path'
import { readdir, readFile, writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const EXAMS_DIR = join(app.getPath('userData'), 'exams')

export interface SavedExamMeta {
  id: string
  courseCode: string
  course: string
  examType: string
  date: string
  faculty: string
  department: string
  hasMap: boolean
  hasResults: boolean
  questionCount: number
  totalPoints: number
  updatedAt: string
}

async function ensureDir(): Promise<void> {
  if (!existsSync(EXAMS_DIR)) {
    await mkdir(EXAMS_DIR, { recursive: true })
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export async function listExams(): Promise<SavedExamMeta[]> {
  await ensureDir()
  const files = await readdir(EXAMS_DIR)
  const exams: SavedExamMeta[] = []

  for (const file of files) {
    if (!file.endsWith('.ikuexam')) continue
    try {
      const raw = await readFile(join(EXAMS_DIR, file), 'utf-8')
      const data = JSON.parse(raw)
      const id = file.replace('.ikuexam', '')
      exams.push({
        id,
        courseCode: data.exam?.courseCode || '',
        course: data.exam?.course || '',
        examType: data.exam?.examType || '',
        date: data.exam?.date || '',
        faculty: data.exam?.faculty || '',
        department: data.exam?.department || '',
        questionCount: data.questions?.length || 0,
        totalPoints: (data.questions || []).reduce((s: number, q: any) => s + (q.points || 0), 0),
        updatedAt: data.updatedAt || '',
        hasMap: existsSync(join(EXAMS_DIR, `${id}.map.json`)),
        hasResults: existsSync(join(EXAMS_DIR, `${id}.results.json`)),
      })
    } catch {
      // skip corrupt files
    }
  }

  // Sort by most recently updated
  exams.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  return exams
}

export async function saveExamLocal(data: string, existingId?: string): Promise<string> {
  await ensureDir()
  const id = existingId || generateId()
  const parsed = JSON.parse(data)
  parsed.updatedAt = new Date().toISOString()
  await writeFile(join(EXAMS_DIR, `${id}.ikuexam`), JSON.stringify(parsed, null, 2), 'utf-8')
  return id
}

export async function loadExam(id: string): Promise<string | null> {
  const path = join(EXAMS_DIR, `${id}.ikuexam`)
  if (!existsSync(path)) return null
  return readFile(path, 'utf-8')
}

export async function deleteExam(id: string): Promise<boolean> {
  const path = join(EXAMS_DIR, `${id}.ikuexam`)
  if (!existsSync(path)) return false
  await unlink(path)
  return true
}

export async function duplicateExam(id: string): Promise<string | null> {
  const raw = await loadExam(id)
  if (!raw) return null
  const parsed = JSON.parse(raw)
  // Append "(Copy)" to course name
  if (parsed.exam) {
    parsed.exam.course = (parsed.exam.course || '') + ' (Copy)'
  }
  const newId = generateId()
  parsed.updatedAt = new Date().toISOString()
  await writeFile(join(EXAMS_DIR, `${newId}.ikuexam`), JSON.stringify(parsed, null, 2), 'utf-8')
  return newId
}

// ── Map storage ──

export async function saveMap(id: string, mapJson: string): Promise<void> {
  await ensureDir()
  await writeFile(join(EXAMS_DIR, `${id}.map.json`), mapJson, 'utf-8')
}

export async function loadMap(id: string): Promise<string | null> {
  const path = join(EXAMS_DIR, `${id}.map.json`)
  if (!existsSync(path)) return null
  return readFile(path, 'utf-8')
}

// ── Results storage ──

export async function saveResults(id: string, resultsJson: string): Promise<void> {
  await ensureDir()
  await writeFile(join(EXAMS_DIR, `${id}.results.json`), resultsJson, 'utf-8')
}

export async function loadResults(id: string): Promise<string | null> {
  const path = join(EXAMS_DIR, `${id}.results.json`)
  if (!existsSync(path)) return null
  return readFile(path, 'utf-8')
}
