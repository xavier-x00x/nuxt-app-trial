import type { JrReport, JrBand, JrElement, JrTextField, JrStaticText } from '../types'
import { evalExpression } from '../expr/evaluator'
import type { LayoutContext } from '../layout/band'

export interface ExportExcelOptions {
  report: JrReport
  rows: Record<string, unknown>[]
  parameters: Record<string, unknown>
  filename: string
}

type Cell = {
  value: string | number | Date | null
  bold?: boolean
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  fill?: string
  fontColor?: string
  fontSize?: number
  numFmt?: string
}

interface SheetRow {
  cells: Cell[]
  merges?: { startCol: number; endCol: number }[]
}

function isTextField(el: JrElement): el is JrTextField {
  return el.kind === 'textField'
}

function isStaticText(el: JrElement): el is JrStaticText {
  return el.kind === 'staticText'
}

function alignFromH(h: string): 'left' | 'center' | 'right' {
  if (h === 'Center') return 'center'
  if (h === 'Right') return 'right'
  return 'left'
}

function safeEval(expr: string, ctx: LayoutContext): unknown {
  try { return evalExpression(expr, ctx) } catch { return null }
}

function toCellValue(v: unknown): string | number | Date | null {
  if (v == null) return null
  if (v instanceof Date) return v
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v)
}

function buildContext(
  rowIdx: number,
  row: Record<string, unknown>,
  parameters: Record<string, unknown>,
  reportVars: Record<string, unknown>,
): LayoutContext {
  return {
    fields: row,
    params: parameters,
    variables: { ...reportVars, REPORT_COUNT: rowIdx, PAGE_NUMBER: 1, PAGE_COUNT: 1, COLUMN_NUMBER: 1 },
  }
}

function detectDetailColumns(detailBand: JrBand): JrElement[] {
  return [...detailBand.elements]
    .filter(el => el.kind === 'textField' || el.kind === 'staticText')
    .sort((a, b) => a.x - b.x)
}

function detectHeaderTexts(headerBand: JrBand | undefined, detailColumns: JrElement[]): string[] {
  if (!headerBand) return detailColumns.map((_, i) => `Column ${i + 1}`)
  const headers: string[] = []
  for (const col of detailColumns) {
    let matched = ''
    for (const el of headerBand.elements) {
      if (!isStaticText(el)) continue
      const overlapStart = Math.max(el.x, col.x)
      const overlapEnd = Math.min(el.x + el.width, col.x + col.width)
      if (overlapEnd > overlapStart) {
        if (!matched || el.x <= col.x) matched = el.text
      }
    }
    headers.push(matched || '')
  }
  return headers
}

function elementToCell(el: JrElement, ctx: LayoutContext): Cell {
  if (isTextField(el)) {
    const v = safeEval(el.expression, ctx)
    return {
      value: toCellValue(v),
      bold: el.font.bold,
      italic: el.font.italic,
      align: alignFromH(el.align.h),
      fill: el.mode === 'Opaque' ? el.backcolor : undefined,
      fontColor: el.forecolor,
      fontSize: el.font.size,
    }
  }
  if (isStaticText(el)) {
    return {
      value: el.text,
      bold: el.font.bold,
      italic: el.font.italic,
      align: alignFromH(el.align.h),
      fill: el.mode === 'Opaque' ? el.backcolor : undefined,
      fontColor: el.forecolor,
      fontSize: el.font.size,
    }
  }
  return { value: null }
}

function bandAsMergedRow(band: JrBand | undefined, ctx: LayoutContext, totalCols: number): SheetRow[] {
  if (!band) return []
  const textEls = band.elements.filter(el => isTextField(el) || isStaticText(el)) as (JrTextField | JrStaticText)[]
  if (textEls.length === 0) return []
  const sorted = [...textEls].sort((a, b) => a.y - b.y || a.x - b.x)
  const rows: SheetRow[] = []
  let currentY = -1
  let currentRow: SheetRow | null = null
  for (const el of sorted) {
    if (currentRow === null || Math.abs(el.y - currentY) > 4) {
      if (currentRow) rows.push(currentRow)
      currentY = el.y
      currentRow = { cells: Array.from({ length: totalCols }, () => ({ value: null })), merges: [] }
    }
    const startCol = Math.max(0, Math.min(totalCols - 1, Math.floor((el.x / 595) * totalCols)))
    currentRow.cells[startCol] = elementToCell(el, ctx)
  }
  if (currentRow) rows.push(currentRow)
  return rows
}

