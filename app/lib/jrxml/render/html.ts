import type {
  Page, PositionedBox, TextPayload, LinePayload, RectPayload,
  ImagePayload, BarcodePayload, FramePayload, JrBox, JrPen,
} from '../types'
import { renderBarcodeDataUrl } from './barcode'

export interface ExportHtmlOptions {
  pages: Page[]
  pageWidth: number
  pageHeight: number
  filename: string
  title?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function styleStr(obj: Record<string, string | number | undefined>): string {
  const parts: string[] = []
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v == null || v === '') continue
    parts.push(`${k}:${v}`)
  }
  return parts.join(';')
}

function penToBorder(pen: JrPen | undefined): string {
  if (!pen || !pen.lineWidth) return 'none'
  const style = pen.lineStyle === 'Dashed' ? 'dashed' : pen.lineStyle === 'Dotted' ? 'dotted' : 'solid'
  return `${pen.lineWidth}px ${style} ${pen.lineColor || '#000'}`
}

function boxBorders(box: JrBox | undefined): Record<string, string> {
  if (!box) return {}
  const top = box.topPen ?? box.pen
  const bottom = box.bottomPen ?? box.pen
  const left = box.leftPen ?? box.pen
  const right = box.rightPen ?? box.pen
  const styles: Record<string, string> = {}
  if (top && top.lineWidth) styles['border-top'] = penToBorder(top)
  if (bottom && bottom.lineWidth) styles['border-bottom'] = penToBorder(bottom)
  if (left && left.lineWidth) styles['border-left'] = penToBorder(left)
  if (right && right.lineWidth) styles['border-right'] = penToBorder(right)
  return styles
}

async function renderBoxHtml(box: PositionedBox): Promise<string> {
  switch (box.kind) {
    case 'text': return renderTextHtml(box)
    case 'line': return renderLineHtml(box)
    case 'rect': return renderRectHtml(box)
    case 'image': return renderImageHtml(box)
    case 'barcode': return await renderBarcodeHtml(box)
    case 'frame': return await renderFrameHtml(box)
  }
  return ''
}

function renderTextHtml(box: PositionedBox): string {
  const p = box.payload as TextPayload
  const padL = p.box?.padding?.left ?? 2
  const padR = p.box?.padding?.right ?? 2
  const padT = p.box?.padding?.top ?? 0
  const padB = p.box?.padding?.bottom ?? 0

  const justify = p.align.v === 'Bottom' ? 'flex-end' : p.align.v === 'Middle' ? 'center' : 'flex-start'
  const align = p.align.h === 'Center' ? 'center' : p.align.h === 'Right' ? 'right' : 'left'

  const style: Record<string, string | number | undefined> = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    'font-family': p.font.name || 'Helvetica, Arial, sans-serif',
    'font-size': `${p.font.size}px`,
    'font-weight': p.font.bold ? 'bold' : 'normal',
    'font-style': p.font.italic ? 'italic' : 'normal',
    color: p.forecolor || '#000',
    'text-align': align,
    display: 'flex',
    'flex-direction': 'column',
    'justify-content': justify,
    'box-sizing': 'border-box',
    'padding-top': `${padT}px`,
    'padding-right': `${padR}px`,
    'padding-bottom': `${padB}px`,
    'padding-left': `${padL}px`,
    'white-space': 'pre-wrap',
    'overflow': 'hidden',
    ...boxBorders(p.box),
  }
  if (p.mode === 'Opaque' && p.backcolor) style['background'] = p.backcolor

  const lines = p.lines && p.lines.length ? p.lines : [p.text]
  const body = escapeHtml(lines.join('\n'))
  return `<div style="${styleStr(style)}">${body}</div>`
}

