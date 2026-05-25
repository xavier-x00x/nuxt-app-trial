import type { JrGroup, JrReport } from './types'
import { evalExpression } from './expr/evaluator'
import type { LayoutContext } from './layout/band'

export interface GroupState {
  values: Record<string, unknown>
  rowCounts: Record<string, number>
  rowIndices: Record<string, number[]>
}

export function createGroupState(groups: JrGroup[]): GroupState {
  const values: Record<string, unknown> = {}
  const rowCounts: Record<string, number> = {}
  const rowIndices: Record<string, number[]> = {}
  for (const g of groups) {
    values[g.name] = undefined
    rowCounts[g.name] = 0
    rowIndices[g.name] = []
  }
  return { values, rowCounts, rowIndices }
}

export function detectBreaks(
  groups: JrGroup[],
  row: Record<string, unknown>,
  state: GroupState,
  parameters: Record<string, unknown>,
): { broken: JrGroup[]; newValues: Record<string, unknown> } {
  const newValues: Record<string, unknown> = {}
  for (const g of groups) {
    const ctx: LayoutContext = { fields: row, params: parameters, variables: {} }
    try {
      newValues[g.name] = evalExpression(g.expression, ctx)
    } catch {
      newValues[g.name] = null
    }
  }

  const broken: JrGroup[] = []
  let cascade = false
  for (const g of groups) {
    const prev = state.values[g.name]
    const next = newValues[g.name]
    const isFirstRow = prev === undefined
    const valueChanged = !shallowEqual(prev, next)
    if (cascade || isFirstRow || valueChanged) {
      broken.push(g)
      cascade = true
    }
  }
  return { broken, newValues }
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return false
}

export function flushAllGroups(groups: JrGroup[], state: GroupState): JrGroup[] {
  const flushed: JrGroup[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i]
    if (!g) continue
    if (state.values[g.name] !== undefined) flushed.push(g)
  }
  return flushed
}

export function indexGroupsByName(report: JrReport): Map<string, JrGroup> {
  const m = new Map<string, JrGroup>()
  for (const g of report.groups) m.set(g.name, g)
  return m
}
