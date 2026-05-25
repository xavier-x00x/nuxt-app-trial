export type TokenKind =
  | 'NUMBER' | 'STRING' | 'BOOL' | 'NULL'
  | 'IDENT' | 'FIELD' | 'PARAM' | 'VAR'
  | 'LPAREN' | 'RPAREN' | 'LBRACK' | 'RBRACK'
  | 'COMMA' | 'DOT' | 'QUESTION' | 'COLON'
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'PERCENT'
  | 'EQ' | 'NEQ' | 'LT' | 'GT' | 'LE' | 'GE'
  | 'AND' | 'OR' | 'NOT'
  | 'NEW' | 'EOF'

export interface Token {
  kind: TokenKind
  value: string
  pos: number
}

export class LexError extends Error {
  constructor(message: string, public pos: number) {
    super(`Lex error at ${pos}: ${message}`)
  }
}

const KEYWORDS: Record<string, TokenKind> = {
  true: 'BOOL',
  false: 'BOOL',
  null: 'NULL',
  new: 'NEW',
}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const n = src.length

  const push = (kind: TokenKind, value: string, pos: number) => {
    tokens.push({ kind, value, pos })
  }

  while (i < n) {
    const c = src[i]!
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++
      continue
    }

    if (c === '$' && i + 1 < n && (src[i + 1] === 'F' || src[i + 1] === 'P' || src[i + 1] === 'V') && src[i + 2] === '{') {
      const kind: TokenKind = src[i + 1] === 'F' ? 'FIELD' : src[i + 1] === 'P' ? 'PARAM' : 'VAR'
      const start = i
      i += 3
      let name = ''
      while (i < n && src[i] !== '}') name += src[i++]
      if (src[i] !== '}') throw new LexError(`unterminated ${kind} reference`, start)
      i++
      push(kind, name, start)
      continue
    }

    if (c === '"' || c === '\'') {
      const quote = c
      const start = i
      i++
      let str = ''
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\' && i + 1 < n) {
          const next = src[i + 1]!
          const map: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', '\'': '\'' }
          str += map[next] ?? next
          i += 2
        } else {
          str += src[i++]
        }
      }
      if (src[i] !== quote) throw new LexError('unterminated string', start)
      i++
      push('STRING', str, start)
      continue
    }

    if ((c >= '0' && c <= '9') || (c === '.' && i + 1 < n && src[i + 1]! >= '0' && src[i + 1]! <= '9')) {
      const start = i
      let num = ''
      while (i < n && (src[i]! >= '0' && src[i]! <= '9')) num += src[i++]
      if (src[i] === '.') {
        num += src[i++]
        while (i < n && (src[i]! >= '0' && src[i]! <= '9')) num += src[i++]
      }
      if (src[i] === 'e' || src[i] === 'E') {
        num += src[i++]
        if (src[i] === '+' || src[i] === '-') num += src[i++]
        while (i < n && (src[i]! >= '0' && src[i]! <= '9')) num += src[i++]
      }
      if (src[i] === 'L' || src[i] === 'l' || src[i] === 'f' || src[i] === 'F' || src[i] === 'd' || src[i] === 'D') i++
      push('NUMBER', num, start)
      continue
    }

    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
      const start = i
      let id = ''
      while (i < n && ((src[i]! >= 'a' && src[i]! <= 'z') || (src[i]! >= 'A' && src[i]! <= 'Z') || (src[i]! >= '0' && src[i]! <= '9') || src[i] === '_' || src[i] === '$')) {
        id += src[i++]
      }
      const kw = KEYWORDS[id]
      if (kw) push(kw, id, start)
      else push('IDENT', id, start)
      continue
    }

    const two = src.slice(i, i + 2)
    if (two === '==') { push('EQ', two, i); i += 2; continue }
    if (two === '!=') { push('NEQ', two, i); i += 2; continue }
    if (two === '<=') { push('LE', two, i); i += 2; continue }
    if (two === '>=') { push('GE', two, i); i += 2; continue }
    if (two === '&&') { push('AND', two, i); i += 2; continue }
    if (two === '||') { push('OR', two, i); i += 2; continue }

    switch (c) {
      case '(': push('LPAREN', c, i); i++; continue
      case ')': push('RPAREN', c, i); i++; continue
      case '[': push('LBRACK', c, i); i++; continue
      case ']': push('RBRACK', c, i); i++; continue
      case ',': push('COMMA', c, i); i++; continue
      case '.': push('DOT', c, i); i++; continue
      case '?': push('QUESTION', c, i); i++; continue
      case ':': push('COLON', c, i); i++; continue
      case '+': push('PLUS', c, i); i++; continue
      case '-': push('MINUS', c, i); i++; continue
      case '*': push('STAR', c, i); i++; continue
      case '/': push('SLASH', c, i); i++; continue
      case '%': push('PERCENT', c, i); i++; continue
      case '<': push('LT', c, i); i++; continue
      case '>': push('GT', c, i); i++; continue
      case '!': push('NOT', c, i); i++; continue
    }

    throw new LexError(`unexpected character '${c}'`, i)
  }

  push('EOF', '', i)
  return tokens
}
