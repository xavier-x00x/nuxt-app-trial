<template>
  <div v-if="box.kind === 'text'" class="jrxml-box jrxml-text" :style="textStyle">
    <div class="jrxml-text-inner" :style="innerStyle">
      <template v-for="(line, i) in lines" :key="i">
        <span>{{ line }}</span><br v-if="i < lines.length - 1">
      </template>
    </div>
  </div>

  <svg
    v-else-if="box.kind === 'line'"
    class="jrxml-box jrxml-line"
    :style="absStyle"
    :width="box.width || 1"
    :height="box.height || 1"
    :viewBox="`0 0 ${Math.max(1, box.width)} ${Math.max(1, box.height)}`"
    preserveAspectRatio="none"
  >
    <line
      v-bind="lineCoords"
      :stroke="(box.payload as LinePayload).pen.lineColor"
      :stroke-width="(box.payload as LinePayload).pen.lineWidth || 1"
      :stroke-dasharray="strokeDash((box.payload as LinePayload).pen.lineStyle)"
    />
  </svg>

  <svg
    v-else-if="box.kind === 'rect'"
    class="jrxml-box jrxml-rect"
    :style="absStyle"
    :width="box.width"
    :height="box.height"
    preserveAspectRatio="none"
  >
    <rect
      x="0"
      y="0"
      :width="box.width"
      :height="box.height"
      :rx="(box.payload as RectPayload).radius || 0"
      :fill="rectFill((box.payload as RectPayload))"
      :stroke="(box.payload as RectPayload).pen.lineColor"
      :stroke-width="(box.payload as RectPayload).pen.lineWidth || 0"
      :stroke-dasharray="strokeDash((box.payload as RectPayload).pen.lineStyle)"
    />
  </svg>

  <div
    v-else-if="box.kind === 'image'"
    class="jrxml-box jrxml-image"
    :style="imageWrapperStyle"
  >
    <img
      v-if="(box.payload as ImagePayload).src"
      :src="(box.payload as ImagePayload).src"
      :style="imageInnerStyle"
      alt=""
      @error="onImageError"
    >
  </div>

  <div v-else-if="box.kind === 'barcode'" class="jrxml-box jrxml-barcode" :style="absStyle">
    <img
      v-if="barcodeSrc"
      :src="barcodeSrc"
      :width="box.width"
      :height="box.height"
      alt=""
      style="display:block; width:100%; height:100%; object-fit: contain;"
    >
    <span v-else class="text-muted small">[{{ (box.payload as BarcodePayload).type }} {{ (box.payload as BarcodePayload).code }}]</span>
  </div>

  <div v-else-if="box.kind === 'frame'" class="jrxml-box jrxml-frame" :style="frameStyle">
    <JrxmlBox
      v-for="(child, i) in (box.payload as FramePayload).children"
      :key="i"
      :box="child"
      :font-factor="fontFactor"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PositionedBox, TextPayload, LinePayload, RectPayload, ImagePayload, BarcodePayload, FramePayload } from '~/lib/jrxml/types'
import { mapFontFamily } from '~/lib/jrxml/units'
import { renderBarcodeDataUrl } from '~/lib/jrxml/render/barcode'

defineOptions({ name: 'JrxmlBox' })

const props = defineProps<{ box: PositionedBox; fontFactor?: number }>()

const factor = computed(() => props.fontFactor ?? 1)

const absStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.box.x}px`,
  top: `${props.box.y}px`,
  width: `${props.box.width}px`,
  height: `${props.box.height}px`,
}))

const textPayload = computed(() => props.box.payload as TextPayload)

const lines = computed(() => {
  const p = textPayload.value
  if (p.lines && p.lines.length) return p.lines
  return [p.text]
})

const textStyle = computed(() => {
  const p = textPayload.value
  const isOpaque = p.mode === 'Opaque'
  const justify = p.align.v === 'Top' ? 'flex-start' : p.align.v === 'Bottom' ? 'flex-end' : 'center'
  const align = p.align.h === 'Right' ? 'flex-end' : p.align.h === 'Center' ? 'center' : 'flex-start'
  const padding = p.box?.padding
  const borderTop = pen(p.box?.topPen ?? p.box?.pen)
  const borderRight = pen(p.box?.rightPen ?? p.box?.pen)
  const borderBottom = pen(p.box?.bottomPen ?? p.box?.pen)
  const borderLeft = pen(p.box?.leftPen ?? p.box?.pen)

  return {
    ...absStyle.value,
    color: p.forecolor ?? '#000',
    backgroundColor: isOpaque ? (p.backcolor ?? '#fff') : 'transparent',
    paddingTop: padding ? `${padding.top}px` : '0',
    paddingRight: padding ? `${padding.right}px` : '2px',
    paddingBottom: padding ? `${padding.bottom}px` : '0',
    paddingLeft: padding ? `${padding.left}px` : '2px',
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    display: 'flex',
    justifyContent: align,
    alignItems: justify,
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
  }
})

const innerStyle = computed(() => {
  const p = textPayload.value
  const align = p.align.h === 'Right' ? 'right' : p.align.h === 'Center' ? 'center' : 'left'
  return {
    width: '100%',
    fontFamily: mapFontFamily(p.font.name),
    fontSize: `${p.font.size * factor.value}px`,
    fontWeight: p.font.bold ? '700' : '400',
    fontStyle: p.font.italic ? 'italic' : 'normal',
    textDecoration: p.font.underline ? 'underline' : p.font.strikeThrough ? 'line-through' : 'none',
    textAlign: align as 'left' | 'right' | 'center',
    lineHeight: 1.2,
    whiteSpace: 'pre-wrap' as const,
  }
})

const lineCoords = computed(() => {
  const p = props.box.payload as LinePayload
  if (p.direction === 'BottomUp') {
    return { x1: 0, y1: props.box.height, x2: props.box.width, y2: 0 }
  }
  if (props.box.height <= 1) {
    return { x1: 0, y1: 0, x2: props.box.width, y2: 0 }
  }
  if (props.box.width <= 1) {
    return { x1: 0, y1: 0, x2: 0, y2: props.box.height }
  }
  return { x1: 0, y1: 0, x2: props.box.width, y2: props.box.height }
})

const imagePayload = computed(() => props.box.payload as ImagePayload)

const imageWrapperStyle = computed(() => ({
  ...absStyle.value,
  display: 'flex',
  justifyContent: imagePayload.value.hAlign === 'Right' ? 'flex-end' : imagePayload.value.hAlign === 'Center' ? 'center' : 'flex-start',
  alignItems: imagePayload.value.vAlign === 'Bottom' ? 'flex-end' : imagePayload.value.vAlign === 'Middle' ? 'center' : 'flex-start',
  overflow: 'hidden',
}))

const imageInnerStyle = computed(() => {
  const scale = imagePayload.value.scaleImage ?? 'RetainShape'
  switch (scale) {
    case 'Clip':
      return { width: 'auto', height: 'auto', maxWidth: 'none', maxHeight: 'none' }
    case 'FillFrame':
      return { width: '100%', height: '100%', objectFit: 'fill' as const }
    case 'RealHeight':
    case 'RealSize':
      return { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }
    case 'RetainShape':
    default:
      return { maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' as const }
  }
})

function onImageError(e: Event) {
  const el = e.target as HTMLImageElement
  el.style.display = 'none'
}

const barcodeSrc = ref<string>('')
async function loadBarcode() {
  if (props.box.kind !== 'barcode') return
  const payload = props.box.payload as BarcodePayload
  if (!payload.code) { barcodeSrc.value = ''; return }
  barcodeSrc.value = await renderBarcodeDataUrl(payload, props.box.width, props.box.height)
}
watch(() => props.box, loadBarcode, { immediate: true })

const framePayload = computed(() => props.box.payload as FramePayload)

const frameStyle = computed(() => {
  const p = framePayload.value
  const isOpaque = p.mode === 'Opaque'
  const borderTop = pen(p.box?.topPen ?? p.box?.pen)
  const borderRight = pen(p.box?.rightPen ?? p.box?.pen)
  const borderBottom = pen(p.box?.bottomPen ?? p.box?.pen)
  const borderLeft = pen(p.box?.leftPen ?? p.box?.pen)
  return {
    ...absStyle.value,
    backgroundColor: isOpaque ? (p.backcolor ?? '#fff') : 'transparent',
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
  }
})

function strokeDash(style: 'Solid' | 'Dashed' | 'Dotted'): string | undefined {
  if (style === 'Dashed') return '4 3'
  if (style === 'Dotted') return '1 2'
  return undefined
}

function rectFill(p: RectPayload): string {
  if (p.mode === 'Opaque' && p.backcolor) return p.backcolor
  return 'transparent'
}

function pen(p: LinePayload['pen'] | undefined): string {
  if (!p || !p.lineWidth) return 'none'
  const style = p.lineStyle === 'Dashed' ? 'dashed' : p.lineStyle === 'Dotted' ? 'dotted' : 'solid'
  return `${p.lineWidth}px ${style} ${p.lineColor}`
}
</script>

<style scoped>
.jrxml-box {
  position: absolute;
  box-sizing: border-box;
}
.jrxml-text-inner span {
  display: inline;
}
.jrxml-frame {
  position: absolute;
}
</style>
