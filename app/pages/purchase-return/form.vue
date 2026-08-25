<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchaseInvoiceDetail } from "~/types/purchase-invoice";

const router = useRouter();
const title = "Buat Retur Pembelian";
useHead({ title });

const formRef = ref<HTMLFormElement>();
const { loading, submitForm } = useForm2();

const selectedInvoice = ref<any>(null);
const invoiceIdText = ref("");
const invoiceLoading = ref(false);

const form = ref({
  purchase_invoice_id: "",
  return_date: new Date().toISOString().split("T")[0],
  notes: "",
  items: [] as Array<{
    purchase_invoice_item_id: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    uom_id: string;
    uom_name: string;
    max_qty: number;
    qty_return: number;
    unit_price: number;
    discount_amount: number;
    tax_pct: number;
    selected: boolean;
  }>,
});

watch(selectedInvoice, async (newInv) => {
  if (!newInv?.id) return;
  form.value.purchase_invoice_id = newInv.id;
  invoiceLoading.value = true;
  try {
    const res = await useApi<{ data: PurchaseInvoiceDetail }>(`/purchasing/purchase-invoices/${newInv.id}`);
    if (res.data?.data) {
      const inv = res.data.data;
      form.value.items = (inv.items || []).map((it) => ({
        purchase_invoice_item_id: it.id || "",
        product_id: it.product_id,
        product_name: it.product_name || "",
        product_sku: it.product_sku || "",
        uom_id: it.uom_id,
        uom_name: it.uom_name || "",
        max_qty: Number(it.qty_invoiced) || 1,
        qty_return: 1,
        unit_price: Number(it.unit_price) || 0,
        discount_amount: Number(it.discount_amount || 0),
        tax_pct: Number(it.tax_pct || 0),
        selected: true,
      }));
    }
  } catch (err) {
    console.error("Failed to load invoice items:", err);
  } finally {
    invoiceLoading.value = false;
  }
});

const calculateTotalReturn = computed(() => {
  return form.value.items
    .filter((it) => it.selected && it.qty_return > 0)
    .reduce((sum, it) => sum + (Number(it.qty_return) * Number(it.unit_price) - Number(it.discount_amount || 0)), 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const onSubmit = async () => {
  if (!form.value.purchase_invoice_id) {
    alert("Silakan pilih Faktur Pembelian terlebih dahulu.");
    return;
  }

  const selectedItems = form.value.items
    .filter((it) => it.selected && Number(it.qty_return) > 0)
    .map((it) => ({
      purchase_invoice_item_id: it.purchase_invoice_item_id,
      product_id: it.product_id,
      uom_id: it.uom_id,
      qty_return: Number(it.qty_return),
      unit_price: Number(it.unit_price),
      discount_amount: Number(it.discount_amount || 0),
      tax_pct: Number(it.tax_pct || 0),
    }));

  if (selectedItems.length === 0) {
    alert("Silakan tentukan minimal 1 barang yang akan diretur.");
    return;
  }

  const payload = {
    purchase_invoice_id: form.value.purchase_invoice_id,
    return_date: form.value.return_date,
    notes: form.value.notes || null,
    items: selectedItems,
  };

  const res = await submitForm("/purchasing/purchase-returns", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/purchase-return");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:arrow-back-up">
      <ui-button-back to="/purchase-return" />
      <ui-button-save :loading="loading" :disabled="calculateTotalReturn === 0" :form="formRef" @save="formRef?.requestSubmit()" />
    </PageHeader>

    <PageBody>
      <form ref="formRef" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            <!-- Header Section -->
            <div class="row align-items-stretch mb-4">
              <div class="col-md-6">
                <div class="p-3 border rounded-1 bg-body-secondary h-100">
                  <label class="form-label fw-bold mb-2">Pilih Faktur Pembelian Asal <span class="text-danger">*</span></label>
                  <SelectSearch5
                    v-model="selectedInvoice"
                    v-model:display-value="invoiceIdText"
                    api-url="/purchasing/purchase-invoices/pagination"
                    label-key="invoice_number"
                    value-key="id"
                    placeholder="Pilih nomor faktur..."
                    :clearable="true"
                  />

                  <div class="mt-3">
                    <label class="form-label fw-bold mb-1 small">Tanggal Retur <span class="text-danger">*</span></label>
                    <ui-input2
                      v-model="form.return_date"
                      type="date"
                      :hide-label="true"
                      :required="true"
                    />
                  </div>
                </div>
              </div>

              <div class="col-md-6 d-flex flex-column">
                <div class="p-3 border rounded-1 bg-body-secondary flex-grow-1">
                  <ui-textarea
                    v-model="form.notes"
                    label="Alasan / Catatan Retur"
                    placeholder="Contoh: Barang rusak, expired, kemasan pecah..."
                  />

                  <!-- Summary Box -->
                  <div class="mt-3 p-2 border rounded-1 bg-body small d-flex align-items-center justify-content-between">
                    <span class="text-muted fw-semibold">Total Nilai Retur:</span>
                    <span class="fw-bold fs-3 text-danger">{{ formatCurrency(calculateTotalReturn) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Section (Table Grid) -->
            <label class="fw-semibold mb-3">Daftar Barang Faktur yang Diretur ({{ form.items.length }})</label>

            <div class="table-responsive border rounded-1 mb-3 bg-body shadow-sm" style="max-height: 380px; min-height: 220px; overflow-y: auto;">
              <table class="table table-hover align-middle mb-0 table-compact">
                <thead class="sticky-top">
                  <tr>
                    <th style="width: 40px" class="text-center">Pilih</th>
                    <th>Nama Barang</th>
                    <th>Satuan</th>
                    <th class="text-end" style="width: 120px">Qty Faktur</th>
                    <th class="text-end" style="width: 160px">Qty Retur</th>
                    <th class="text-end">Harga Satuan</th>
                    <th class="text-end">Total Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="form.items.length === 0">
                    <td colspan="7" class="text-center py-4 text-muted">
                      Pilih Faktur Pembelian di atas untuk memuat daftar barang.
                    </td>
                  </tr>
                  <tr v-for="(it, idx) in form.items" :key="it.purchase_invoice_item_id || idx">
                    <td class="text-center">
                      <input v-model="it.selected" type="checkbox" class="form-check-input" />
                    </td>
                    <td>
                      <div class="fw-medium text-primary">{{ it.product_name }}</div>
                      <div class="text-muted small">{{ it.product_sku }}</div>
                    </td>
                    <td>{{ it.uom_name }}</td>
                    <td class="text-end text-muted">{{ it.max_qty }}</td>
                    <td>
                      <input
                        v-model.number="it.qty_return"
                        type="number"
                        step="any"
                        min="0.001"
                        :max="it.max_qty"
                        :disabled="!it.selected"
                        class="form-control rounded-1 text-end fw-bold text-danger"
                      />
                    </td>
                    <td class="text-end">{{ formatCurrency(it.unit_price) }}</td>
                    <td class="text-end fw-bold text-danger">
                      {{ formatCurrency((Number(it.qty_return) * Number(it.unit_price)) - Number(it.discount_amount || 0)) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-body-tertiary fw-bold fs-3">
                    <td colspan="6" class="text-end">Total Nilai Retur:</td>
                    <td class="text-end text-danger">{{ formatCurrency(calculateTotalReturn) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>

<style scoped>
.table-compact > :not(caption) > * > * {
  padding: 0.35rem 0.5rem !important;
}
.table-responsive thead.sticky-top th {
  background-color: var(--tblr-bg-surface, #182433) !important;
  z-index: 2;
}
</style>
