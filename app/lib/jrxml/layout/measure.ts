import type { JrFont } from '../types'
import { mapFontFamily } from '../units'

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

function getContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (ctx) return ctx
  canvas = document.createElement('canvas')
  ctx = canvas.getContext('2d')
  return ctx
}

function fontToCss(font: JrFont): string {
  const style = font.italic ? 'italic ' : ''
  const weight = font.bold ? '700 ' : '400 '
  return `${style}${weight}${font.size}px ${mapFontFamily(font.name)}`
}

const widthCache = new Map<string, number>()

function measureWidth(text: string, font: JrFont): number {
  const key = `${fontToCss(font)}::${text}`
  const cached = widthCache.get(key)
  if (cached !== undefined) return cached
  const c = getContext()
  let width: number
  if (c) {
    c.font = fontToCss(font)
    width = c.measureText(text).width
  } else {
    width = text.length * font.size * 0.55
  }
  widthCache.set(key, width)
  return width
}

export interface MeasureResult {
  lines: string[]
  width: number
  height: number
  lineHeight: number
}

export function measureText(text: string, font: JrFont, maxWidth: number): MeasureResult {
  const lineHeight = Math.ceil(font.size * 1.2)
  if (!text) return { lines: [''], width: 0, height: lineHeight, lineHeight }

  const lines: string[] = []
  const rawLines = String(text).split(/\r\n|\r|\n/)

  for (const raw of rawLines) {
    if (!raw) { lines.push(''); continue }
    if (measureWidth(raw, font) <= maxWidth) { lines.push(raw); continue }

    const words = raw.split(/(\s+)/)
    let cur = ''
    for (const word of words) {
      const candidate = cur + word
      if (measureWidth(candidate, font) <= maxWidth || cur === '') {
        cur = candidate
      } else {
        lines.push(cur.trimEnd())
        cur = word.trimStart()
      }
      if (measureWidth(cur, font) > maxWidth) {
        let chunk = ''
        for (const ch of cur) {
          if (measureWidth(chunk + ch, font) > maxWidth && chunk) {
            lines.push(chunk)
            chunk = ch
          } else {
            chunk += ch
          }
        }
        cur = chunk
      }
    }
    if (cur) lines.push(cur)
  }

  let width = 0
  for (const line of lines) width = Math.max(width, measureWidth(line, font))

  return { lines, width, height: lines.length * lineHeight, lineHeight }
}
