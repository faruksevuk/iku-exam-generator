import { useMemo, useCallback } from 'react'
import type { Question } from '../types/exam'
import { SPACES } from '../constants/spaces'
import { TYPE_INSTRUCTIONS } from '../constants/typeInstructions'

// ── Page geometry (200mm x 287mm at 96dpi = 756 x 1086) ──
const PAGE_W = 756
const PAGE_PAD = 10
const CONTENT_W = PAGE_W - PAGE_PAD * 2  // 736
const FULL_CONTENT_H = 1086 - PAGE_PAD * 2  // 1066 total content height
const ANCHOR_MARGIN = 26      // keep questions above bottom bullseyes (16px + 3px inset + 7px gap)
const PAGE_H = FULL_CONTENT_H - ANCHOR_MARGIN  // 1088 max Y for question placement
const HEADER_H = 250          // exam header + student info + AI notice
const INSTR_LINE_H = 13
const COL_GAP = 10
const COL_W = Math.floor((CONTENT_W - COL_GAP) / 2)  // 382
const QR_SAFE_H = 58          // reserved top-right for QR + bullseye
const ANCHOR_TOP_SAFE = 14    // keep questions below top bullseyes (16px at 3px inset)
const ITEM_GAP = 4            // fixed vertical gap between questions

// ── Types ──
export type WidthClass = 'half' | 'full'

export interface PlacedItem {
  qIndex: number
  widthClass: WidthClass
  column: 0 | 1 | 'span'
  x: number
  y: number
  w: number
  h: number
}

export interface MasonryPage {
  items: PlacedItem[]
  colH: [number, number]
  maxH: number
}

export interface PageInfo {
  items: number[]
  usedH: number
}

// ── Classify question width ──
function classifyWidth(q: Question): WidthClass {
  if (q.imagePreview) return 'full'
  if ((q.text || '').length > 160) return 'full'
  const sp = SPACES.find(x => x.id === q.spaceId)?.px || 0
  // Open-ended: full if large+ solution area
  if (q.type === 'open' && sp >= 250) return 'full'
  // Any type with XXL space is full
  if (sp >= 700) return 'full'
  // MC/MS: full only if many options or very long option text
  if ((q.type === 'mc' || q.type === 'ms')) {
    const maxOptLen = Math.max(...q.options.map(o => o.length), 0)
    if (q.options.length > 6) return 'full'
    if (maxOptLen > 40) return 'full'
  }
  // Match: full only if many rows or long text in items
  if (q.type === 'match') {
    if (q.matchLeft.length > 4) return 'full'
    const maxLen = Math.max(
      ...q.matchLeft.map(s => s.length),
      ...q.matchRight.map(s => s.length),
      0
    )
    if (maxLen > 30) return 'full'
  }
  // Fill: full if text is long
  if (q.type === 'fill' && (q.fillText || '').length > 120) return 'full'
  return 'half'
}

// Should MC/MS options use 2-column grid?
// Grid when: options are short AND we have room (full-width or half with short opts)
function shouldUseGrid(q: Question, wClass: WidthClass): boolean {
  if (q.type !== 'mc' && q.type !== 'ms') return false
  if (q.options.length > 6) return false
  const maxOptLen = Math.max(...q.options.map(o => o.length), 0)
  // Half-width: only grid if options are very short
  if (wClass === 'half') return maxOptLen <= 15
  // Full-width: grid if options are reasonably short
  return maxOptLen <= 30
}

// ── Text height estimation ──
const CHAR_WIDTH = 6.2        // avg char width at 11px font
const LINE_H = 18             // 11px font * 1.6 line-height = 17.6 ≈ 18
const OPT_LINE_H = 18         // 10px font * 1.6 + 2px margin-bottom
const OPT_CHAR_WIDTH = 5.8    // avg char width at 10px font

function textLines(text: string, containerW: number): number {
  if (!text) return 1
  const innerW = containerW - 22
  const charsPerLine = Math.max(10, Math.floor(innerW / CHAR_WIDTH))
  let total = 0
  for (const line of text.split('\n')) {
    total += Math.max(1, Math.ceil(line.length / charsPerLine))
  }
  return total
}

function optionLines(optText: string, containerW: number): number {
  const innerW = containerW - 50
  const charsPerLine = Math.max(8, Math.floor(innerW / OPT_CHAR_WIDTH))
  return Math.max(1, Math.ceil((optText || '').length / charsPerLine))
}

