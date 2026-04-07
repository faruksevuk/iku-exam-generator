export type QuestionType = 'mc' | 'ms' | 'open' | 'match' | 'fill'

export interface ExamInfo {
  faculty: string
  department: string
  course: string
  courseCode: string
  examType: string
  date: string
  duration: string
  instructions: string
}

export interface Question {
  type: QuestionType
  text: string
  imagePreview: string | null
  options: string[]
  correctAnswer: number
  correctAnswers: number[]
  // Mixed expected answer — both text and image can coexist
  correctText: string
  correctImagePreview: string | null
  spaceId: number
  matchLeft: string[]
  matchRight: string[]
  matchCorrect: string[]
  fillText: string
  fillAnswers: string[]
  points: number
  // Penalty: per-item deduction for wrong answers (0 for open-ended)
  penaltyPerItem: number
}

export interface ExamFile {
  version: number
  exam: ExamInfo
  questions: Question[]
}
