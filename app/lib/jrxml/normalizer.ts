import type {
  JrReport, JrBand, JrElement, JrFont, JrBox, JrPen, JrAlign, JrFrame,
  JrTextField, JrStaticText, JrLine, JrRectangle, JrImage, JrBarcode,
  JrParameter, JrField, JrVariable, JrGroup, JrAlignH, JrAlignV,
} from './types'
import { parseColor } from './units'

type RawNode = Record<string, unknown>

function arr<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function num(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function bool(value: unknown, fallback = false): boolean {
  if (value == null) return fallback
  if (typeof value === 'boolean') return value
  return String(value).toLowerCase() === 'true'
}

function attrs(node: RawNode | undefined): RawNode {
  if (!node) return {}
  const out: RawNode = {}
  for (const k of Object.keys(node)) {
    if (k.startsWith('@_')) out[k.slice(2)] = node[k]
  }
  return out
}

function child<T = RawNode>(node: RawNode | undefined, name: string): T | undefined {
  if (!node) return undefined
  return node[name] as T | undefined
}

const DEFAULT_FONT: JrFont = {
  name: 'SansSerif',
  size: 10,
  bold: false,
  italic: false,
  underline: false,
}

function parseFont(reportFont: JrFont, textElement: RawNode | undefined): JrFont {
  const a = attrs(textElement)
  const fontNode = child<RawNode>(textElement, 'font')
  const fontAttrs = attrs(fontNode)
  const f: RawNode = { ...a, ...fontAttrs }
  return {
    name: (f.fontName as string) ?? reportFont.name,
    size: num(f.fontSize ?? f.size, reportFont.size),
    bold: bool(f.isBold, reportFont.bold),
    italic: bool(f.isItalic, reportFont.italic),
    underline: bool(f.isUnderline, reportFont.underline),
    strikeThrough: bool(f.isStrikeThrough, false),
  }
}

function parsePen(node: RawNode | undefined, fallback: Partial<JrPen> = {}): JrPen {
  const a = attrs(node)
  return {
    lineWidth: num(a.lineWidth, fallback.lineWidth ?? 0.5),
    lineStyle: (a.lineStyle as JrPen['lineStyle']) ?? fallback.lineStyle ?? 'Solid',
    lineColor: parseColor(a.lineColor as string) ?? fallback.lineColor ?? '#000000',
  }
}

function parseBox(node: RawNode | undefined): JrBox {
  const a = attrs(node)
  const out: JrBox = {}
  if (node) {
    const pen = child<RawNode>(node, 'pen')
    if (pen) out.pen = parsePen(pen)
    const tp = child<RawNode>(node, 'topPen'); if (tp) out.topPen = parsePen(tp)
    const lp = child<RawNode>(node, 'leftPen'); if (lp) out.leftPen = parsePen(lp)
    const rp = child<RawNode>(node, 'rightPen'); if (rp) out.rightPen = parsePen(rp)
    const bp = child<RawNode>(node, 'bottomPen'); if (bp) out.bottomPen = parsePen(bp)
    const padding = num(a.padding)
    if (padding || a.topPadding || a.rightPadding || a.bottomPadding || a.leftPadding) {
      out.padding = {
        top: num(a.topPadding, padding),
        right: num(a.rightPadding, padding),
        bottom: num(a.bottomPadding, padding),
        left: num(a.leftPadding, padding),
      }
    }
  }
  return out
}

function parseAlign(textElement: RawNode | undefined): JrAlign {
  const a = attrs(textElement)
  return {
    h: (a.textAlignment as JrAlignH) ?? (a.hTextAlign as JrAlignH) ?? (a.horizontalAlignment as JrAlignH) ?? 'Left',
    v: (a.verticalAlignment as JrAlignV) ?? (a.vTextAlign as JrAlignV) ?? 'Top',
  }
}

function parseReportElement(el: RawNode | undefined) {
  const reportEl = child<RawNode>(el, 'reportElement')
  const a = attrs(reportEl)
  const printWhen = childText(reportEl, 'printWhenExpression') ?? childText(el, 'printWhenExpression') ?? (a.printWhenExpression as string | undefined)
  return {
    x: num(a.x),
    y: num(a.y),
    width: num(a.width),
    height: num(a.height),
    key: a.key as string | undefined,
    mode: (a.mode as 'Opaque' | 'Transparent' | undefined),
    backcolor: parseColor(a.backcolor as string),
    forecolor: parseColor(a.forecolor as string),
    positionType: a.positionType as 'Float' | 'FixRelativeToTop' | 'FixRelativeToBottom' | undefined,
    stretchType: a.stretchType as 'NoStretch' | 'RelativeToTallestObject' | 'RelativeToBandHeight' | undefined,
    printWhenExpression: printWhen,
  }
}

function childText(node: RawNode | undefined, name: string): string | undefined {
  const c = node?.[name]
  if (c == null) return undefined
  if (typeof c === 'string') return c
  if (typeof c === 'object') {
    const v = (c as RawNode)['#text']
    return v == null ? undefined : String(v)
  }
  return String(c)
}

function elementsFromBand(bandNode: RawNode | undefined, reportFont: JrFont): JrElement[] {
  if (!bandNode) return []
  const elements: JrElement[] = []
  const order: { name: string; build: (n: RawNode) => JrElement | null }[] = [
    { name: 'staticText', build: n => buildStaticText(n, reportFont) },
    { name: 'textField', build: n => buildTextField(n, reportFont) },
    { name: 'line', build: n => buildLine(n) },
    { name: 'rectangle', build: n => buildRectangle(n) },
    { name: 'image', build: n => buildImage(n) },
    { name: 'frame', build: n => buildFrame(n, reportFont) },
    { name: 'componentElement', build: n => buildBarcode(n) },
    { name: 'break', build: n => buildBreak(n) },
  ]
  for (const { name, build } of order) {
    for (const raw of arr<RawNode>(bandNode[name] as RawNode | RawNode[] | undefined)) {
      const el = build(raw)
      if (el) elements.push(el)
    }
  }
  return elements
}

function buildStaticText(node: RawNode, reportFont: JrFont): JrStaticText {
  const base = parseReportElement(node)
  return {
    kind: 'staticText',
    ...base,
    text: childText(node, 'text') ?? '',
    font: parseFont(reportFont, child<RawNode>(node, 'textElement') ?? node),
    align: parseAlign(child<RawNode>(node, 'textElement') ?? node),
    box: parseBox(child<RawNode>(node, 'box')),
  }
}

function buildTextField(node: RawNode, reportFont: JrFont): JrTextField {
  const base = parseReportElement(node)
  const a = attrs(node)
  const stretchByAdjust = String(a.textAdjust ?? '').toLowerCase() === 'stretchheight'
  return {
    kind: 'textField',
    ...base,
    expression: childText(node, 'textFieldExpression') ?? '',
    pattern: a.pattern as string | undefined,
    isStretchWithOverflow: bool(a.isStretchWithOverflow, false) || stretchByAdjust,
    isBlankWhenNull: bool(a.isBlankWhenNull, false),
    evaluationTime: a.evaluationTime as JrTextField['evaluationTime'],
    font: parseFont(reportFont, child<RawNode>(node, 'textElement') ?? node),
    align: parseAlign(child<RawNode>(node, 'textElement') ?? node),
    box: parseBox(child<RawNode>(node, 'box')),
  }
}

function buildLine(node: RawNode): JrLine {
  const base = parseReportElement(node)
  const a = attrs(node)
  return {
    kind: 'line',
    ...base,
    direction: (a.direction as JrLine['direction']) ?? 'TopDown',
    pen: parsePen(child<RawNode>(node, 'graphicElement') ? child<RawNode>(child<RawNode>(node, 'graphicElement'), 'pen') : child<RawNode>(node, 'pen')),
  }
}

function buildRectangle(node: RawNode): JrRectangle {
  const base = parseReportElement(node)
  const a = attrs(node)
  return {
    kind: 'rectangle',
    ...base,
    radius: num(a.radius, 0),
    pen: parsePen(child<RawNode>(node, 'graphicElement') ? child<RawNode>(child<RawNode>(node, 'graphicElement'), 'pen') : child<RawNode>(node, 'pen')),
  }
}

function buildImage(node: RawNode): JrImage {
  const base = parseReportElement(node)
  const a = attrs(node)
  return {
    kind: 'image',
    ...base,
    expression: childText(node, 'imageExpression') ?? '',
    scaleImage: (a.scaleImage as JrImage['scaleImage']) ?? 'RetainShape',
    hAlign: a.hAlign as JrAlignH | undefined,
    vAlign: a.vAlign as JrAlignV | undefined,
    box: parseBox(child<RawNode>(node, 'box')),
  }
}

function buildFrame(node: RawNode, reportFont: JrFont): JrFrame {
  const base = parseReportElement(node)
  return {
    kind: 'frame',
    ...base,
    box: parseBox(child<RawNode>(node, 'box')),
    children: elementsFromBand(node, reportFont),
  }
}

function buildBarcode(node: RawNode): JrBarcode | null {
  const base = parseReportElement(node)
  const inner = child<RawNode>(node, 'jr:barbecue') ?? child<RawNode>(node, 'barbecue') ?? child<RawNode>(node, 'barcode')
  if (!inner) return null
  const a = attrs(inner)
  let type: JrBarcode['type'] = 'code128'
  const raw = String(a.type ?? '').toLowerCase()
  if (raw.includes('qr')) type = 'qrcode'
  else if (raw.includes('ean13')) type = 'ean13'
  else if (raw.includes('code39')) type = 'code39'
  return {
    kind: 'barcode',
    ...base,
    type,
    codeExpression: childText(inner, 'codeExpression') ?? childText(inner, 'jr:codeExpression') ?? '',
  }
}

function buildBreak(node: RawNode): JrElement {
  const base = parseReportElement(node)
  const a = attrs(node)
  return {
    kind: 'break',
    ...base,
    type: (a.type as 'Page' | 'Column') ?? 'Page',
  } as JrElement
}

function parseBand(bandNode: RawNode | undefined, reportFont: JrFont): JrBand | undefined {
  if (!bandNode) return undefined
  const a = attrs(bandNode)
  return {
    height: num(a.height, 0),
    splitType: (a.splitType as JrBand['splitType']) ?? 'Stretch',
    printWhenExpression: childText(bandNode, 'printWhenExpression'),
    elements: elementsFromBand(bandNode, reportFont),
  }
}

export function normalize(raw: RawNode): JrReport {
  const root = (raw.jasperReport ?? raw) as RawNode
  const a = attrs(root)

  const reportFont: JrFont = {
    ...DEFAULT_FONT,
    name: (a.fontName as string) ?? DEFAULT_FONT.name,
    size: num(a.fontSize, DEFAULT_FONT.size),
  }

  const parameters: JrParameter[] = arr<RawNode>(root.parameter as RawNode | RawNode[] | undefined).map(p => ({
    name: String(attrs(p).name ?? ''),
    class: String(attrs(p).class ?? 'java.lang.String'),
    defaultExpression: childText(p, 'defaultValueExpression'),
  }))

  const fields: JrField[] = arr<RawNode>(root.field as RawNode | RawNode[] | undefined).map(f => ({
    name: String(attrs(f).name ?? ''),
    class: String(attrs(f).class ?? 'java.lang.String'),
  }))

  const variables: JrVariable[] = arr<RawNode>(root.variable as RawNode | RawNode[] | undefined).map(v => ({
    name: String(attrs(v).name ?? ''),
    class: String(attrs(v).class ?? 'java.lang.String'),
    calculation: (attrs(v).calculation as JrVariable['calculation']) ?? 'Nothing',
    resetType: (attrs(v).resetType as JrVariable['resetType']) ?? 'Report',
    resetGroup: attrs(v).resetGroup as string | undefined,
    incrementType: attrs(v).incrementType as JrVariable['incrementType'],
    initialValueExpression: childText(v, 'initialValueExpression'),
    variableExpression: childText(v, 'variableExpression'),
  }))

  const groups: JrGroup[] = arr<RawNode>(root.group as RawNode | RawNode[] | undefined).map(g => {
    const ga = attrs(g)
    return {
      name: String(ga.name ?? ''),
      expression: childText(g, 'groupExpression') ?? '',
      isStartNewPage: bool(ga.isStartNewPage, false),
      isReprintHeaderOnEachPage: bool(ga.isReprintHeaderOnEachPage, false),
      keepTogether: bool(ga.keepTogether, false),
      groupHeader: parseBand(child<RawNode>(child<RawNode>(g, 'groupHeader'), 'band'), reportFont),
      groupFooter: parseBand(child<RawNode>(child<RawNode>(g, 'groupFooter'), 'band'), reportFont),
    }
  })

  const detail = child<RawNode>(root, 'detail')
  const detailBands = arr<RawNode>(detail?.band as RawNode | RawNode[] | undefined)
    .map(b => parseBand(b, reportFont))
    .filter((b): b is JrBand => !!b)

  const bandFromSection = (section: string) => parseBand(child<RawNode>(child<RawNode>(root, section), 'band'), reportFont)

  return {
    name: (a.name as string) ?? 'report',
    pageWidth: num(a.pageWidth, 595),
    pageHeight: num(a.pageHeight, 842),
    margins: {
      top: num(a.topMargin, 20),
      bottom: num(a.bottomMargin, 20),
      left: num(a.leftMargin, 20),
      right: num(a.rightMargin, 20),
    },
    columnWidth: num(a.columnWidth, num(a.pageWidth, 595) - num(a.leftMargin, 20) - num(a.rightMargin, 20)),
    columnSpacing: num(a.columnSpacing, 0),
    columnCount: num(a.columnCount, 1),
    orientation: (a.orientation as 'Portrait' | 'Landscape') ?? 'Portrait',
    parameters,
    fields,
    variables,
    groups,
    bands: {
      background: bandFromSection('background'),
      title: bandFromSection('title'),
      pageHeader: bandFromSection('pageHeader'),
      columnHeader: bandFromSection('columnHeader'),
      detail: detailBands,
      columnFooter: bandFromSection('columnFooter'),
      pageFooter: bandFromSection('pageFooter'),
      lastPageFooter: bandFromSection('lastPageFooter'),
      summary: bandFromSection('summary'),
      noData: bandFromSection('noData'),
    },
  }
}
