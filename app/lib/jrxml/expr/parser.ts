import type { Token, TokenKind } from './lexer'
import { tokenize } from './lexer'

export type ExprNode =
  | { type: 'literal'; value: unknown }
  | { type: 'field'; name: string }
  | { type: 'param'; name: string }
  | { type: 'var'; name: string }
  | { type: 'ident'; name: string }
  | { type: 'unary'; op: '-' | '+' | '!'; arg: ExprNode }
  | { type: 'binary'; op: BinaryOp; left: ExprNode; right: ExprNode }
  | { type: 'ternary'; cond: ExprNode; then: ExprNode; else: ExprNode }
  | { type: 'member'; object: ExprNode; property: string }
  | { type: 'call'; callee: ExprNode; args: ExprNode[] }
  | { type: 'new'; className: string; args: ExprNode[] }

export type BinaryOp = '+' | '-' | '*' | '/' | '%' | '==' | '!=' | '<' | '>' | '<=' | '>=' | '&&' | '||'

export class ParseError extends Error {
  constructor(message: string, public token: Token) {
    super(`Parse error at ${token.pos} (${token.kind} "${token.value}"): ${message}`)
  }
}

class Parser {
  private i = 0
  constructor(private tokens: Token[]) {}

  private peek(offset = 0): Token { return this.tokens[this.i + offset]! }
  private advance(): Token { return this.tokens[this.i++]! }
  private match(...kinds: TokenKind[]): boolean {
    if (kinds.includes(this.peek().kind)) { this.advance(); return true }
    return false
  }
  private expect(kind: TokenKind): Token {
    const t = this.peek()
    if (t.kind !== kind) throw new ParseError(`expected ${kind}`, t)
    return this.advance()
  }

  parse(): ExprNode {
    const node = this.expression()
    if (this.peek().kind !== 'EOF') throw new ParseError('extra input', this.peek())
    return node
  }

  private expression(): ExprNode { return this.ternary() }

  private ternary(): ExprNode {
    const cond = this.logicalOr()
    if (this.match('QUESTION')) {
      const thenExpr = this.expression()
      this.expect('COLON')
      const elseExpr = this.expression()
      return { type: 'ternary', cond, then: thenExpr, else: elseExpr }
    }
    return cond
  }

  private logicalOr(): ExprNode {
    let left = this.logicalAnd()
    while (this.peek().kind === 'OR') {
      this.advance()
      const right = this.logicalAnd()
      left = { type: 'binary', op: '||', left, right }
    }
    return left
  }

  private logicalAnd(): ExprNode {
    let left = this.equality()
    while (this.peek().kind === 'AND') {
      this.advance()
      const right = this.equality()
      left = { type: 'binary', op: '&&', left, right }
    }
    return left
  }

  private equality(): ExprNode {
    let left = this.relational()
    while (this.peek().kind === 'EQ' || this.peek().kind === 'NEQ') {
      const op = this.advance().kind === 'EQ' ? '==' : '!='
      const right = this.relational()
      left = { type: 'binary', op: op as BinaryOp, left, right }
    }
    return left
  }

  private relational(): ExprNode {
    let left = this.additive()
    while (['LT', 'GT', 'LE', 'GE'].includes(this.peek().kind)) {
      const k = this.advance().kind
      const op: BinaryOp = k === 'LT' ? '<' : k === 'GT' ? '>' : k === 'LE' ? '<=' : '>='
      const right = this.additive()
      left = { type: 'binary', op, left, right }
    }
    return left
  }

  private additive(): ExprNode {
    let left = this.multiplicative()
    while (this.peek().kind === 'PLUS' || this.peek().kind === 'MINUS') {
      const op = this.advance().kind === 'PLUS' ? '+' : '-'
      const right = this.multiplicative()
      left = { type: 'binary', op: op as BinaryOp, left, right }
    }
    return left
  }

  private multiplicative(): ExprNode {
    let left = this.unary()
    while (['STAR', 'SLASH', 'PERCENT'].includes(this.peek().kind)) {
      const k = this.advance().kind
      const op: BinaryOp = k === 'STAR' ? '*' : k === 'SLASH' ? '/' : '%'
      const right = this.unary()
      left = { type: 'binary', op, left, right }
    }
    return left
  }

  private unary(): ExprNode {
    if (this.peek().kind === 'MINUS') { this.advance(); return { type: 'unary', op: '-', arg: this.unary() } }
    if (this.peek().kind === 'PLUS') { this.advance(); return { type: 'unary', op: '+', arg: this.unary() } }
    if (this.peek().kind === 'NOT') { this.advance(); return { type: 'unary', op: '!', arg: this.unary() } }
    return this.postfix()
  }

  private postfix(): ExprNode {
    let node = this.primary()
    while (true) {
      if (this.peek().kind === 'DOT') {
        this.advance()
        const name = this.expect('IDENT').value
        node = { type: 'member', object: node, property: name }
      } else if (this.peek().kind === 'LPAREN') {
        this.advance()
        const args: ExprNode[] = []
        if (this.peek().kind !== 'RPAREN') {
          args.push(this.expression())
          while (this.match('COMMA')) args.push(this.expression())
        }
        this.expect('RPAREN')
        node = { type: 'call', callee: node, args }
      } else {
        break
      }
    }
    return node
  }

  private primary(): ExprNode {
    const t = this.peek()
    switch (t.kind) {
      case 'NUMBER':
        this.advance()
        return { type: 'literal', value: Number(t.value) }
      case 'STRING':
        this.advance()
        return { type: 'literal', value: t.value }
      case 'BOOL':
        this.advance()
        return { type: 'literal', value: t.value === 'true' }
      case 'NULL':
        this.advance()
        return { type: 'literal', value: null }
      case 'FIELD':
        this.advance()
        return { type: 'field', name: t.value }
      case 'PARAM':
        this.advance()
        return { type: 'param', name: t.value }
      case 'VAR':
        this.advance()
        return { type: 'var', name: t.value }
      case 'IDENT': {
        this.advance()
        let node: ExprNode = { type: 'ident', name: t.value }
        while (this.peek().kind === 'DOT') {
          this.advance()
          const name = this.expect('IDENT').value
          node = { type: 'member', object: node, property: name }
        }
        return node
      }
      case 'LPAREN': {
        this.advance()
        const inner = this.expression()
        this.expect('RPAREN')
        return inner
      }
      case 'NEW': {
        this.advance()
        const className = this.parseQualifiedName()
        this.expect('LPAREN')
        const args: ExprNode[] = []
        if (this.peek().kind !== 'RPAREN') {
          args.push(this.expression())
          while (this.match('COMMA')) args.push(this.expression())
        }
        this.expect('RPAREN')
        return { type: 'new', className, args }
      }
      default:
        throw new ParseError('unexpected token', t)
    }
  }

  private parseQualifiedName(): string {
    let name = this.expect('IDENT').value
    while (this.peek().kind === 'DOT') {
      this.advance()
      name += '.' + this.expect('IDENT').value
    }
    return name
  }
}

export function parseExpr(src: string): ExprNode {
  return new Parser(tokenize(src)).parse()
}
