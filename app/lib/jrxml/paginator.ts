import type { JrReport, JrBand, JrVariable, Page, PositionedBox } from './types'
import { layoutBand, type LayoutContext } from './layout/band'
import { evalExpression } from './expr/evaluator'
import { createGroupState, detectBreaks, flushAllGroups } from './groups'

export interface PaginateOptions {
  report: JrReport
  rows: Record<string, unknown>[]
  parameters: Record<string, unknown>
}

interface BandEntry {
  band: JrBand
  row: Record<string, unknown>
  rowIdx: number
  height: number
  extraVars?: Record<string, unknown>
  groupHeaderOf?: JrGroup
  groupFooterOf?: JrGroup
}

export function computeReportVariable(
  v: JrVariable,
  rows: Record<string, unknown>[],
  parameters: Record<string, unknown>,
): unknown {
  if (!v.variableExpression) return null
  const baseCtx = (row: Record<string, unknown>): LayoutContext => ({
    fields: row, params: parameters, variables: {},
  })
  const evalRow = (row: Record<string, unknown>): unknown => {
    try { return evalExpression(v.variableExpression!, baseCtx(row)) } catch { return null }
  }
  switch (v.calculation) {
    case 'Sum': {
      let s = 0
      for (const r of rows) { const n = Number(evalRow(r)); if (Number.isFinite(n)) s += n }
      return s
    }
    case 'Count': {
      let c = 0
      for (const r of rows) { if (evalRow(r) != null) c++ }
      return c
    }
    case 'DistinctCount': {
      const set = new Set<unknown>()
      for (const r of rows) { const v = evalRow(r); if (v != null) set.add(v) }
      return set.size
    }
    case 'Average': {
      let s = 0, n = 0
      for (const r of rows) { const x = Number(evalRow(r)); if (Number.isFinite(x)) { s += x; n++ } }
      return n === 0 ? 0 : s / n
    }
    case 'Highest': {
      let m: number | null = null
      for (const r of rows) { const x = Number(evalRow(r)); if (Number.isFinite(x)) m = m === null ? x : Math.max(m, x) }
      return m
    }
    case 'Lowest': {
      let m: number | null = null
      for (const r of rows) { const x = Number(evalRow(r)); if (Number.isFinite(x)) m = m === null ? x : Math.min(m, x) }
      return m
    }
    case 'First':
      return rows.length === 0 ? null : evalRow(rows[0])
    default:
      return null
  }
}

