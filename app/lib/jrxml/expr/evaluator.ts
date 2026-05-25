import type { ExprNode } from './parser'
import { parseExpr } from './parser'
import { formatNumber, formatDate } from './format'

export interface EvalContext {
  fields: Record<string, unknown>
  params: Record<string, unknown>
  variables: Record<string, unknown>
}

export class ExprError extends Error {
  constructor(message: string) { super(`Expression error: ${message}`) }
}

interface FormatterStub {
  __formatter: 'date' | 'decimal'
  pattern: string
}

function isFormatter(value: unknown): value is FormatterStub {
  return !!value && typeof value === 'object' && '__formatter' in (value as Record<string, unknown>)
}

export function evaluate(node: ExprNode, ctx: EvalContext): unknown {
  switch (node.type) {
    case 'literal': return node.value
    case 'field': return ctx.fields[node.name]
    case 'param': return ctx.params[node.name]
    case 'var': return ctx.variables[node.name]
    case 'ident': {
      const map: Record<string, unknown> = { Math, String, Integer: { parseInt: (s: unknown) => parseInt(String(s), 10) }, Double: { parseDouble: (s: unknown) => parseFloat(String(s)) }, Long: { parseLong: (s: unknown) => parseInt(String(s), 10) } }
      if (node.name in map) return map[node.name]
      throw new ExprError(`unknown identifier "${node.name}"`)
    }
    case 'unary': {
      const v = evaluate(node.arg, ctx)
      switch (node.op) {
        case '-': return -Number(v)
        case '+': return +Number(v)
        case '!': return !v
      }
      return undefined
    }
    case 'binary': {
      if (node.op === '&&') {
        const l = evaluate(node.left, ctx)
        if (!l) return l
        return evaluate(node.right, ctx)
      }
      if (node.op === '||') {
        const l = evaluate(node.left, ctx)
        if (l) return l
        return evaluate(node.right, ctx)
      }
      const l = evaluate(node.left, ctx)
      const r = evaluate(node.right, ctx)
      switch (node.op) {
        case '+':
          if (typeof l === 'string' || typeof r === 'string') return String(l ?? '') + String(r ?? '')
          return Number(l) + Number(r)
        case '-': return Number(l) - Number(r)
        case '*': return Number(l) * Number(r)
        case '/': return Number(l) / Number(r)
        case '%': return Number(l) % Number(r)
        case '==': return l == r
        case '!=': return l != r
        case '<': return (l as number) < (r as number)
        case '>': return (l as number) > (r as number)
        case '<=': return (l as number) <= (r as number)
        case '>=': return (l as number) >= (r as number)
      }
      return undefined
    }
    case 'ternary':
      return evaluate(node.cond, ctx) ? evaluate(node.then, ctx) : evaluate(node.else, ctx)
    case 'member': {
      const obj = evaluate(node.object, ctx) as Record<string, unknown> | undefined | null
      if (obj == null) return undefined
      return obj[node.property]
    }
    case 'call': {
      const args = node.args.map(a => evaluate(a, ctx))
      if (node.callee.type === 'member') {
        const obj = evaluate(node.callee.object, ctx)
        if (isFormatter(obj)) {
          if (node.callee.property === 'format') {
            const value = args[0]
            return obj.__formatter === 'date' ? formatDate(value, obj.pattern) : formatNumber(value, obj.pattern)
          }
        }
        const target = obj as Record<string, unknown> | null | undefined
        if (target == null) throw new ExprError(`call on null/undefined`)
        const fn = target[node.callee.property]
        if (typeof fn !== 'function') throw new ExprError(`method "${node.callee.property}" not callable`)
        return (fn as (...a: unknown[]) => unknown).apply(target, args)
      }
      if (node.callee.type === 'ident') {
        const fn = evaluate(node.callee, ctx) as ((...a: unknown[]) => unknown) | unknown
        if (typeof fn !== 'function') throw new ExprError(`"${node.callee.name}" is not callable`)
        return (fn as (...a: unknown[]) => unknown)(...args)
      }
      throw new ExprError(`unsupported call`)
    }
    case 'new': {
      const args = node.args.map(a => evaluate(a, ctx))
      const cls = node.className
      if (cls === 'SimpleDateFormat' || cls === 'java.text.SimpleDateFormat') {
        return { __formatter: 'date', pattern: String(args[0] ?? '') } satisfies FormatterStub
      }
      if (cls === 'DecimalFormat' || cls === 'java.text.DecimalFormat') {
        return { __formatter: 'decimal', pattern: String(args[0] ?? '') } satisfies FormatterStub
      }
      if (cls === 'java.lang.String' || cls === 'String') {
        return String(args[0] ?? '')
      }
      throw new ExprError(`unsupported class "new ${cls}"`)
    }
  }
}

const cache = new Map<string, ExprNode>()

export function evalExpression(src: string, ctx: EvalContext): unknown {
  if (!src) return ''
  let ast = cache.get(src)
  if (!ast) {
    ast = parseExpr(src)
    cache.set(src, ast)
  }
  return evaluate(ast, ctx)
}
