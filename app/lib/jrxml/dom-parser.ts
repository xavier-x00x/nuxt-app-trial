type RawNode = Record<string, unknown>

const TEXT_KEY = '#text'

interface ChildAcc {
  [key: string]: unknown
}

function parseElement(el: Element): RawNode {
  const node: RawNode = {}
  for (const attr of Array.from(el.attributes)) {
    node[`@_${attr.name}`] = attr.value
  }

  const childAcc: ChildAcc = {}
  let textBuffer = ''

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 3 /* TEXT_NODE */ || child.nodeType === 4 /* CDATA_SECTION_NODE */) {
      textBuffer += child.nodeValue ?? ''
      continue
    }
    if (child.nodeType !== 1 /* ELEMENT_NODE */) continue
    const childEl = child as Element
    const name = childEl.tagName
    const parsedChild = parseElement(childEl)

    if (name in childAcc) {
      const existing = childAcc[name]
      if (Array.isArray(existing)) (existing as unknown[]).push(parsedChild)
      else childAcc[name] = [existing, parsedChild]
    } else {
      childAcc[name] = parsedChild
    }
  }

  for (const k of Object.keys(childAcc)) node[k] = childAcc[k]

  const trimmed = textBuffer.trim()
  if (trimmed) node[TEXT_KEY] = trimmed
  if (!trimmed && Object.keys(childAcc).length === 0 && Object.keys(node).length === el.attributes.length) {
    return node
  }

  return node
}

function toPlainString(node: Element): string | undefined {
  const text = node.textContent
  return text == null ? undefined : text.trim()
}

function flattenSimpleText(parsed: RawNode): RawNode {
  for (const key of Object.keys(parsed)) {
    const value = parsed[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as RawNode
      const keys = Object.keys(obj)
      if (keys.length === 1 && keys[0] === TEXT_KEY) {
        parsed[key] = obj[TEXT_KEY]
      } else {
        flattenSimpleText(obj)
      }
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (v && typeof v === 'object') flattenSimpleText(v as RawNode)
      }
    }
  }
  return parsed
}

export interface DomParseResult {
  jasperReport: RawNode
}

export function parseXmlString(xml: string): DomParseResult {
  if (typeof DOMParser === 'undefined') {
    throw new Error('DOMParser is not available in this environment')
  }
  const dom = new DOMParser().parseFromString(xml, 'application/xml')
  const errNode = dom.getElementsByTagName('parsererror')[0]
  if (errNode) {
    throw new Error(toPlainString(errNode) || 'XML parse error')
  }
  const root = dom.documentElement
  if (!root) throw new Error('XML has no root element')
  const parsed = parseElement(root)
  flattenSimpleText(parsed)
  return { [root.tagName]: parsed } as DomParseResult
}
