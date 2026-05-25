import { ref, computed, shallowRef, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { parseJrxml } from '~/lib/jrxml/parser'
import { evalExpression } from '~/lib/jrxml/expr/evaluator'
import { paginate } from '~/lib/jrxml/paginator'
import { exportPdfDocument } from '~/lib/jrxml/render/pdf'
import { exportExcelDocument } from '~/lib/jrxml/render/excel'
import { exportHtmlDocument } from '~/lib/jrxml/render/html'
import type { JrReport, Page } from '~/lib/jrxml/types'

export function useJrxmlReport() {
  const report = shallowRef<JrReport | null>(null)
  const rows = ref<Record<string, unknown>[]>([])
  const parameters = ref<Record<string, unknown>>({})
  const pages = shallowRef<Page[]>([])
  const currentPage = ref(1)
  const zoom = useStorage('jrxml-viewer-zoom', 1)
  const fontFactor = ref(1)
  const continuous = useStorage('jrxml-viewer-continuous', true)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const totalPages = computed(() => pages.value.length || 1)

  async function load(url: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const xml = await $fetch<string>(url, { responseType: 'text' as never })
      loadXml(typeof xml === 'string' ? xml : String(xml))
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  function loadXml(xml: string) {
    try {
      report.value = parseJrxml(xml)
      const defaults: Record<string, unknown> = {}
      for (const p of report.value.parameters) {
        if (p.defaultExpression) {
          try { defaults[p.name] = evalExpression(p.defaultExpression, { fields: {}, params: defaults, variables: {} }) } catch { /* ignore */ }
        }
      }
      parameters.value = { ...defaults, ...parameters.value }
      error.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      report.value = null
    }
  }

  function setData(data: Record<string, unknown>[]) {
    rows.value = data
  }

  function setParameters(params: Record<string, unknown>) {
    parameters.value = { ...parameters.value, ...params }
  }

  function render() {
    if (!report.value) { pages.value = []; return }
    pages.value = paginate({
      report: report.value,
      rows: rows.value,
      parameters: parameters.value,
    })
    currentPage.value = 1
  }

  async function print() {
    if (typeof window === 'undefined' || !report.value) return
    const r = report.value

    const styleId = 'jrxml-print-page-style'
    let style = document.getElementById(styleId) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }
    style.textContent = `@page { size: ${r.pageWidth}pt ${r.pageHeight}pt; margin: 0; }`

    const savedZoom = zoom.value
    const savedContinuous = continuous.value
    zoom.value = 1
    continuous.value = true

    await nextTick()

    const restore = () => {
      zoom.value = savedZoom
      continuous.value = savedContinuous
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)

    window.print()
  }

  function goto(n: number) {
    const clamped = Math.max(1, Math.min(n, totalPages.value))
    currentPage.value = clamped
  }
  function next() { goto(currentPage.value + 1) }
  function prev() { goto(currentPage.value - 1) }
  function first() { goto(1) }
  function last() { goto(totalPages.value) }
  function zoomIn() { zoom.value = Math.min(3, +(zoom.value + 0.1).toFixed(2)) }
  function zoomOut() { zoom.value = Math.max(0.25, +(zoom.value - 0.1).toFixed(2)) }

  function baseFilename(): string {
    return report.value?.name || 'report'
  }

  async function exportPdf(): Promise<void> {
    if (!report.value || !pages.value.length) return
    try {
      await exportPdfDocument({
        pages: pages.value,
        pageWidth: report.value.pageWidth,
        pageHeight: report.value.pageHeight,
        filename: `${baseFilename()}.pdf`,
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  async function exportExcel(): Promise<void> {
    if (!report.value) return
    try {
      await exportExcelDocument({
        report: report.value,
        rows: rows.value,
        parameters: parameters.value,
        filename: `${baseFilename()}.xlsx`,
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  async function exportHtml(): Promise<void> {
    if (!report.value || !pages.value.length) return
    try {
      await exportHtmlDocument({
        pages: pages.value,
        pageWidth: report.value.pageWidth,
        pageHeight: report.value.pageHeight,
        filename: `${baseFilename()}.html`,
        title: report.value.name,
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  return {
    report, rows, parameters, pages,
    currentPage, totalPages, zoom, fontFactor, continuous,
    error, loading,
    load, loadXml, setData, setParameters, render,
    print, exportPdf, exportExcel, exportHtml,
    goto, next, prev, first, last, zoomIn, zoomOut,
  }
}

export type JrxmlReport = ReturnType<typeof useJrxmlReport>
