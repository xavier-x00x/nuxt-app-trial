<template>
  <ClientOnly>
    <JrxmlViewer :report="report" class="jrxml-fullscreen-viewer" />
    <template #fallback>
      <div class="d-flex justify-content-center align-items-center vh-100 text-muted">
        <span class="spinner-border spinner-border-sm me-2" /> Memuat report…
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import JrxmlViewer from '~/components/report/JrxmlViewer.vue'

definePageMeta({ layout: 'report' })

const report = useJrxmlReport()

onMounted(async () => {
  try {
    const xml = await $fetch<string>('/jrxml/grouped-invoice.jrxml', { responseType: 'text' as never })
    const data = await $fetch<{ parameters: Record<string, unknown>; rows: Record<string, unknown>[] }>('/jrxml/grouped-invoice-data.json')
    report.loadXml(xml)
    report.setData(data.rows)
    report.setParameters(data.parameters)
    report.render()
  } catch (e) {
    report.error.value = e instanceof Error ? e.message : String(e)
  }
})
</script>

<style scoped>
.jrxml-fullscreen-viewer {
  height: 100vh;
}
</style>
