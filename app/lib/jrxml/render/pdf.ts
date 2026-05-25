import type {
  Page, PositionedBox, TextPayload, LinePayload, RectPayload,
  ImagePayload, BarcodePayload, FramePayload, JrBox, JrPen,
} from '../types'
import { renderBarcodeDataUrl } from './barcode'

type JsPdf = {
  addPage: (format: [number, number], orientation: 'portrait' | 'landscape') => void
  setFont: (family: string, style: string) => void
  setFontSize: (size: number) => void
  setTextColor: (r: number, g: number, b: number) => void
  setFillColor: (r: number, g: number, b: number) => void
  setDrawColor: (r: number, g: number, b: number) => void
  setLineWidth: (w: number) => void
  setLineDashPattern: (pattern: number[], phase: number) => void
  text: (text: string, x: number, y: number, opts?: { align?: 'left' | 'center' | 'right' }) => void
  line: (x1: number, y1: number, x2: number, y2: number) => void
  rect: (x: number, y: number, w: number, h: number, style?: string) => void
  roundedRect: (x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string) => void
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void
  save: (filename: string) => void
}

export interface ExportPdfOptions {
  pages: Page[]
  pageWidth: number
  pageHeight: number
  filename: string
}

export async function exportPdfDocument(opts: ExportPdfOptions): Promise<void> {
  const mod = await import('jspdf')
  const JsPDF = (mod as { jsPDF: new (init: object) => JsPdf }).jsPDF
  const orientation: 'portrait' | 'landscape' = opts.pageWidth > opts.pageHeight ? 'landscape' : 'portrait'
  const doc = new JsPDF({
    unit: 'pt',
    format: [opts.pageWidth, opts.pageHeight],
    orientation,
  })

  for (let i = 0; i < opts.pages.length; i++) {
    if (i > 0) doc.addPage([opts.pageWidth, opts.pageHeight], orientation)
    const page = opts.pages[i]
    if (!page) continue
    for (const box of page.boxes) {
      await renderBox(doc, box)
    }
  }

  doc.save(opts.filename)
}

function mapPdfFont(name: string): string {
  const n = (name || '').toLowerCase()
  if (n.includes('mono') || n.includes('courier')) return 'courier'
  if ((n.includes('serif') && !n.includes('sans')) || n.includes('times')) return 'times'
  return 'helvetica'
}

function fontStyle(bold: boolean, italic: boolean): string {
  if (bold && italic) return 'bolditalic'
  if (bold) return 'bold'
  if (italic) return 'italic'
  return 'normal'
}

function hexToRgb(hex: string | undefined): [number, number, number] {
  if (!hex) return [0, 0, 0]
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return [0, 0, 0]
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ]
}

function applyPenStyle(doc: JsPdf, pen: JrPen) {
  const [r, g, b] = hexToRgb(pen.lineColor)
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(pen.lineWidth || 0.5)
  if (pen.lineStyle === 'Dashed') doc.setLineDashPattern([4, 3], 0)
  else if (pen.lineStyle === 'Dotted') doc.setLineDashPattern([1, 2], 0)
  else doc.setLineDashPattern([], 0)
}

function drawBoxBorders(doc: JsPdf, box: PositionedBox, jrBox?: JrBox) {
  if (!jrBox) return
  const draw = (pen: JrPen | undefined, x1: number, y1: number, x2: number, y2: number) => {
    if (!pen || !pen.lineWidth) return
    applyPenStyle(doc, pen)
    doc.line(x1, y1, x2, y2)
  }
  const top = jrBox.topPen ?? jrBox.pen
  const bottom = jrBox.bottomPen ?? jrBox.pen
  const left = jrBox.leftPen ?? jrBox.pen
  const right = jrBox.rightPen ?? jrBox.pen
  draw(top, box.x, box.y, box.x + box.width, box.y)
  draw(bottom, box.x, box.y + box.height, box.x + box.width, box.y + box.height)
  draw(left, box.x, box.y, box.x, box.y + box.height)
  draw(right, box.x + box.width, box.y, box.x + box.width, box.y + box.height)
  doc.setLineDashPattern([], 0)
}

async function renderBox(doc: JsPdf, box: PositionedBox): Promise<void> {
  switch (box.kind) {
    case 'text': renderText(doc, box); break
    case 'line': renderLine(doc, box); break
    case 'rect': renderRect(doc, box); break
    case 'image': await renderImage(doc, box); break
    case 'barcode': await renderBarcode(doc, box); break
    case 'frame': await renderFrame(doc, box); break
  }
}