function renderLineHtml(box: PositionedBox): string {
  const p = box.payload as LinePayload
  const color = p.pen.lineColor || '#000'
  const w = p.pen.lineWidth || 0.5
  const dash = p.pen.lineStyle === 'Dashed' ? 'dashed' : p.pen.lineStyle === 'Dotted' ? 'dotted' : 'solid'

  if (p.direction === 'BottomUp' || (box.width > 1 && box.height > 1)) {
    const isDiag = box.width > 1 && box.height > 1
    if (isDiag) {
      const length = Math.sqrt(box.width * box.width + box.height * box.height)
      const angle = p.direction === 'BottomUp'
        ? -Math.atan2(box.height, box.width) * 180 / Math.PI
        : Math.atan2(box.height, box.width) * 180 / Math.PI
      const originY = p.direction === 'BottomUp' ? box.y + box.height : box.y
      const style: Record<string, string | number> = {
        position: 'absolute',
        left: `${box.x}px`,
        top: `${originY}px`,
        width: `${length}px`,
        height: `${w}px`,
        background: color,
        'transform-origin': '0 0',
        transform: `rotate(${angle}deg)`,
      }
      return `<div style="${styleStr(style)}"></div>`
    }
  }

  if (box.height <= 1) {
    const style: Record<string, string | number> = {
      position: 'absolute',
      left: `${box.x}px`,
      top: `${box.y}px`,
      width: `${box.width}px`,
      height: `${w}px`,
      'border-top': `${w}px ${dash} ${color}`,
    }
    return `<div style="${styleStr(style)}"></div>`
  }
  const style: Record<string, string | number> = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${w}px`,
    height: `${box.height}px`,
    'border-left': `${w}px ${dash} ${color}`,
  }
  return `<div style="${styleStr(style)}"></div>`
}

function renderRectHtml(box: PositionedBox): string {
  const p = box.payload as RectPayload
  const style: Record<string, string | number | undefined> = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    'box-sizing': 'border-box',
  }
  if (p.pen?.lineWidth) {
    const dash = p.pen.lineStyle === 'Dashed' ? 'dashed' : p.pen.lineStyle === 'Dotted' ? 'dotted' : 'solid'
    style['border'] = `${p.pen.lineWidth}px ${dash} ${p.pen.lineColor || '#000'}`
  }
  if (p.mode === 'Opaque' && p.backcolor) style['background'] = p.backcolor
  if (p.radius && p.radius > 0) style['border-radius'] = `${p.radius}px`
  return `<div style="${styleStr(style)}"></div>`
}

function renderImageHtml(box: PositionedBox): string {
  const p = box.payload as ImagePayload
  if (!p.src) return ''
  const style: Record<string, string | number> = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    'object-fit': p.scaleImage === 'Clip' ? 'none' : p.scaleImage === 'RetainShape' ? 'contain' : 'fill',
  }
  return `<img src="${escapeHtml(p.src)}" style="${styleStr(style)}" alt="">`
}

async function renderBarcodeHtml(box: PositionedBox): Promise<string> {
  const p = box.payload as BarcodePayload
  if (!p.code) return ''
  const pxW = Math.max(64, Math.ceil(box.width * 2))
  const pxH = Math.max(64, Math.ceil(box.height * 2))
  const dataUrl = await renderBarcodeDataUrl(p, pxW, pxH)
  if (!dataUrl) return ''
  const style: Record<string, string | number> = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
  }
  return `<img src="${dataUrl}" style="${styleStr(style)}" alt="">`
}

async function renderFrameHtml(box: PositionedBox): Promise<string> {
  const p = box.payload as FramePayload
  const style: Record<string, string | number | undefined> = {
    position: 'absolute',
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    'box-sizing': 'border-box',
    overflow: 'hidden',
    ...boxBorders(p.box),
  }
  if (p.mode === 'Opaque' && p.backcolor) style['background'] = p.backcolor

  const children: string[] = []
  for (const child of p.children) {
    const absChild: PositionedBox = { ...child, x: child.x, y: child.y }
    children.push(await renderBoxHtml(absChild))
  }
  return `<div style="${styleStr(style)}">${children.join('')}</div>`
}

export async function exportHtmlDocument(opts: ExportHtmlOptions): Promise<void> {
  const PT_TO_PX = 96 / 72
  const pages: string[] = []
  for (const page of opts.pages) {
    const boxes: string[] = []
    for (const box of page.boxes) boxes.push(await renderBoxHtml(box))
    pages.push(`<div class="jrxml-page">${boxes.join('')}</div>`)
  }

  const css = `
* { box-sizing: border-box; }
body { margin: 0; background: #525659; font-family: Helvetica, Arial, sans-serif; }
.jrxml-doc { padding: 24px; display: flex; flex-direction: column; align-items: center; }
.jrxml-page {
  position: relative;
  width: ${opts.pageWidth}px;
  height: ${opts.pageHeight}px;
  background: #fff;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.2);
  overflow: hidden;
  transform: scale(${PT_TO_PX});
  transform-origin: top left;
}
.jrxml-page-wrap {
  width: ${Math.floor(opts.pageWidth * PT_TO_PX)}px;
  height: ${Math.floor(opts.pageHeight * PT_TO_PX)}px;
  margin-bottom: 24px;
  position: relative;
}
.jrxml-page-wrap .jrxml-page { margin-bottom: 0; position: absolute; top: 0; left: 0; }
@media print {
  body { background: #fff; }
  .jrxml-doc { padding: 0; display: block; }
  .jrxml-page-wrap { margin: 0 !important; break-after: page; break-inside: avoid; overflow: hidden; }
  .jrxml-page-wrap:last-child { break-after: auto; }
  .jrxml-page { box-shadow: none !important; margin: 0 !important; }
  @page { size: ${opts.pageWidth}pt ${opts.pageHeight}pt; margin: 0; }
}
`.trim()

  const wrappedPages = opts.pages.map((_, i) =>
    `<div class="jrxml-page-wrap">${pages[i] ?? ''}</div>`,
  ).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(opts.title || opts.filename)}</title>
<style>${css}</style>
</head>
<body>
<div class="jrxml-doc">
${wrappedPages}
</div>
</body>
</html>`

  if (typeof window === 'undefined') return
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = opts.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
