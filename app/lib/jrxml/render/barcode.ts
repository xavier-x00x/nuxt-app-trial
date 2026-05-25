import type { BarcodePayload } from '../types'

type BwipOpts = {
  bcid: string
  text: string
  scale?: number
  height?: number
  width?: number
  includetext?: boolean
}

const cache = new Map<string, string>()

function mapType(type: BarcodePayload['type']): string {
  switch (type) {
    case 'qrcode': return 'qrcode'
    case 'ean13': return 'ean13'
    case 'code39': return 'code39'
    case 'code128':
    default: return 'code128'
  }
}

export async function renderBarcodeDataUrl(
  payload: BarcodePayload,
  pxWidth: number,
  pxHeight: number,
): Promise<string> {
  if (!payload.code) return ''
  const key = `${payload.type}::${payload.code}::${pxWidth}x${pxHeight}`
  const cached = cache.get(key)
  if (cached) return cached

  if (typeof document === 'undefined') return ''

  let bwipjs: { toCanvas: (canvas: HTMLCanvasElement, opts: BwipOpts) => void }
  try {
    bwipjs = (await import('bwip-js')).default ?? (await import('bwip-js'))
  } catch {
    return ''
  }

  const canvas = document.createElement('canvas')
  const isQr = payload.type === 'qrcode'
  const scale = Math.max(2, Math.floor(Math.min(pxWidth, pxHeight) / (isQr ? 32 : 100)))

  try {
    bwipjs.toCanvas(canvas, {
      bcid: mapType(payload.type),
      text: payload.code,
      scale,
      height: isQr ? Math.max(8, pxHeight / 4) : Math.max(8, pxHeight / scale),
      width: isQr ? Math.max(8, pxWidth / 4) : undefined,
      includetext: !isQr && payload.type !== 'qrcode',
    })
  } catch {
    return ''
  }

  const url = canvas.toDataURL('image/png')
  cache.set(key, url)
  return url
}
