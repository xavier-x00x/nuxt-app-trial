const JAVA_FONT_MAP: Record<string, string> = {
  SansSerif: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  Serif: '"Times New Roman", Times, serif',
  Monospaced: '"Courier New", Courier, monospace',
  Dialog: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  DialogInput: '"Courier New", Courier, monospace',
}

export function mapFontFamily(name: string | undefined): string {
  if (!name) return JAVA_FONT_MAP.SansSerif
  return JAVA_FONT_MAP[name] ?? `"${name}", sans-serif`
}

export function parseColor(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.startsWith('#')) return value
  const m = value.match(/^rgba?\(([^)]+)\)$/i)
  if (m) return value
  return `#${value.replace(/^#/, '')}`
}

export function toCssPx(units: number): string {
  return `${units}px`
}

export function pxToPt(px: number): number {
  return px * (72 / 96)
}
