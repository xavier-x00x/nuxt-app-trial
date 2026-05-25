import { describe, it, expect } from 'vitest'
import { evalExpression } from '~/lib/jrxml/expr/evaluator'

const ctx = (fields = {}, params = {}, variables = {}) => ({ fields, params, variables })

describe('expression evaluator', () => {
  it('evaluates number literal', () => {
    expect(evalExpression('42', ctx())).toBe(42)
  })
  it('evaluates string literal', () => {
    expect(evalExpression('"hello"', ctx())).toBe('hello')
  })
  it('resolves $F{name}', () => {
    expect(evalExpression('$F{name}', ctx({ name: 'Alice' }))).toBe('Alice')
  })
  it('resolves $P{title}', () => {
    expect(evalExpression('$P{title}', ctx({}, { title: 'Invoice' }))).toBe('Invoice')
  })
  it('resolves $V{count}', () => {
    expect(evalExpression('$V{count}', ctx({}, {}, { count: 5 }))).toBe(5)
  })
  it('handles string concatenation', () => {
    expect(evalExpression('"a" + "b"', ctx())).toBe('ab')
  })
  it('handles arithmetic', () => {
    expect(evalExpression('1 + 2 * 3', ctx())).toBe(7)
  })
  it('handles ternary', () => {
    expect(evalExpression('1 > 0 ? "yes" : "no"', ctx())).toBe('yes')
  })
  it('handles null field gracefully', () => {
    expect(() => evalExpression('$F{missing}', ctx())).not.toThrow()
  })
  it('handles parentheses precedence', () => {
    expect(evalExpression('(1 + 2) * 3', ctx())).toBe(9)
  })
})
