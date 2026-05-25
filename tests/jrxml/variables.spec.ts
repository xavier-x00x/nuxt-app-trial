import { describe, it, expect } from 'vitest'
import { computeReportVariable } from '~/lib/jrxml/paginator'
import type { JrVariable } from '~/lib/jrxml/types'

const sumVar: JrVariable = {
  name: 'total',
  class: 'java.math.BigDecimal',
  calculation: 'Sum',
  resetType: 'Report',
  variableExpression: '$F{price}',
}

describe('variables', () => {
  it('sums numeric field', () => {
    const rows = [{ price: 10 }, { price: 20 }, { price: 30 }]
    expect(computeReportVariable(sumVar, rows, {})).toBe(60)
  })
  it('returns 0 for empty rows', () => {
    expect(computeReportVariable(sumVar, [], {})).toBe(0)
  })
  it('counts non-null values', () => {
    const countVar = { ...sumVar, calculation: 'Count' as const }
    const rows = [{ price: 10 }, { price: null }, { price: 30 }]
    expect(computeReportVariable(countVar, rows, {})).toBe(2)
  })
  it('finds highest', () => {
    const v = { ...sumVar, calculation: 'Highest' as const }
    expect(computeReportVariable(v, [{ price: 5 }, { price: 15 }, { price: 10 }], {})).toBe(15)
  })
  it('finds lowest', () => {
    const v = { ...sumVar, calculation: 'Lowest' as const }
    expect(computeReportVariable(v, [{ price: 5 }, { price: 15 }, { price: 10 }], {})).toBe(5)
  })
  it('averages numeric field', () => {
    const v = { ...sumVar, calculation: 'Average' as const }
    expect(computeReportVariable(v, [{ price: 10 }, { price: 20 }, { price: 30 }], {})).toBe(20)
  })
  it('returns first value', () => {
    const v = { ...sumVar, calculation: 'First' as const }
    expect(computeReportVariable(v, [{ price: 10 }, { price: 20 }], {})).toBe(10)
  })
  it('returns null for first on empty rows', () => {
    const v = { ...sumVar, calculation: 'First' as const }
    expect(computeReportVariable(v, [], {})).toBeNull()
  })
  it('handles DistinctCount', () => {
    const v = { ...sumVar, calculation: 'DistinctCount' as const }
    const rows = [{ price: 10 }, { price: 20 }, { price: 10 }, { price: 30 }]
    expect(computeReportVariable(v, rows, {})).toBe(3)
  })
  it('returns null for Nothing calculation', () => {
    const v = { ...sumVar, calculation: 'Nothing' as const }
    expect(computeReportVariable(v, [{ price: 10 }], {})).toBeNull()
  })
  it('returns null when no variableExpression', () => {
    const v = { ...sumVar, variableExpression: undefined }
    expect(computeReportVariable(v, [{ price: 10 }], {})).toBeNull()
  })
})
