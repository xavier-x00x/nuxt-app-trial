<template>
  <div class="jrxml-viewer d-flex flex-column" :class="$attrs.class" @keydown="onKeyDown" tabindex="0">
    <component :is="'style'">{{ pageStyleTag }}</component>
    <!-- error alert moved to canvas panel below -->

    <header class="jrxml-toolbar d-flex align-items-center gap-2 px-3 py-2 border-bottom bg-body">
      <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('print')" :title="t('print')" @click="report.print()">
        <Icon name="tabler:printer" />
      </button>
      <div class="dropdown">
        <button class="btn btn-sm-custom dropdown-toggle d-flex align-items-center gap-1" data-bs-toggle="dropdown" type="button" :aria-label="t('save')" :title="t('save')">
          <Icon name="tabler:device-floppy" /> <span>{{ t('save') }}</span>
        </button>
        <div class="dropdown-menu">
          <button class="dropdown-item" type="button" @click="report.exportPdf()">PDF</button>
          <button class="dropdown-item" type="button" @click="report.exportExcel()">Excel</button>
          <button class="dropdown-item" type="button" @click="report.exportHtml()">HTML</button>
        </div>
      </div>
      <div class="dropdown">
        <button class="btn btn-sm-custom dropdown-toggle d-flex align-items-center gap-1" data-bs-toggle="dropdown" type="button" :aria-label="report.continuous.value ? t('continuous') : t('singlePage')" :title="report.continuous.value ? t('continuous') : t('singlePage')">
          <Icon :name="report.continuous.value ? 'tabler:layout-rows' : 'tabler:layout-list'" />
          <span>{{ report.continuous.value ? t('continuous') : t('singlePage') }}</span>
        </button>
        <div class="dropdown-menu">
          <button class="dropdown-item" type="button" @click="report.continuous.value = true">{{ t('continuous') }}</button>
          <button class="dropdown-item" type="button" @click="report.continuous.value = false">{{ t('singlePage') }}</button>
        </div>
      </div>

    </header>

    <div class="jrxml-canvas flex-fill" role="main" aria-label="Report content">
      <div v-if="report.loading.value" class="jrxml-skeleton-wrapper">
        <div class="jrxml-skeleton-page">
          <div class="skeleton-line skeleton-line-lg" style="width: 60%" />
          <div class="skeleton-line" style="width: 40%" />
          <div class="skeleton-spacer" />
          <div class="skeleton-line" style="width: 100%" v-for="i in 8" :key="i" />
        </div>
      </div>
      <div v-else-if="report.error.value" class="jrxml-error-panel">
        <div class="jrxml-error-card">
          <Icon name="tabler:alert-triangle" class="jrxml-error-icon" />
          <h4>Report Error</h4>
          <p class="jrxml-error-message">{{ report.error.value }}</p>
          <button class="btn btn-sm btn-outline-secondary" @click="report.error.value = null">
            Dismiss
          </button>
        </div>
      </div>
      <div v-else-if="visiblePages.length === 0" class="d-flex justify-content-center align-items-center h-100 text-muted">
        {{ t('noReport') }}
      </div>
      <div v-else class="jrxml-canvas-inner">
        <JrxmlPage
          v-for="page in visiblePages"
          :key="page.index"
          :page="page"
          :zoom="report.zoom.value"
          :font-factor="report.fontFactor.value"
        />
      </div>
    </div>

    <footer class="jrxml-footer d-flex align-items-center gap-2 px-3 py-1 border-top bg-body">
      <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('first')" :title="t('first')" :disabled="report.currentPage.value <= 1" @click="report.first()">
        <Icon name="tabler:chevrons-left" />
      </button>
      <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('prev')" :title="t('prev')" :disabled="report.currentPage.value <= 1" @click="report.prev()">
        <Icon name="tabler:chevron-left" />
      </button>
      <span class="small text-muted">{{ t('page') }}</span>
      <input
        type="number"
        class="form-control form-control-sm jrxml-page-input"
        :value="report.currentPage.value"
        min="1"
        :max="report.totalPages.value"
        @change="onPageInput"
      >
      <span class="small text-muted">{{ t('of') }} {{ report.totalPages.value }}</span>
      <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('next')" :title="t('next')" :disabled="report.currentPage.value >= report.totalPages.value" @click="report.next()">
        <Icon name="tabler:chevron-right" />
      </button>
      <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('last')" :title="t('last')" :disabled="report.currentPage.value >= report.totalPages.value" @click="report.last()">
        <Icon name="tabler:chevrons-right" />
      </button>

      <div class="ms-auto d-flex align-items-center gap-1">
        <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('zoomOut')" :title="t('zoomOut')" @click="report.zoomOut()">
          <Icon name="tabler:zoom-out" />
        </button>
        <span class="small text-muted jrxml-zoom-label">{{ Math.round(report.zoom.value * 100) }}%</span>
        <button class="btn btn-icon btn-sm-custom" type="button" :aria-label="t('zoomIn')" :title="t('zoomIn')" @click="report.zoomIn()">
          <Icon name="tabler:zoom-in" />
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import JrxmlPage from './JrxmlPage.vue'
import type { JrxmlReport } from '~/composables/useJrxmlReport'

