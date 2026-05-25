export function formatNumber(value: unknown, pattern: string): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return ''

  const negative = num < 0
  const abs = Math.abs(num)

  const semi = pattern.split(';')
  const posPattern = semi[0] || '#,##0'
  const negPattern = semi[1]

  const result = applyNumberPattern(abs, posPattern)

  if (negative) {
    if (negPattern) return applyNumberPattern(abs, negPattern).replace(/^-?/, '-')
    return '-' + result
  }
  return result
}

function applyNumberPattern(abs: number, pattern: string): string {
  const dotIdx = pattern.indexOf('.')
  const intPart = dotIdx >= 0 ? pattern.slice(0, dotIdx) : pattern
  const fracPart = dotIdx >= 0 ? pattern.slice(dotIdx + 1) : ''

  const fracMax = (fracPart.match(/[0#]/g) || []).length
  const fracMin = (fracPart.match(/0/g) || []).length
  const intMin = (intPart.match(/0/g) || []).length
  const hasGrouping = intPart.includes(',')

  const rounded = Number(abs.toFixed(fracMax))
  const [intStr, fracStr = ''] = rounded.toFixed(fracMax).split('.')

  let intOut = intStr!.padStart(intMin, '0')
  if (hasGrouping) intOut = intOut.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  let fracOut = fracStr
  while (fracOut.length > fracMin && fracOut.endsWith('0')) fracOut = fracOut.slice(0, -1)

  const prefix = intPart.replace(/[#0,]/g, '')
  const suffix = fracPart.replace(/[#0]/g, '')

  return prefix + intOut + (fracOut ? '.' + fracOut + suffix : (fracMin > 0 ? '.' + '0'.repeat(fracMin) : ''))
}

export function formatDate(value: unknown, pattern: string): string {
  const date = value instanceof Date ? value : new Date(value as string | number)
  if (isNaN(date.getTime())) return ''

  return pattern
    .replace(/yyyy/g, String(date.getFullYear()))
    .replace(/yy/g, String(date.getFullYear()).slice(-2))
    .replace(/MMMM/g, date.toLocaleString('en-US', { month: 'long' }))
    .replace(/MMM/g, date.toLocaleString('en-US', { month: 'short' }))
    .replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'))
    .replace(/dd/g, String(date.getDate()).padStart(2, '0'))
    .replace(/HH/g, String(date.getHours()).padStart(2, '0'))
    .replace(/hh/g, String(((date.getHours() + 11) % 12) + 1).padStart(2, '0'))
    .replace(/mm/g, String(date.getMinutes()).padStart(2, '0'))
    .replace(/ss/g, String(date.getSeconds()).padStart(2, '0'))
    .replace(/a/g, date.getHours() < 12 ? 'AM' : 'PM')
}

export function isDatePattern(pattern: string): boolean {
  return /[yMdHhms]/.test(pattern)
}

export function applyPattern(value: unknown, pattern: string | undefined): string {
  if (pattern == null || pattern === '') {
    if (value == null) return ''
    if (value instanceof Date) return value.toISOString()
    return String(value)
  }
  if (isDatePattern(pattern)) return formatDate(value, pattern)
  return formatNumber(value, pattern)
}
