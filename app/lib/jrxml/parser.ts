import { XMLParser } from 'fast-xml-parser'
import { normalize } from './normalizer'
import type { JrReport } from './types'

export class JrxmlParseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(`JRXML parse error: ${message}`)
  }
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  trimValues: true,
  textNodeName: '#text',
  removeNSPrefix: false,
  allowBooleanAttributes: true,
  processEntities: true,
  isArray: () => false,
})

export function parseJrxml(xml: string): JrReport {
  if (!xml || !xml.trim()) throw new JrxmlParseError('empty input')
  let parsed: Record<string, unknown>
  try {
    parsed = xmlParser.parse(xml) as Record<string, unknown>
  } catch (e) {
    throw new JrxmlParseError(e instanceof Error ? e.message : 'XML invalid', e)
  }
  if (!parsed || !('jasperReport' in parsed)) {
    throw new JrxmlParseError('missing <jasperReport> root')
  }
  return normalize(parsed)
}
