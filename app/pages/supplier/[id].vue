<script setup lang="ts">
import { onMounted, watch, ref, computed } from 'vue'
import JrxmlViewer from '~/components/report/JrxmlViewer.vue'

const route = useRoute()
const { setFlash } = useFlash()

const id = computed(() => String(route.params.id))
const title = 'Supplier Detail'
useHead({ title })

interface Supplier {
  id: string
  code: string
  name: string
  email: string
  phone: string
  fax: string
  website: string
  address: string
  city: string
  province: string
  postal_code: string
  country: string
  tax_id: string
  payment_terms: number
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
  pic_name: string
  pic_phone: string
  pic_email: string
  is_active: boolean
  created_at: string
  updated_at: string
}
interface SupplierResponse { data: Supplier; message: string }

const report = useJrxmlReport()
const supplier = ref<Supplier | null>(null)

const { data: resp, error: fetchError } = await useApiFetch<SupplierResponse>(`/suppliers/${id.value}`)
if (fetchError.value || !resp.value) {
  setFlash('Data supplier tidak ditemukan', 'error')
  navigateTo('/supplier')
} else {
  supplier.value = resp.value.data
}

function buildRows(s: Supplier): Record<string, unknown>[] {
  const dash = (v: unknown) => (v == null || v === '' ? '-' : String(v))
  return [
    { label: 'Supplier Code', group: 'General', value: dash(s.code) },
    { label: 'Supplier Name', group: 'General', value: dash(s.name) },
    { label: 'Status', group: 'General', value: s.is_active ? 'Active' : 'Inactive' },

    { label: 'Email', group: 'Contact', value: dash(s.email) },
    { label: 'Phone', group: 'Contact', value: dash(s.phone) },
    { label: 'Fax', group: 'Contact', value: dash(s.fax) },
    { label: 'Website', group: 'Contact', value: dash(s.website) },

    { label: 'Address', group: 'Address', value: dash(s.address) },
    { label: 'City', group: 'Address', value: dash(s.city) },
    { label: 'Province', group: 'Address', value: dash(s.province) },
    { label: 'Postal Code', group: 'Address', value: dash(s.postal_code) },
    { label: 'Country', group: 'Address', value: dash(s.country) },

    { label: 'Tax ID (NPWP)', group: 'Tax & Payment', value: dash(s.tax_id) },
    { label: 'Payment Terms', group: 'Tax & Payment', value: s.payment_terms ? `${s.payment_terms} days` : '-' },

    { label: 'Bank Name', group: 'Banking', value: dash(s.bank_name) },
    { label: 'Account Number', group: 'Banking', value: dash(s.bank_account_number) },
    { label: 'Account Holder', group: 'Banking', value: dash(s.bank_account_holder) },

    { label: 'PIC Name', group: 'Person in Charge', value: dash(s.pic_name) },
    { label: 'PIC Phone', group: 'Person in Charge', value: dash(s.pic_phone) },
    { label: 'PIC Email', group: 'Person in Charge', value: dash(s.pic_email) },
  ]
}

function buildParameters(s: Supplier): Record<string, unknown> {
  return {
    supplierId: s.id.slice(0, 8),
    supplierCode: s.code,
    supplierName: s.name,
    createdAt: formatDate(s.created_at),
  }
}

onMounted(async () => {
  if (!supplier.value) return
  try {
    await report.load('/templates/supplier_report.jrxml')
    report.setData(buildRows(supplier.value))
    report.setParameters(buildParameters(supplier.value))
    report.render()
  } catch (e) {
    setFlash(e instanceof Error ? e.message : String(e), 'error')
  }
})

watch(report.error, (v) => {
  if (v) setFlash(v, 'error')
})

const downloadCSV = () => {
  if (!supplier.value) return
  const rows = buildRows(supplier.value)
  let csv = 'No,Field,Group,Value\n'
  rows.forEach((r, idx) => {
    csv += `"${idx + 1}","${r.label}","${r.group}","${r.value}"\n`
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Supplier_${supplier.value.code}_Report.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:truck-delivery">
      <ui-button-back to="/supplier" />
      <template #actions>
        <button class="btn btn-outline-secondary btn-sm" :disabled="!supplier" @click="downloadCSV">
          <Icon name="i-tabler:file-spreadsheet" class="me-1" />
          Export CSV
        </button>
      </template>
    </PageHeader>
    <PageBody>
      <div v-if="!supplier" class="text-center py-4">
        <div class="spinner-border text-primary" role="status" />
        <div class="mt-2">Loading Supplier Report...</div>
      </div>
      <ClientOnly v-else>
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