// Height estimation — does NOT include inter-item gap (that's added by the packer)
function estHForWidth(q: Question, containerW: number): number {
  // Base: border(4) + padding(18) + header(23) + qText-margin(5) = 50
  let h = 50
  h += textLines(q.text, containerW) * LINE_H
  if (q.imagePreview) h += 115
  if (q.type === 'mc' || q.type === 'ms') {
    // Determine width class for grid decision
    const wClass = containerW >= CONTENT_W - 10 ? 'full' as WidthClass : 'half' as WidthClass
    if (shouldUseGrid(q, wClass)) {
      const rows = Math.ceil(q.options.length / 2)
      h += rows * OPT_LINE_H
    } else {
      q.options.forEach(opt => {
        h += optionLines(opt, containerW) * OPT_LINE_H
      })
    }
  }
  if (q.type === 'match') h += q.matchLeft.length * 22 + 22 + 55 // rows + header + answerBox
  if (q.type === 'fill' && q.fillText) h += 30 + 55             // fillText + answerBox
  const sp = SPACES.find(x => x.id === q.spaceId)?.px || 0
  if (sp > 0) h += sp + 11  // margin-top(7) + border(4) with border-box
  return h
}

function estH(q: Question): number {
  return estHForWidth(q, CONTENT_W)
}

function estHHalf(q: Question): number {
  return estHForWidth(q, COL_W)
}

// ── Repack with measured DOM heights ──
export function repackWithHeights(
  questions: Question[],
  measuredHeights: Map<number, number>,  // qIndex → actual px height
  headerH: number,
  instrH: number,
): MasonryPage[] {
  if (questions.length === 0) return []
  const pages: MasonryPage[] = []
  const headerStart = headerH + instrH

  function newPage(isFirst: boolean): MasonryPage {
    if (isFirst) return { items: [], colH: [headerStart, headerStart], maxH: headerStart }
    return { items: [], colH: [ANCHOR_TOP_SAFE, QR_SAFE_H], maxH: 0 }
  }

  function tryPlace(page: MasonryPage, qIndex: number, wClass: WidthClass, h: number): boolean {
    if (wClass === 'full') {
      const startY = Math.max(page.colH[0], page.colH[1])
      if (startY + h > PAGE_H) return false
      page.items.push({ qIndex, widthClass: 'full', column: 'span', x: 0, y: startY, w: CONTENT_W, h })
      page.colH[0] = startY + h + ITEM_GAP
      page.colH[1] = startY + h + ITEM_GAP
      page.maxH = Math.max(page.maxH, startY + h)
      return true
    }
    const shorter = page.colH[0] <= page.colH[1] ? 0 : 1
    const other = shorter === 0 ? 1 : 0
    for (const col of [shorter, other] as (0 | 1)[]) {
      const startY = page.colH[col]
      if (startY + h <= PAGE_H) {
        const x = col === 0 ? 0 : COL_W + COL_GAP
        page.items.push({ qIndex, widthClass: 'half', column: col, x, y: startY, w: COL_W, h })
        page.colH[col] = startY + h + ITEM_GAP
        page.maxH = Math.max(page.maxH, startY + h)
        return true
      }
    }
    return false
  }

  let current = newPage(true)
  questions.forEach((q, i) => {
    const wClass = classifyWidth(q)
    const h = measuredHeights.get(i) ?? (wClass === 'full' ? estH(q) : estHHalf(q))
    if (!tryPlace(current, i, wClass, h)) {
      pages.push(current)
      current = newPage(false)
      if (!tryPlace(current, i, wClass, h)) {
        const startY = Math.max(current.colH[0], current.colH[1])
        current.items.push({ qIndex: i, widthClass: wClass, column: 'span', x: 0, y: startY, w: CONTENT_W, h })
        current.colH[0] = startY + h + ITEM_GAP
        current.colH[1] = startY + h + ITEM_GAP
        current.maxH = startY + h
      }
    }
  })
  if (current.items.length > 0) pages.push(current)
  return pages
}