const props = defineProps<{ report: JrxmlReport }>()
defineOptions({ inheritAttrs: false })

const visiblePages = computed(() => {
  const all = props.report.pages.value
  if (!all.length) return []
  if (props.report.continuous.value) return all
  const idx = Math.max(0, Math.min(props.report.currentPage.value - 1, all.length - 1))
  return [all[idx]!]
})

const pageStyleTag = computed(() => {
  const p = props.report.pages.value[0]
  if (!p) return ''
  return `@media print { @page { size: ${p.width}pt ${p.height}pt; margin: 0; } }`
})

function onPageInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (Number.isFinite(v)) props.report.goto(v)
}

const labels = {
  print: 'Print', save: 'Save',
  continuous: 'Continuous', singlePage: 'Single Page',
  loading: 'Loading…', noReport: 'No report',
  page: 'Page', of: 'of',
  first: 'First page', prev: 'Previous page', next: 'Next page', last: 'Last page',
  zoomOut: 'Zoom out', zoomIn: 'Zoom in',
}
function t(k: keyof typeof labels) { return labels[k] }

function onKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement) return
  switch (e.key) {
    case 'ArrowRight':
    case 'PageDown':
      e.preventDefault(); props.report.next(); break
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault(); props.report.prev(); break
    case 'Home':
      e.preventDefault(); props.report.first(); break
    case 'End':
      e.preventDefault(); props.report.last(); break
    case '+':
    case '=':
      if (e.ctrlKey) { e.preventDefault(); props.report.zoomIn() }
      break
    case '-':
      if (e.ctrlKey) { e.preventDefault(); props.report.zoomOut() }
      break
  }
}
</script>

<style scoped>
.jrxml-viewer {
  background: var(--tblr-bg-surface-secondary, #f8fafc);
  min-height: 0;
}
.jrxml-canvas {
  overflow: auto;
  background: #525659;
}
.jrxml-canvas-inner {
  padding: 24px;
  min-width: max-content;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.btn-sm-custom {
  --tblr-btn-padding-y: 0.3125rem;
  --tblr-btn-padding-x: 0.5rem;
  --tblr-btn-font-size: 0.75rem;
  --tblr-btn-border-radius: var(--tblr-border-radius-sm);
}
.jrxml-page-input {
  width: 56px;
  text-align: center;
}
.jrxml-zoom-label {
  min-width: 44px;
  text-align: center;
}

.jrxml-viewer:focus { outline: none; }
.jrxml-viewer .btn:focus-visible {
  outline: 2px solid var(--tblr-primary, #206bc4);
  outline-offset: 2px;
}

.jrxml-error-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 24px;
}
.jrxml-error-card {
  max-width: 480px;
  padding: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
  text-align: center;
}
.jrxml-error-icon {
  font-size: 48px;
  color: #d63939;
  margin-bottom: 16px;
}
.jrxml-error-message {
  color: #555;
  font-family: monospace;
  font-size: 12px;
  text-align: left;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 200px;
  overflow: auto;
}

.jrxml-skeleton-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px;
}
.jrxml-skeleton-page {
  width: 595px;
  min-height: 842px;
  background: #fff;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,.35);
}
.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  margin-bottom: 12px;
  border-radius: 4px;
  animation: skeleton-shimmer 1.5s infinite;
}
.skeleton-line-lg { height: 24px; }
.skeleton-spacer { height: 24px; }
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media print {
  @page {
    margin: 0;
  }
  body {
    margin: 0 !important;
  }
  .jrxml-viewer, .jrxml-viewer * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .jrxml-viewer { 
    display: block !important;
    background: #fff !important; 
  }
  .jrxml-toolbar,
  .jrxml-footer { display: none !important; }
  .jrxml-canvas {
    display: block !important;
    overflow: visible !important;
    background: #fff !important;
  }
  .jrxml-canvas-inner {
    margin: 0 !important;
    padding: 0 !important;
    min-width: 0 !important;
    display: block !important;
    align-items: initial !important;
  }
}
</style>

<style>
:root[data-bs-theme="dark"] .jrxml-canvas {
  background: #2b2c2e;
}
</style>
