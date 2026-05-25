export type JrAlignH = 'Left' | 'Center' | 'Right' | 'Justified'
export type JrAlignV = 'Top' | 'Middle' | 'Bottom'

export interface JrFont {
  name: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikeThrough?: boolean
}

export interface JrPen {
  lineWidth: number
  lineStyle: 'Solid' | 'Dashed' | 'Dotted'
  lineColor: string
}

export interface JrBox {
  pen?: JrPen
  topPen?: JrPen
  leftPen?: JrPen
  rightPen?: JrPen
  bottomPen?: JrPen
  padding?: { top: number; right: number; bottom: number; left: number }
}

export interface JrAlign {
  h: JrAlignH
  v: JrAlignV
}

export interface JrElementBase {
  kind: string
  x: number
  y: number
  width: number
  height: number
  printWhenExpression?: string
  stretchType?: 'NoStretch' | 'RelativeToTallestObject' | 'RelativeToBandHeight'
  positionType?: 'Float' | 'FixRelativeToTop' | 'FixRelativeToBottom'
  mode?: 'Opaque' | 'Transparent'
  backcolor?: string
  forecolor?: string
  key?: string
}

export interface JrStaticText extends JrElementBase {
  kind: 'staticText'
  text: string
  font: JrFont
  align: JrAlign
  box: JrBox
}

export interface JrTextField extends JrElementBase {
  kind: 'textField'
  expression: string
  pattern?: string
  isStretchWithOverflow: boolean
  isBlankWhenNull: boolean
  evaluationTime?: 'Now' | 'Report' | 'Page' | 'Column' | 'Group' | 'Band'
  font: JrFont
  align: JrAlign
  box: JrBox
}

export interface JrLine extends JrElementBase {
  kind: 'line'
  direction: 'TopDown' | 'BottomUp'
  pen: JrPen
}

export interface JrRectangle extends JrElementBase {
  kind: 'rectangle'
  radius?: number
  pen: JrPen
}

export interface JrImage extends JrElementBase {
  kind: 'image'
  expression: string
  scaleImage?: 'Clip' | 'FillFrame' | 'RetainShape' | 'RealHeight' | 'RealSize'
  hAlign?: JrAlignH
  vAlign?: JrAlignV
  box: JrBox
}

export interface JrFrame extends JrElementBase {
  kind: 'frame'
  children: JrElement[]
  box: JrBox
}

export interface JrBarcode extends JrElementBase {
  kind: 'barcode'
  codeExpression: string
  type: 'code128' | 'qrcode' | 'ean13' | 'code39'
}

export interface JrBreak extends JrElementBase {
  kind: 'break'
  type: 'Page' | 'Column'
}

export type JrElement =
  | JrStaticText
  | JrTextField
  | JrLine
  | JrRectangle
  | JrImage
  | JrFrame
  | JrBarcode
  | JrBreak

export interface JrParameter {
  name: string
  class: string
  defaultExpression?: string
}

export interface JrField {
  name: string
  class: string
}

export interface JrVariable {
  name: string
  class: string
  calculation: 'Nothing' | 'Count' | 'DistinctCount' | 'Sum' | 'Average' | 'Highest' | 'Lowest' | 'First' | 'StandardDeviation' | 'Variance'
  resetType: 'Report' | 'Page' | 'Column' | 'Group' | 'None'
  resetGroup?: string
  incrementType?: 'Report' | 'Page' | 'Column' | 'Group' | 'None'
  initialValueExpression?: string
  variableExpression?: string
}

export interface JrGroup {
  name: string
  expression: string
  isStartNewPage: boolean
  isReprintHeaderOnEachPage: boolean
  keepTogether: boolean
  groupHeader?: JrBand
  groupFooter?: JrBand
}

export interface JrBand {
  height: number
  splitType: 'Stretch' | 'Prevent' | 'Immediate'
  printWhenExpression?: string
  elements: JrElement[]
}

export interface JrBands {
  background?: JrBand
  title?: JrBand
  pageHeader?: JrBand
  columnHeader?: JrBand
  detail: JrBand[]
  columnFooter?: JrBand
  pageFooter?: JrBand
  lastPageFooter?: JrBand
  summary?: JrBand
  noData?: JrBand
}

export interface JrReport {
  name: string
  pageWidth: number
  pageHeight: number
  margins: { top: number; bottom: number; left: number; right: number }
  columnWidth: number
  columnSpacing: number
  columnCount: number
  orientation: 'Portrait' | 'Landscape'
  parameters: JrParameter[]
  fields: JrField[]
  variables: JrVariable[]
  groups: JrGroup[]
  bands: JrBands
}

export interface PositionedBox {
  kind: string
  x: number
  y: number
  width: number
  height: number
  payload: unknown
}

export interface TextPayload {
  text: string
  font: JrFont
  align: JrAlign
  box: JrBox
  forecolor?: string
  backcolor?: string
  mode?: 'Opaque' | 'Transparent'
  lines?: string[]
}

export interface LinePayload {
  pen: JrPen
  direction: 'TopDown' | 'BottomUp'
}

export interface RectPayload {
  pen: JrPen
  radius?: number
  backcolor?: string
  mode?: 'Opaque' | 'Transparent'
}

export interface ImagePayload {
  src: string
  scaleImage?: 'Clip' | 'FillFrame' | 'RetainShape' | 'RealHeight' | 'RealSize'
  hAlign?: JrAlignH
  vAlign?: JrAlignV
  box: JrBox
}

export interface BarcodePayload {
  code: string
  type: 'code128' | 'qrcode' | 'ean13' | 'code39'
}

export interface FramePayload {
  box: JrBox
  backcolor?: string
  mode?: 'Opaque' | 'Transparent'
  children: PositionedBox[]
}

export interface Bookmark {
  level: number
  label: string
  pageIndex: number
  y: number
}

export interface Page {
  index: number
  total: number
  width: number
  height: number
  boxes: PositionedBox[]
  bookmarks: Bookmark[]
}
