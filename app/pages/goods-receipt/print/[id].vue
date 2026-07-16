<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { GoodsReceiptDetail } from '~/types/goods-receipt'
import JrxmlViewer from '~/components/report/JrxmlViewer.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const title = ref("Cetak Bukti Penerimaan Barang")
useHead({ title })

const { formatDate } = useDateFormatter()
const { setFlash } = useFlash()
const report = useJrxmlReport()
const gr = ref<GoodsReceiptDetail | null>(null)
const loading = ref(true)

function buildGRRows(g: GoodsReceiptDetail): Record<string, unknown>[] {
  if (!g.items || g.items.length === 0) return []
  return g.items.map((it) => ({
    no: g.gr_number,
    tanggal: formatDate(g.receipt_date, false),
    noPO: g.po_number,
    supplier: g.supplier_name,
    alamat: g.supplier_address || "-",
    store: g.store_name,
    store_address: "-", // or store_address if available in model
    deliveryNoteNo: g.delivery_note_no || "-",
    namaItem: it.product_name,
    qtyOrdered: Number(it.qty_ordered),
    qtyReceived: Number(it.qty_received),
    qtyRejected: Number(it.qty_rejected),
    sat: it.uom_code,
    notes: it.reject_reason || it.notes || g.notes || "-",
    approvedBy: g.confirmed_by_id ? (g.confirmed_by_id === g.received_by_id ? "Staf Gudang" : "Kepala Gudang") : "-",
  }))
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await useApi<{ data: GoodsReceiptDetail }>(`/goods-receipts/${id}`)
    if (res.data?.data) {
      gr.value = res.data.data
      title.value = `Cetak GR #${gr.value.gr_number}`
      await report.load('/jrxml/GR_Template.jrxml')
      report.setData(buildGRRows(gr.value))
      report.setParameters({
        COMPANY_NAME: gr.value.store_name || 'PT. Toko Kita',
        PREPARED_BY: 'Staf Gudang',
      })
      report.render()
    } else {
      setFlash('Data Penerimaan Barang tidak ditemukan', 'error')
      router.push('/goods-receipt')
    }
  } catch (e) {
    setFlash(e instanceof Error ? e.message : String(e), 'error')
  } finally {
    loading.value = false
  }
})

watch(report.error, (v) => {
  if (v) setFlash(v, 'error')
})
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:printer">
      <ui-button-back :to="`/goods-receipt/${id}`" />
    </PageHeader>
    <PageBody>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status" />
        <div class="mt-2">Memuat report Penerimaan Barang...</div>
      </div>
      <ClientOnly v-else-if="gr">
        <div class="report-viewer-wrapper shadow rounded overflow-hidden">
          <JrxmlViewer :report="report" />
        </div>
      </ClientOnly>
    </PageBody>
  </div>
</template>

<style scoped>
.report-viewer-wrapper {
  height: calc(100vh - 200px);
  min-height: 600px;
  display: flex;
}
.report-viewer-wrapper :deep(.jrxml-viewer) {
  flex: 1;
  min-height: 0;
}

@media print {
  .page-header,
  :deep(header.jrxml-toolbar),
  :deep(footer.jrxml-footer) {
    display: none !important;
  }
  .report-viewer-wrapper {
    display: block !important;
    height: auto !important;
    min-height: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
  }
  :deep(.page-body),
  :deep(.container-fluid),
  :deep(.row),
  :deep(.col-12),
  :deep(.card),
  :deep(.card-body) {
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }
}
</style>
