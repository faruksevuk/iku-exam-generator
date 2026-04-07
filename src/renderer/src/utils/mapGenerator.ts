/**
 * Ground Truth Map Generator — v2 (Hierarchical)
 *
 * Produces an O(1) lookup structure where:
 * - anchors are a dict keyed by "TL","TR","BL","BR"
 * - questions are a dict keyed by question number
 * - each question contains its own options/solutionArea/answerBoxes
 */

// ── Output types ──

interface AnchorMarker {
  type: 'bullseye'
  center: { x: number; y: number }  // exact absolute center of target
  diameter: number                   // outer circle diameter in px
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

interface MCOption {
  [letter: string]: Box  // "A": {x,y,w,h}, "B": ...
}

interface AnswerBox {
  [index: string]: Box   // "1": {x,y,w,h}, "2": ...
}

interface ScoringInfo {
  points: number
  penaltyPerItem: number | null    // null for open-ended (no penalty)
  itemCount?: number               // number of gradable items (options, blanks, matches)
}

interface ExpectedAnswer {
  text?: string
  images?: string[]                // data URLs of reference images
  correctOption?: string           // A, B, C... for MC
  correctOptions?: string[]        // [A, C, ...] for MS
  correctMatches?: { [index: string]: string }  // {1: "B", 2: "A"} for match
  correctBlanks?: { [index: string]: string }   // {1: "answer"} for fill
}

interface QuestionMap {
  type: string
  boundingBox: Box
  scoring: ScoringInfo
  expectedAnswer?: ExpectedAnswer
  options?: MCOption               // mc/ms only
  solutionArea?: Box               // open/mc/ms with answer area
  answerSection?: Box              // match/fill answer section container
  answerBoxes?: AnswerBox          // match/fill individual boxes
  fillBlanks?: { [index: string]: Box }
}

interface PageMap {
  pageId: string
  pageIndex: number
  pageWidth: number
  pageHeight: number
  anchors: {
    TL: AnchorMarker
    TR: AnchorMarker
    BL: AnchorMarker
    BR: AnchorMarker
  }
  studentNumberRegion?: Box     // full student number section bounding box
  studentNumberBoxes?: Box[]    // individual digit box coordinates
  questions: { [qNum: string]: QuestionMap }
}

export interface ExamGroundTruthMap {
  version: 2
  examId: string
  generatedAt: string
  courseCode: string
  examType: string
  date: string
  totalPages: number
  pages: PageMap[]
}

// ── Generator ──

import type { Question } from '../types/exam'

export function generateGroundTruthMap(
  courseCode: string,
  examType: string,
  date: string,
  questions?: Question[],
): ExamGroundTruthMap {
  const year = date ? date.split('-')[0] : new Date().getFullYear().toString()
  const examId = `${courseCode || 'EXAM'}-${examType || 'exam'}-${year}`

  const printArea = document.getElementById('print-area')
  if (!printArea) {
    return { version: 2, examId, generatedAt: new Date().toISOString(), courseCode, examType, date, totalPages: 0, pages: [] }
  }

  const pageEls = printArea.querySelectorAll<HTMLElement>('[data-page-index]')
  const pages: PageMap[] = []

  pageEls.forEach((pageEl) => {
    const pageIndex = parseInt(pageEl.dataset.pageIndex || '0', 10)
    const pageId = pageEl.dataset.pageId || `P${pageIndex + 1}`
    const pageRect = pageEl.getBoundingClientRect()

    // Anchors — bullseye targets with exact center coordinates
    const defaultAnchor: AnchorMarker = { type: 'bullseye', center: { x: 0, y: 0 }, diameter: 0 }
    const anchors = {
      TL: { ...defaultAnchor },
      TR: { ...defaultAnchor },
      BL: { ...defaultAnchor },
      BR: { ...defaultAnchor },
    }
    pageEl.querySelectorAll<HTMLElement>('[data-anchor]').forEach((el) => {
      const r = el.getBoundingClientRect()
      const id = el.dataset.anchor as keyof typeof anchors
      if (id in anchors) {
        anchors[id] = {
          type: 'bullseye',
          center: {
            x: rd(r.left - pageRect.left + r.width / 2),
            y: rd(r.top - pageRect.top + r.height / 2),
          },
          diameter: rd(r.width),
        }
      }
    })

    // Student number: full region + individual digit boxes (page 1 only)
    let snRegion: Box | undefined
    const snRegionEl = pageEl.querySelector<HTMLElement>('[data-map-element="student-number-region"]')
    if (snRegionEl) {
      snRegion = relBox(snRegionEl.getBoundingClientRect(), pageRect)
    }
    const snBoxes: Box[] = []
    pageEl.querySelectorAll<HTMLElement>('[data-map-element="student-number-box"]').forEach((el) => {
      snBoxes.push(relBox(el.getBoundingClientRect(), pageRect))
    })

    // Questions — dict keyed by question number
    const pageQuestions: { [qNum: string]: QuestionMap } = {}

    const typeNames: Record<string, string> = {
      mc: 'multiple_choice',
      ms: 'multi_select',
      open: 'open_ended',
      match: 'matching',
      fill: 'fill_blanks',
    }

    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    // First pass: question bounding boxes + scoring + expectedAnswer
    pageEl.querySelectorAll<HTMLElement>('[data-map-element="question"]').forEach((el) => {
      const qNum = el.dataset.mapQ || '0'
      const rawType = el.dataset.mapType || ''
      const r = el.getBoundingClientRect()
      const qIdx = parseInt(qNum, 10) - 1
      const srcQ = questions?.[qIdx]

      // Build scoring info
      const scoring: ScoringInfo = {
        points: srcQ?.points ?? 0,
        penaltyPerItem: (rawType === 'open') ? null : (srcQ?.penaltyPerItem ?? 0),
      }
      // Count gradable items
      if (srcQ) {
        if (rawType === 'mc' || rawType === 'ms') scoring.itemCount = srcQ.options.length
        if (rawType === 'match') scoring.itemCount = srcQ.matchLeft.length
        if (rawType === 'fill') scoring.itemCount = (srcQ.fillText.match(/___/g) || []).length
      }

      // Build expectedAnswer
      let expectedAnswer: ExpectedAnswer | undefined
      if (srcQ) {
        if (rawType === 'mc') {
          expectedAnswer = { correctOption: ALPHA[srcQ.correctAnswer] || 'A' }
        } else if (rawType === 'ms') {
          expectedAnswer = { correctOptions: srcQ.correctAnswers.map(i => ALPHA[i]) }
        } else if (rawType === 'match') {
          const matches: { [k: string]: string } = {}
          srcQ.matchCorrect.forEach((v, i) => { if (v) matches[String(i + 1)] = v })
          expectedAnswer = { correctMatches: matches }
        } else if (rawType === 'fill') {
          const blanks: { [k: string]: string } = {}
          srcQ.fillAnswers.forEach((v, i) => { if (v) blanks[String(i + 1)] = v })
          expectedAnswer = { correctBlanks: blanks }
        } else if (rawType === 'open') {
          expectedAnswer = {}
          if (srcQ.correctText) expectedAnswer.text = srcQ.correctText
          // Use file path from the global store, not the base64 data URL
          const paths = (window as any).__lastExpectedAnswerPath
          const filePath = paths?.[qIdx]
          if (filePath) {
            expectedAnswer.images = [filePath]
          } else if (srcQ.correctImagePreview) {
            // Fallback: indicate an image exists but path unknown
            expectedAnswer.images = ['[embedded-preview]']
          }
        }
      }

      pageQuestions[qNum] = {
        type: typeNames[rawType] || rawType || 'unknown',
        boundingBox: relBox(r, pageRect),
        scoring,
        expectedAnswer,
      }
    })

    // Second pass: all child elements → attach to their question
    pageEl.querySelectorAll<HTMLElement>('[data-map-element]').forEach((el) => {
      const elementType = el.dataset.mapElement!
      const qNum = el.dataset.mapQ || '0'

      if (elementType === 'question') return // already handled
      if (!pageQuestions[qNum]) return

      const box = relBox(el.getBoundingClientRect(), pageRect)

      switch (elementType) {
        case 'mc-bubble': {
          const opt = el.dataset.mapOption || '?'
          if (!pageQuestions[qNum].options) pageQuestions[qNum].options = {}
          pageQuestions[qNum].options![opt] = box
          break
        }
        case 'ms-checkbox': {
          const opt = el.dataset.mapOption || '?'
          if (!pageQuestions[qNum].options) pageQuestions[qNum].options = {}
          pageQuestions[qNum].options![opt] = box
          break
        }
        case 'solution-area': {
          pageQuestions[qNum].solutionArea = box
          break
        }
        case 'answer-section': {
          pageQuestions[qNum].answerSection = box
          break
        }
        case 'answer-box': {
          const idx = el.dataset.mapBox || '0'
          if (!pageQuestions[qNum].answerBoxes) pageQuestions[qNum].answerBoxes = {}
          pageQuestions[qNum].answerBoxes![idx] = box
          break
        }
        case 'fill-blank': {
          const idx = String(el.dataset.mapBlank || '0')
          if (!pageQuestions[qNum].fillBlanks) pageQuestions[qNum].fillBlanks = {}
          pageQuestions[qNum].fillBlanks![idx] = box
          break
        }
      }
    })

    pages.push({
      pageId,
      pageIndex,
      pageWidth: rd(pageRect.width),
      pageHeight: rd(pageRect.height),
      anchors,
      ...(snRegion ? { studentNumberRegion: snRegion } : {}),
      ...(snBoxes.length > 0 ? { studentNumberBoxes: snBoxes } : {}),
      questions: pageQuestions,
    })
  })

  return {
    version: 2,
    examId,
    generatedAt: new Date().toISOString(),
    courseCode,
    examType,
    date,
    totalPages: pages.length,
    pages,
  }
}

function rd(n: number): number {
  return Math.round(n * 10) / 10
}

function relBox(elRect: DOMRect, pageRect: DOMRect): Box {
  return {
    x: rd(elRect.left - pageRect.left),
    y: rd(elRect.top - pageRect.top),
    w: rd(elRect.width),
    h: rd(elRect.height),
  }
}