// ── Main hook ──
export function usePageLayout(questions: Question[], instructions: string) {
  const autoInstructions = useMemo(() => {
    const types = [...new Set(questions.map(q => q.type))]
    return types.map(t => TYPE_INSTRUCTIONS[t]).filter(Boolean)
  }, [questions])

  const instrH = useMemo(() => {
    const custom = instructions ? 25 : 0
    const auto = autoInstructions.length > 0
      ? 16 + autoInstructions.length * INSTR_LINE_H + 8
      : 0
    return custom + auto
  }, [instructions, autoInstructions])

  // ── Masonry layout ──
  const masonryLayout = useMemo((): MasonryPage[] => {
    if (questions.length === 0) return []

    const pages: MasonryPage[] = []
    const headerStart = HEADER_H + instrH

    function newPage(isFirst: boolean): MasonryPage {
      if (isFirst) {
        return { items: [], colH: [headerStart, headerStart], maxH: headerStart }
      }
      // Page 2+: left col starts below QR, right col below TR anchor
      return { items: [], colH: [ANCHOR_TOP_SAFE, QR_SAFE_H], maxH: 0 }
    }

    function tryPlace(page: MasonryPage, qIndex: number, wClass: WidthClass, h: number): boolean {
      if (wClass === 'full') {
        const startY = Math.max(page.colH[0], page.colH[1])
        if (startY + h > PAGE_H) return false
        page.items.push({
          qIndex, widthClass: 'full', column: 'span',
          x: 0, y: startY, w: CONTENT_W, h,
        })
        const nextY = startY + h + ITEM_GAP
        page.colH[0] = nextY
        page.colH[1] = nextY
        page.maxH = Math.max(page.maxH, startY + h)
        return true
      }

      const shorter = page.colH[0] <= page.colH[1] ? 0 : 1
      const other = shorter === 0 ? 1 : 0

      for (const col of [shorter, other] as (0 | 1)[]) {
        const startY = page.colH[col]
        if (startY + h <= PAGE_H) {
          const x = col === 0 ? 0 : COL_W + COL_GAP
          page.items.push({
            qIndex, widthClass: 'half', column: col,
            x, y: startY, w: COL_W, h,
          })
          page.colH[col] = startY + h + ITEM_GAP
          page.maxH = Math.max(page.maxH, startY + h)
          return true
        }
      }
      return false
    }

    let current = newPage(true)

    questions.forEach((q, i) => {
      const wClass = classifyWidth(q)
      const h = wClass === 'full' ? estH(q) : estHHalf(q)

      if (!tryPlace(current, i, wClass, h)) {
        pages.push(current)
        current = newPage(false)
        if (!tryPlace(current, i, wClass, h)) {
          const startY = Math.max(current.colH[0], current.colH[1])
          current.items.push({
            qIndex: i, widthClass: wClass, column: 'span',
            x: 0, y: startY, w: CONTENT_W, h,
          })
          current.colH[0] = startY + h + ITEM_GAP
          current.colH[1] = startY + h + ITEM_GAP
          current.maxH = startY + h
        }
      }
    })

    if (current.items.length > 0) pages.push(current)
    return pages
  }, [questions, instrH])

  const pageLayout = useMemo((): PageInfo[] => {
    return masonryLayout.map(p => ({
      items: p.items.map(it => it.qIndex),
      usedH: p.maxH,
    }))
  }, [masonryLayout])

  // ── Optimize order: try multiple strategies, pick fewest pages + least waste ──
  const optimizeOrder = useCallback((): Question[] => {
    if (questions.length <= 1) return questions.map(q => JSON.parse(JSON.stringify(q)))

    type QItem = { q: Question; idx: number; wClass: WidthClass; h: number; hHalf: number }

    const items: QItem[] = questions.map((q, i) => ({
      q: JSON.parse(JSON.stringify(q)),
      idx: i,
      wClass: classifyWidth(q),
      h: estH(q),
      hHalf: estHHalf(q),
    }))

    const fulls = items.filter(it => it.wClass === 'full')
    const halves = items.filter(it => it.wClass === 'half')

    // Sort helpers
    const byHDesc = (a: QItem, b: QItem) => b.h - a.h
    const byHAsc = (a: QItem, b: QItem) => a.h - b.h

    // Simulate masonry to count pages used
    function simulatePages(order: QItem[]): { pages: number; waste: number } {
      const headerStart = HEADER_H + instrH
      let pageCount = 1
      let colH: [number, number] = [headerStart, headerStart]

      for (const it of order) {
        const h = it.wClass === 'full' ? it.h : it.hHalf

        if (it.wClass === 'full') {
          const startY = Math.max(colH[0], colH[1])
          if (startY + h > PAGE_H) {
            pageCount++
            colH = [QR_SAFE_H, ANCHOR_TOP_SAFE]
            // place on new page
          }
          const y = Math.max(colH[0], colH[1])
          colH[0] = y + h + ITEM_GAP
          colH[1] = y + h + ITEM_GAP
        } else {
          const shorter = colH[0] <= colH[1] ? 0 : 1
          const other = shorter === 0 ? 1 : 0
          let placed = false
          for (const col of [shorter, other]) {
            if (colH[col] + h <= PAGE_H) {
              colH[col] = colH[col] + h + ITEM_GAP
              placed = true
              break
            }
          }
          if (!placed) {
            pageCount++
            colH = [QR_SAFE_H, ANCHOR_TOP_SAFE]
            const col = colH[0] <= colH[1] ? 0 : 1
            colH[col] = colH[col] + h + ITEM_GAP
          }
        }
      }

      const waste = PAGE_H - Math.max(colH[0], colH[1])
      return { pages: pageCount, waste }
    }

    // Strategy 1: full-width first (height desc), then halves (height desc)
    const s1 = [...fulls.sort(byHDesc), ...halves.sort(byHDesc)]

    // Strategy 2: halves first (height desc), then fulls (height desc)
    const s2 = [...halves.sort(byHDesc), ...fulls.sort(byHDesc)]

    // Strategy 3: interleave tall-short halves, then fulls
    const halveSorted = [...halves].sort(byHDesc)
    const s3pairs: QItem[] = []
    let lo = 0, hi = halveSorted.length - 1
    while (lo <= hi) {
      s3pairs.push(halveSorted[lo++])
      if (lo <= hi) s3pairs.push(halveSorted[hi--])
    }
    const s3 = [...fulls.sort(byHDesc), ...s3pairs]

    // Strategy 4: all by height desc (original)
    const s4 = [...items].sort(byHDesc)

    // Strategy 5: halves (height asc for tight column packing), then fulls
    const s5 = [...halves.sort(byHAsc), ...fulls.sort(byHDesc)]

    // Strategy 6: Greedy best-fit — at each step, pick the item that
    // best fills the remaining space in the shorter column
    function greedyBestFit(): QItem[] {
      const result: QItem[] = []
      const remaining = new Set(items.map((_, i) => i))
      const headerStart = HEADER_H + instrH
      let colH: [number, number] = [headerStart, headerStart]

      while (remaining.size > 0) {
        let bestIdx = -1
        let bestFit = Infinity  // smallest remaining gap after placement

        for (const i of remaining) {
          const it = items[i]
          const h = it.wClass === 'full' ? it.h : it.hHalf

          if (it.wClass === 'full') {
            const startY = Math.max(colH[0], colH[1])
            if (startY + h <= PAGE_H) {
              const gap = PAGE_H - (startY + h)
              if (gap < bestFit) { bestFit = gap; bestIdx = i }
            }
          } else {
            const shorter = colH[0] <= colH[1] ? 0 : 1
            for (const col of [shorter, shorter === 0 ? 1 : 0]) {
              if (colH[col] + h <= PAGE_H) {
                const gap = PAGE_H - (colH[col] + h)
                if (gap < bestFit) { bestFit = gap; bestIdx = i }
                break
              }
            }
          }
        }

        if (bestIdx === -1) {
          // Nothing fits current page — start new page, pick largest remaining
          colH = [QR_SAFE_H, ANCHOR_TOP_SAFE]
          let tallest = -1
          let tallestH = 0
          for (const i of remaining) {
            const h = items[i].wClass === 'full' ? items[i].h : items[i].hHalf
            if (h > tallestH) { tallestH = h; tallest = i }
          }
          bestIdx = tallest
        }

        const it = items[bestIdx]
        remaining.delete(bestIdx)
        result.push(it)

        // Advance columns
        const h = it.wClass === 'full' ? it.h : it.hHalf
        if (it.wClass === 'full') {
          const y = Math.max(colH[0], colH[1])
          colH[0] = y + h + ITEM_GAP
          colH[1] = y + h + ITEM_GAP
        } else {
          const shorter = colH[0] <= colH[1] ? 0 : 1
          for (const col of [shorter, shorter === 0 ? 1 : 0]) {
            if (colH[col] + h <= PAGE_H) {
              colH[col] = colH[col] + h + ITEM_GAP
              break
            }
          }
        }
      }
      return result
    }

    const s6 = greedyBestFit()

    // Strategy 7: pair halves by height (tallest + shortest together)
    const hSorted = [...halves].sort(byHDesc)
    const paired: QItem[] = []
    const left = [...hSorted]
    while (left.length >= 2) {
      paired.push(left.shift()!)  // tallest
      paired.push(left.pop()!)    // shortest
    }
    if (left.length) paired.push(left[0])
    const s7 = [...fulls.sort(byHDesc), ...paired]

    // Pick best
    const strategies = [s1, s2, s3, s4, s5, s6, s7]
    let bestOrder = s1
    let bestScore = { pages: Infinity, waste: Infinity }

    for (const strat of strategies) {
      const score = simulatePages(strat)
      if (
        score.pages < bestScore.pages ||
        (score.pages === bestScore.pages && score.waste < bestScore.waste)
      ) {
        bestScore = score
        bestOrder = strat
      }
    }

    return bestOrder.map(it => it.q)
  }, [questions, instrH])

  return {
    estH,
    instrH,
    headerH: HEADER_H,
    autoInstructions,
    pageLayout,
    masonryLayout,
    optimizeOrder,
    CONTENT_W,
    classifyWidth,
    shouldUseGrid,
  }
}