function renderText(doc: JsPdf, box: PositionedBox) {
  const p = box.payload as TextPayload
  const lines = p.lines && p.lines.length ? p.lines : [p.text]

  if (p.mode === 'Opaque' && p.backcolor) {
    const [r, g, b] = hexToRgb(p.backcolor)
    doc.setFillColor(r, g, b)
    doc.rect(box.x, box.y, box.width, box.height, 'F')
  }

  drawBoxBorders(doc, box, p.box)

  doc.setFont(mapPdfFont(p.font.name), fontStyle(p.font.bold, p.font.italic))
  doc.setFontSize(p.font.size)
  const [fr, fg, fb] = hexToRgb(p.forecolor)
  doc.setTextColor(fr, fg, fb)

  const padTop = p.box?.padding?.top ?? 0
  const padBottom = p.box?.padding?.bottom ?? 0
  const padLeft = p.box?.padding?.left ?? 2
  const padRight = p.box?.padding?.right ?? 2

  const lineHeight = p.font.size * 1.2
  const totalH = lines.length * lineHeight
  const ascent = p.font.size * 0.85
  const innerH = box.height - padTop - padBottom

  let startBaselineY: number
  if (p.align.v === 'Bottom') startBaselineY = box.y + box.height - padBottom - totalH + ascent
  else if (p.align.v === 'Middle') startBaselineY = box.y + padTop + (innerH - totalH) / 2 + ascent
  else startBaselineY = box.y + padTop + ascent

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    let x: number
    let align: 'left' | 'center' | 'right'
    if (p.align.h === 'Center') { x = box.x + box.width / 2; align = 'center' }
    else if (p.align.h === 'Right') { x = box.x + box.width - padRight; align = 'right' }
    else { x = box.x + padLeft; align = 'left' }
    doc.text(line, x, startBaselineY + i * lineHeight, { align })
  }
}

function renderLine(doc: JsPdf, box: PositionedBox) {
  const p = box.payload as LinePayload
  applyPenStyle(doc, p.pen)
  if (p.direction === 'BottomUp') {
    doc.line(box.x, box.y + box.height, box.x + box.width, box.y)
  } else if (box.height <= 1) {
    doc.line(box.x, box.y, box.x + box.width, box.y)
  } else if (box.width <= 1) {
    doc.line(box.x, box.y, box.x, box.y + box.height)
  } else {
    doc.line(box.x, box.y, box.x + box.width, box.y + box.height)
  }
  doc.setLineDashPattern([], 0)
}

function renderRect(doc: JsPdf, box: PositionedBox) {
  const p = box.payload as RectPayload
  const hasFill = p.mode === 'Opaque' && !!p.backcolor
  const hasStroke = !!(p.pen?.lineWidth)
  if (!hasFill && !hasStroke) return

  if (hasFill) {
    const [r, g, b] = hexToRgb(p.backcolor!)
    doc.setFillColor(r, g, b)
  }
  if (hasStroke) applyPenStyle(doc, p.pen)

  const style = hasFill && hasStroke ? 'FD' : hasFill ? 'F' : 'S'
  if (p.radius && p.radius > 0) {
    doc.roundedRect(box.x, box.y, box.width, box.height, p.radius, p.radius, style)
  } else {
    doc.rect(box.x, box.y, box.width, box.height, style)
  }
  doc.setLineDashPattern([], 0)
}

async function renderImage(doc: JsPdf, box: PositionedBox) {
  const p = box.payload as ImagePayload
  if (!p.src) return
  try {
    const dataUrl = await loadImageAsDataUrl(p.src)
    if (!dataUrl) return
    doc.addImage(dataUrl, 'PNG', box.x, box.y, box.width, box.height)
  } catch { /* skip */ }
}

async function loadImageAsDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src
  if (typeof window === 'undefined') return ''
  return new Promise<string>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')
        if (!ctx) { resolve(''); return }
        ctx.drawImage(img, 0, 0)
        resolve(c.toDataURL('image/png'))
      } catch { resolve('') }
    }
    img.onerror = () => resolve('')
    img.src = src
  })
}

async function renderBarcode(doc: JsPdf, box: PositionedBox) {
  const p = box.payload as BarcodePayload
  if (!p.code) return
  const pxW = Math.max(64, Math.ceil(box.width * 2))
  const pxH = Math.max(64, Math.ceil(box.height * 2))
  const dataUrl = await renderBarcodeDataUrl(p, pxW, pxH)
  if (!dataUrl) return
  doc.addImage(dataUrl, 'PNG', box.x, box.y, box.width, box.height)
}

async function renderFrame(doc: JsPdf, box: PositionedBox) {
  const p = box.payload as FramePayload

  if (p.mode === 'Opaque' && p.backcolor) {
    const [r, g, b] = hexToRgb(p.backcolor)
    doc.setFillColor(r, g, b)
    doc.rect(box.x, box.y, box.width, box.height, 'F')
  }

  drawBoxBorders(doc, box, p.box)

  for (const child of p.children) {
    const absChild: PositionedBox = { ...child, x: child.x + box.x, y: child.y + box.y }
    await renderBox(doc, absChild)
  }
}
