import { describe, it, expect } from 'vitest'
import { paginate } from '~/lib/jrxml/paginator'
import type { JrReport } from '~/lib/jrxml/types'

function minimalReport(): JrReport {
  return {
    name: 'test',
    pageWidth: 595, pageHeight: 842,
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
    columnWidth: 535, columnSpacing: 0, columnCount: 1,
    orientation: 'Portrait',
    parameters: [], fields: [], variables: [], groups: [],
    bands: {
      detail: [{
        height: 50,
        splitType: 'Stretch',
        elements: [],
      }],
    },
  }
}

describe('paginator', () => {
  it('returns at least 1 page for empty rows', () => {
    const pages = paginate({ report: minimalReport(), rows: [], parameters: {} })
    expect(pages.length).toBeGreaterThanOrEqual(1)
  })
  it('all pages have width/height matching report', () => {
    const pages = paginate({ report: minimalReport(), rows: [{}, {}, {}], parameters: {} })
    expect(pages.every(p => p.width === 595 && p.height === 842)).toBe(true)
  })
  it('page index increments correctly', () => {
    const r = minimalReport()
    const rows = Array.from({ length: 100 }, () => ({}))
    const pages = paginate({ report: r, rows, parameters: {} })
    pages.forEach((p, i) => expect(p.index).toBe(i + 1))
  })
  it('handles title band', () => {
    const r = minimalReport()
    r.bands.title = { height: 100, splitType: 'Stretch', elements: [] }
    const pages = paginate({ report: r, rows: [], parameters: {} })
    expect(pages[0].index).toBe(1)
  })
  it('handles summary band', () => {
    const r = minimalReport()
    r.bands.summary = { height: 80, splitType: 'Stretch', elements: [] }
    const pages = paginate({ report: r, rows: [], parameters: {} })
    expect(pages[pages.length - 1].index).toBeGreaterThan(0)
  })
  it('handles pageHeader and pageFooter', () => {
    const r = minimalReport()
    r.bands.pageHeader = { height: 40, splitType: 'Stretch', elements: [] }
    r.bands.pageFooter = { height: 30, splitType: 'Stretch', elements: [] }
    const pages = paginate({ report: r, rows: [{}, {}, {}], parameters: {} })
    expect(pages.length).toBe(1)
    expect(pages[0].boxes.length).toBe(0)
  })
  it('generates multiple pages when rows exceed page height', () => {
    const r = minimalReport()
    const rows = Array.from({ length: 50 }, () => ({}))
    const pages = paginate({ report: r, rows, parameters: {} })
    expect(pages.length).toBeGreaterThan(1)
  })
  it('each page has boxes array', () => {
    const pages = paginate({ report: minimalReport(), rows: [{}, {}], parameters: {} })
    pages.forEach(p => expect(Array.isArray(p.boxes)).toBe(true))
  })
  it('handles columnHeader and columnFooter', () => {
    const r = minimalReport()
    r.bands.columnHeader = { height: 30, splitType: 'Stretch', elements: [] }
    r.bands.columnFooter = { height: 20, splitType: 'Stretch', elements: [] }
    const pages = paginate({ report: r, rows: [{}, {}], parameters: {} })
    expect(pages.length).toBe(1)
  })
  it('sets page total correctly', () => {
    const pages = paginate({ report: minimalReport(), rows: Array.from({ length: 100 }, () => ({})), parameters: {} })
    pages.forEach(p => expect(p.total).toBe(pages.length))
  })
})
