<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { PurchaseOrderDetail } from '~/types/purchase-order'
import JrxmlViewer from '~/components/report/JrxmlViewer.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const title = ref("Cetak Purchase Order")
useHead({ title })

const { formatDate } = useDateFormatter()
const { setFlash } = useFlash()
const report = useJrxmlReport()
const po = ref<PurchaseOrderDetail | null>(null)
const loading = ref(true)

function buildPORows(p: PurchaseOrderDetail): Record<string, unknown>[] {
  if (!p.items || p.items.length === 0) return []
  return p.items.map((it) => ({
    no: p.po_number,
    tanggal: formatDate(p.order_date,false), // format dd/mm/yyyy
    supplier: p.supplier_name,
    alamat: p.supplier_address || "-",
    telp: "-",
    email: "-",
    store: p.store_name,
    store_address: p.store_address || "-",
    expected_delivery: p.expected_delivery ? formatDate(p.expected_delivery, false) : "-",
    namaItem: it.product_name,
    qty: it.qty_ordered,
    harga: it.unit_price,
    total: it.subtotal || (it.qty_ordered * it.unit_price),
    sat: it.uom_name,
    subtotal: Number(p.total_amount) + Number(p.promo_marketing_discount_amount || 0),
    diskon: Number(p.promo_marketing_discount_amount || 0),
    ppn: 0,
    grandtotal: p.total_amount,
    paymentTerms: p.payment_term_days,
    paymentMode: p.payment_mode,
    approvedBy: p.approved_by_name || "",
    notes: p.notes || "-",
  }))
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await useApi<{ data: PurchaseOrderDetail }>(`/purchasing/purchase-orders/${id}`)
    if (res.data?.data) {
      po.value = res.data.data
      title.value = `Cetak PO #${po.value.po_number}`
      await report.load('/jrxml/PO_Template.jrxml')
      report.setData(buildPORows(po.value))
      report.setParameters({
        COMPANY_NAME: po.value.store_name || 'PT. Toko Kita',
        PREPARED_BY: po.value.created_by_name || 'Admin',
      })
      report.render()
    } else {
      setFlash('Data Purchase Order tidak ditemukan', 'error')
      router.push('/purchase-order')
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
      <ui-button-back :to="`/purchase-order/${id}`" />
    </PageHeader>
    <PageBody>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status" />
        <div class="mt-2">Memuat report Purchase Order...</div>
      </div>
      <ClientOnly v-else-if="po">
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
