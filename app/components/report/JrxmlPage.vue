<template>
  <div class="jrxml-page-wrapper" :style="wrapperStyle">
    <div class="jrxml-page" :style="pageStyle">
      <JrxmlBox v-for="(box, i) in page.boxes" :key="i" :box="box" :font-factor="fontFactor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Page } from '~/lib/jrxml/types'
import JrxmlBox from './JrxmlBox.vue'

const PT_TO_PX = 96 / 72

const props = defineProps<{ page: Page; zoom?: number; fontFactor?: number }>()

const z = computed(() => (props.zoom ?? 1) * PT_TO_PX)

const wrapperStyle = computed(() => ({
  '--print-width': `${props.page.width}pt`,
  '--print-height': `${props.page.height}pt`,
  '--screen-width': `${Math.floor(props.page.width * z.value)}px`,
  '--screen-height': `${Math.floor(props.page.height * z.value)}px`,
  width: 'var(--screen-width)',
  height: 'var(--screen-height)',
}))

const pageStyle = computed(() => ({
  '--print-scale': PT_TO_PX,
  '--screen-scale': z.value,
  width: `${props.page.width}px`,
  height: `${props.page.height}px`,
  transform: 'scale(var(--screen-scale))',
  transformOrigin: 'top left',
}))
</script>

<style scoped>
.jrxml-page-wrapper {
  margin: 0 0 24px;
  position: relative;
  flex-shrink: 0;
}
.jrxml-page-wrapper:last-child {
  margin-bottom: 0;
}
.jrxml-page {
  position: absolute;
  top: 0;
  left: 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .35), 0 0 0 1px rgba(0, 0, 0, .2);
  overflow: hidden;
}

@media print {
  .jrxml-page-wrapper {
    margin: 0 !important;
    padding: 0 !important;
    width: var(--print-width) !important;
    height: var(--print-height) !important;
    max-width: none !important;
    max-height: none !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    overflow: hidden !important;
  }
  .jrxml-page {
    transform: scale(var(--print-scale)) !important;
    box-shadow: none !important;
  }
}
</style>
