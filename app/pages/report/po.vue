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
    await report.load('/jrxml/PO_Template.jrxml')
    const rows = await $fetch<Record<string, unknown>[]>('/jrxml/po_test_data.json')
    report.setData(rows)
    report.setParameters({
      COMPANY_NAME: 'PT. Contoh Perusahaan',
      PREPARED_BY: 'Admin',
    })
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