export function paginate(opts: PaginateOptions): Page[] {
  const { report, rows, parameters } = opts
  const m = report.margins
  const printableTop = m.top
  const printableBottom = report.pageHeight - m.bottom

  const titleH = report.bands.title?.height ?? 0
  const pageHeaderH = report.bands.pageHeader?.height ?? 0
  const colHeaderH = report.bands.columnHeader?.height ?? 0
  const pageFooterH = report.bands.pageFooter?.height ?? 0

  const reportVars: Record<string, unknown> = {}
  for (const v of report.variables) {
    if (v.resetType == null || v.resetType === 'Report' || v.resetType === 'None') {
      reportVars[v.name] = computeReportVariable(v, rows, parameters)
    }
  }

  const titleRow = rows[0] ?? {}
  const summaryRow = rows[rows.length - 1] ?? {}

  const buildCtx = (
    rowIdx: number,
    row: Record<string, unknown>,
    pageVars: Record<string, unknown> = {},
    extraVars: Record<string, unknown> = {},
  ): LayoutContext => ({
    fields: row,
    params: parameters,
    variables: { ...reportVars, REPORT_COUNT: rowIdx, ...pageVars, ...extraVars },
  })

  // --- Build group-aware entries ---
  const entries: BandEntry[] = []
  const groupState = createGroupState(report.groups)

  rows.forEach((row, rowIdx) => {
    const { broken, newValues } = detectBreaks(report.groups, row, groupState, parameters)

    // Emit footer untuk group lama (reverse: inner -> outer)
    for (let i = broken.length - 1; i >= 0; i--) {
      const g = broken[i]!
      if (groupState.values[g.name] === undefined) continue
      if (g.groupFooter) {
        // Compute group-scoped variables for this group before reset
        const rowsInGroup = [...groupState.rowIndices[g.name]]
        const groupVars: Record<string, unknown> = {}
        for (const v of report.variables) {
          if (v.resetType === 'Group' && v.resetGroup === g.name) {
            const groupRows = rowsInGroup.map(i => rows[i]!)
            groupVars[v.name] = computeGroupVariable(v, groupRows, parameters)
          }
        }
        const ctx = buildCtx(rowIdx + 1, row, {}, groupVars)
        const laid = layoutBand(g.groupFooter, ctx)
        entries.push({ band: g.groupFooter, row, rowIdx, height: laid.height, extraVars: groupVars, groupFooterOf: g })
      }
    }

    // Update state.values
    for (const g of report.groups) groupState.values[g.name] = newValues[g.name]

    // Emit header untuk group baru (forward: outer -> inner)
    for (const g of broken) {
      if (g.groupHeader) {
        const ctx = buildCtx(rowIdx + 1, row)
        const laid = layoutBand(g.groupHeader, ctx)
        entries.push({ band: g.groupHeader, row, rowIdx, height: laid.height, groupHeaderOf: g })
      }
    }

    // Emit detail band(s)
    for (const band of report.bands.detail) {
      const ctx = buildCtx(rowIdx + 1, row)
      const laid = layoutBand(band, ctx)
      entries.push({ band, row, rowIdx, height: laid.height })
    }

    // Track row indices for groups (for group-scoped variables)
    for (const g of report.groups) {
      groupState.rowIndices[g.name].push(rowIdx)
    }
  })

  // Flush remaining group footers (inner -> outer)
  const flushedGroups = flushAllGroups(report.groups, groupState)
  for (const g of flushedGroups) {
    if (g.groupFooter) {
      const rowsInGroup = [...groupState.rowIndices[g.name]]
      const groupVars: Record<string, unknown> = {}
      for (const v of report.variables) {
        if (v.resetType === 'Group' && v.resetGroup === g.name) {
          const groupRows = rowsInGroup.map(i => rows[i]!)
          groupVars[v.name] = computeGroupVariable(v, groupRows, parameters)
        }
      }
      const ctx = buildCtx(rows.length, summaryRow, {}, groupVars)
      const laid = layoutBand(g.groupFooter, ctx)
      entries.push({ band: g.groupFooter, row: summaryRow, rowIdx: rows.length - 1, height: laid.height, extraVars: groupVars, groupFooterOf: g })
    }
  }

  const colFooterH = report.bands.columnFooter
    ? layoutBand(report.bands.columnFooter, buildCtx(rows.length, summaryRow)).height
    : 0

  const summaryH = report.bands.summary
    ? layoutBand(report.bands.summary, buildCtx(rows.length, summaryRow)).height
    : 0

  // --- Page break algorithm ---
  const pagesContent: BandEntry[][] = []
  let currentEntries: BandEntry[] = []
  let cursorY = printableTop + titleH + pageHeaderH + colHeaderH
  const reservedBottom = pageFooterH
  let activeGroupHeaders: BandEntry[] = []

  function flushCurrentPage() {
    pagesContent.push(currentEntries)
    currentEntries = []
    cursorY = printableTop + pageHeaderH + colHeaderH
    // Re-emit active group headers that have isReprintHeaderOnEachPage
    const toReprint = activeGroupHeaders.filter(e => e.groupHeaderOf?.isReprintHeaderOnEachPage)
    for (const h of toReprint) {
      const ctx = buildCtx(h.rowIdx + 1, h.row, {}, h.extraVars ?? {})
      const laid = layoutBand(h.band, ctx)
      currentEntries.push({ ...h, height: laid.height })
      cursorY += laid.height
    }
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!

    // isStartNewPage flag
    if (entry.groupHeaderOf?.isStartNewPage && currentEntries.length > 0) {
      flushCurrentPage()
    }

    // keepTogether flag
    if (entry.groupHeaderOf?.keepTogether) {
      const nextEntry = entries[i + 1]
      const lookaheadH = entry.height + (nextEntry?.height ?? 0)
      if (cursorY + lookaheadH > printableBottom - reservedBottom) {
        flushCurrentPage()
      }
    }

    // Check page break capacity
    if (cursorY + entry.height > printableBottom - reservedBottom) {
      flushCurrentPage()
    }

    currentEntries.push(entry)
    cursorY += entry.height

    // Track active group headers
    if (entry.groupHeaderOf) {
      const lvl = report.groups.indexOf(entry.groupHeaderOf)
      activeGroupHeaders = activeGroupHeaders.filter(e => {
        const elvl = report.groups.indexOf(e.groupHeaderOf!)
        return elvl < lvl
      })
      activeGroupHeaders.push(entry)
    }
    if (entry.groupFooterOf) {
      activeGroupHeaders = activeGroupHeaders.filter(e => e.groupHeaderOf !== entry.groupFooterOf)
    }
  }
  pagesContent.push(currentEntries)

  if (cursorY + colFooterH + summaryH > printableBottom - reservedBottom) {
    pagesContent.push([])
  }

  // --- Render pages ---
  const totalPages = pagesContent.length
  const pages: Page[] = []

  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    const isFirst = pageIdx === 1
    const isLast = pageIdx === totalPages
    const details = pagesContent[pageIdx - 1] ?? []

    const boxes: PositionedBox[] = []
    let y = printableTop
    const pageVars = { PAGE_NUMBER: pageIdx, PAGE_COUNT: totalPages, COLUMN_NUMBER: 1 }

    const emit = (
      band: JrBand | undefined,
      rowIdx: number,
      row: Record<string, unknown>,
      extraVars: Record<string, unknown> = {},
    ): number => {
      if (!band) return 0
      const ctx = buildCtx(rowIdx, row, pageVars, extraVars)
      const laid = layoutBand(band, ctx)
      for (const b of laid.boxes) { b.x += m.left; b.y += y }
      boxes.push(...laid.boxes)
      y += laid.height
      return laid.height
    }

    if (isFirst) emit(report.bands.title, 0, titleRow)
    emit(report.bands.pageHeader, 0, titleRow)
    emit(report.bands.columnHeader, 0, titleRow)

    for (const entry of details) {
      emit(entry.band, entry.rowIdx + 1, entry.row, entry.extraVars)
    }

    if (isLast) {
      emit(report.bands.columnFooter, rows.length, summaryRow)
      emit(report.bands.summary, rows.length, summaryRow)
    }

    if (pageFooterH > 0) {
      const pfBand = (isLast && report.bands.lastPageFooter) ? report.bands.lastPageFooter : report.bands.pageFooter
      if (pfBand) {
        const ctx = buildCtx(rows.length, summaryRow, pageVars)
        const laid = layoutBand(pfBand, ctx)
        const yOffset = printableBottom - pageFooterH
        for (const b of laid.boxes) { b.x += m.left; b.y += yOffset }
        boxes.push(...laid.boxes)
      }
    }

    pages.push({
      index: pageIdx,
      total: totalPages,
      width: report.pageWidth,
      height: report.pageHeight,
      boxes,
      bookmarks: [],
    })
  }

  return pages
}

function computeGroupVariable(
  v: JrVariable,
  rowsInGroup: Record<string, unknown>[],
  parameters: Record<string, unknown>,
): unknown {
  return computeReportVariable(v, rowsInGroup, parameters)
}
