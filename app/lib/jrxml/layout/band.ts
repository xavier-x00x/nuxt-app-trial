import type {
  JrBand, JrBox, JrElement, PositionedBox, TextPayload, LinePayload, RectPayload,
  ImagePayload, BarcodePayload, FramePayload, JrFrame, JrTextField, JrStaticText, JrLine,
  JrRectangle, JrImage, JrBarcode,
} from '../types'
import type { EvalContext } from '../expr/evaluator'
import { evalExpression, ExprError } from '../expr/evaluator'
import { applyPattern } from '../expr/format'
import { measureText } from './measure'

export interface LayoutContext extends EvalContext {}

const MEASURE_SAFETY_PX = 2
const DEFAULT_HPAD_PX = 2

function getPadding(box?: JrBox) {
  const p = box?.padding
  return {
    l: p?.left ?? DEFAULT_HPAD_PX,
    r: p?.right ?? DEFAULT_HPAD_PX,
    t: p?.top ?? 0,
    b: p?.bottom ?? 0,
  }
}

export interface LaidBand {
  height: number
  boxes: PositionedBox[]
}

export function layoutBand(band: JrBand, ctx: LayoutContext): LaidBand {
  if (band.printWhenExpression) {
    try {
      if (!evalExpression(band.printWhenExpression, ctx)) return { height: 0, boxes: [] }
    } catch { /* fall through and render */ }
  }

  const boxes: PositionedBox[] = []
  let maxStretchedBottom = band.height

  type Tracked = { box: PositionedBox; stretchType?: string; bandY: number }
  const tracked: Tracked[] = []

  for (const el of band.elements) {
    if (el.printWhenExpression) {
      try {
        if (!evalExpression(el.printWhenExpression, ctx)) continue
      } catch { /* render anyway */ }
    }

    const layout = layoutElement(el, ctx)
    if (!layout) continue

    for (const b of layout.boxes) {
      boxes.push(b)
      tracked.push({ box: b, stretchType: el.stretchType, bandY: b.y })
      const bottom = b.y + b.height
      if (bottom > maxStretchedBottom) maxStretchedBottom = bottom
    }
  }

  for (const t of tracked) {
    if (t.stretchType === 'RelativeToTallestObject' || t.stretchType === 'RelativeToBandHeight') {
      const newHeight = maxStretchedBottom - t.bandY
      if (newHeight > t.box.height) t.box.height = newHeight
    }
  }

  return { height: maxStretchedBottom, boxes }
}

function layoutElement(el: JrElement, ctx: LayoutContext): LaidBand | null {
  switch (el.kind) {
    case 'staticText': return laidStaticText(el)
    case 'textField': return laidTextField(el, ctx)
    case 'line': return laidLine(el)
    case 'rectangle': return laidRect(el)
    case 'image': return laidImage(el, ctx)
    case 'barcode': return laidBarcode(el, ctx)
    case 'frame': return laidFrame(el, ctx)
    case 'break': return null
  }
}

function laidStaticText(el: JrStaticText): LaidBand {
  const text = el.text
  const pad = getPadding(el.box)
  const maxW = Math.max(1, el.width - pad.l - pad.r - MEASURE_SAFETY_PX)
  const measured = measureText(text, el.font, maxW)
  const payload: TextPayload = {
    text,
    font: el.font,
    align: el.align,
    box: el.box,
    forecolor: el.forecolor,
    backcolor: el.backcolor,
    mode: el.mode,
    lines: measured.lines,
  }
  return {
    height: el.height,
    boxes: [{ kind: 'text', x: el.x, y: el.y, width: el.width, height: el.height, payload }],
  }
}

function laidTextField(el: JrTextField, ctx: LayoutContext): LaidBand {
  let value: unknown
  try {
    value = evalExpression(el.expression, ctx)
  } catch (e) {
    value = e instanceof ExprError ? '#ERR' : ''
  }
  if ((value == null || value === '') && el.isBlankWhenNull) value = ''

  const text = applyPattern(value, el.pattern)
  const pad = getPadding(el.box)
  const maxW = Math.max(1, el.width - pad.l - pad.r - MEASURE_SAFETY_PX)
  const measured = measureText(text, el.font, maxW)

  let height = el.height
  const contentH = measured.height + pad.t + pad.b
  if (el.isStretchWithOverflow && contentH > height) height = contentH

  const payload: TextPayload = {
    text,
    font: el.font,
    align: el.align,
    box: el.box,
    forecolor: el.forecolor,
    backcolor: el.backcolor,
    mode: el.mode,
    lines: measured.lines,
  }
  return {
    height,
    boxes: [{ kind: 'text', x: el.x, y: el.y, width: el.width, height, payload }],
  }
}

function laidLine(el: JrLine): LaidBand {
  const payload: LinePayload = { pen: el.pen, direction: el.direction }
  return {
    height: el.height,
    boxes: [{ kind: 'line', x: el.x, y: el.y, width: el.width, height: el.height, payload }],
  }
}

function laidRect(el: JrRectangle): LaidBand {
  const payload: RectPayload = {
    pen: el.pen,
    radius: el.radius,
    backcolor: el.backcolor,
    mode: el.mode,
  }
  return {
    height: el.height,
    boxes: [{ kind: 'rect', x: el.x, y: el.y, width: el.width, height: el.height, payload }],
  }
}

function laidImage(el: JrImage, ctx: LayoutContext): LaidBand {
  let src = ''
  try {
    src = String(evalExpression(el.expression, ctx) ?? '')
  } catch { src = '' }
  const payload: ImagePayload = {
    src,
    scaleImage: el.scaleImage,
    hAlign: el.hAlign,
    vAlign: el.vAlign,
    box: el.box,
  }
  return {
    height: el.height,
    boxes: [{ kind: 'image', x: el.x, y: el.y, width: el.width, height: el.height, payload }],
  }
}

function laidBarcode(el: JrBarcode, ctx: LayoutContext): LaidBand {
  let code = ''
  try { code = String(evalExpression(el.codeExpression, ctx) ?? '') } catch { code = '' }
  const payload: BarcodePayload = { code, type: el.type }
  return {
    height: el.height,
    boxes: [{ kind: 'barcode', x: el.x, y: el.y, width: el.width, height: el.height, payload }],
  }
}

function laidFrame(el: JrFrame, ctx: LayoutContext): LaidBand {
  const children: PositionedBox[] = []
  for (const child of el.children) {
    const sub = layoutElement(child, ctx)
    if (!sub) continue
    children.push(...sub.boxes)
  }
  const payload: FramePayload = {
    box: el.box,
    backcolor: el.backcolor,
    mode: el.mode,
    children,
  }
  return {
    height: el.height,
    boxes: [{ kind: 'frame', x: el.x, y: el.y, width: el.width, height: el.height, payload }],
  }
}