type ExcelJsCell = {
  value: unknown
  font: { name?: string; size?: number; bold?: boolean; italic?: boolean; color?: { argb: string } }
  alignment: { horizontal?: string; vertical?: string; wrapText?: boolean }
  fill?: { type: string; pattern: string; fgColor: { argb: string } }
  numFmt?: string
}
type ExcelJsRow = { getCell: (idx: number) => ExcelJsCell; height?: number }
type ExcelJsWorksheet = {
  addRow: (values: unknown[]) => ExcelJsRow
  mergeCells: (range: string) => void
  getColumn: (idx: number) => { width?: number }
  columns: { width?: number }[]
}
type ExcelJsWorkbook = {
  addWorksheet: (name: string) => ExcelJsWorksheet
  xlsx: { writeBuffer: () => Promise<ArrayBuffer> }
}

function hexToArgb(hex: string | undefined, fallback = 'FF000000'): string {
  if (!hex) return fallback
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return fallback
  return 'FF' + h.toUpperCase()
}

function applyCell(target: ExcelJsCell, cell: Cell) {
  target.value = cell.value
  target.font = {
    name: 'Helvetica',
    size: cell.fontSize ?? 10,
    bold: !!cell.bold,
    italic: !!cell.italic,
    color: { argb: hexToArgb(cell.fontColor) },
  }
  target.alignment = {
    horizontal: cell.align ?? 'left',
    vertical: 'middle',
    wrapText: true,
  }
  if (cell.fill) {
    target.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: hexToArgb(cell.fill, 'FFFFFFFF') },
    }
  }
  if (cell.numFmt) target.numFmt = cell.numFmt
}

export async function exportExcelDocument(opts: ExportExcelOptions): Promise<void> {
  const mod = await import('exceljs')
  const ExcelJs = (mod as { default?: { Workbook: new () => ExcelJsWorkbook }; Workbook?: new () => ExcelJsWorkbook })
  const WorkbookCtor = ExcelJs.default?.Workbook ?? ExcelJs.Workbook!
  const wb = new WorkbookCtor()
  const sheet = wb.addWorksheet(opts.report.name || 'Report')

  const detailBand = opts.report.bands.detail[0]
  const detailColumns = detailBand ? detectDetailColumns(detailBand) : []
  const totalCols = Math.max(1, detailColumns.length)

  for (let i = 0; i < totalCols; i++) {
    const col = detailColumns[i]
    if (col) sheet.getColumn(i + 1).width = Math.max(8, Math.round(col.width / 6))
  }

  const reportVars: Record<string, unknown> = {}
  const topCtx = buildContext(0, opts.rows[0] ?? {}, opts.parameters, reportVars)

  for (const sr of bandAsMergedRow(opts.report.bands.title, topCtx, totalCols)) {
    const r = sheet.addRow(sr.cells.map(c => c.value))
    sr.cells.forEach((c, i) => applyCell(r.getCell(i + 1), c))
  }
  for (const sr of bandAsMergedRow(opts.report.bands.pageHeader, topCtx, totalCols)) {
    const r = sheet.addRow(sr.cells.map(c => c.value))
    sr.cells.forEach((c, i) => applyCell(r.getCell(i + 1), c))
  }

  const headers = detectHeaderTexts(opts.report.bands.columnHeader, detailColumns)
  if (detailBand && headers.length > 0) {
    const headerRow = sheet.addRow(headers)
    headers.forEach((h, i) => {
      applyCell(headerRow.getCell(i + 1), {
        value: h,
        bold: true,
        align: 'center',
        fill: '#1A1A1A',
        fontColor: '#FFFFFF',
      })
    })
  }

  if (detailBand) {
    opts.rows.forEach((row, rowIdx) => {
      const ctx = buildContext(rowIdx + 1, row, opts.parameters, reportVars)
      const cells: Cell[] = detailColumns.map(col => elementToCell(col, ctx))
      const r = sheet.addRow(cells.map(c => c.value))
      cells.forEach((c, i) => applyCell(r.getCell(i + 1), c))
    })
  }

  const summaryCtx = buildContext(opts.rows.length, opts.rows[opts.rows.length - 1] ?? {}, opts.parameters, reportVars)
  for (const sr of bandAsMergedRow(opts.report.bands.columnFooter, summaryCtx, totalCols)) {
    const r = sheet.addRow(sr.cells.map(c => c.value))
    sr.cells.forEach((c, i) => applyCell(r.getCell(i + 1), c))
  }
  for (const sr of bandAsMergedRow(opts.report.bands.summary, summaryCtx, totalCols)) {
    const r = sheet.addRow(sr.cells.map(c => c.value))
    sr.cells.forEach((c, i) => applyCell(r.getCell(i + 1), c))
  }
  for (const sr of bandAsMergedRow(opts.report.bands.pageFooter, summaryCtx, totalCols)) {
    const r = sheet.addRow(sr.cells.map(c => c.value))
    sr.cells.forEach((c, i) => applyCell(r.getCell(i + 1), c))
  }

  const buffer = await wb.xlsx.writeBuffer()
  triggerDownload(buffer, opts.filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

function triggerDownload(data: ArrayBuffer, filename: string, mime: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
