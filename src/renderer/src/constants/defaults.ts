import type { Question, ExamInfo } from '../types/exam'

export const DEFAULT_QUESTION: Question = {
  type: 'mc',
  text: '',
  imagePreview: null,
  options: ['', '', '', ''],
  correctAnswer: 0,
  correctAnswers: [],
  correctText: '',
  correctImagePreview: null,
  spaceId: 0,
  matchLeft: ['', ''],
  matchRight: ['', ''],
  matchCorrect: [],
  fillText: '',
  fillAnswers: [],
  points: 10,
  penaltyPerItem: 0,
}

export const DEFAULT_EXAM: ExamInfo = {
  faculty: '',
  department: '',
  course: '',
  courseCode: '',
  examType: 'midterm',
  date: '',
  duration: '',
  instructions: '',
}
