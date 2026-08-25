<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchaseOrderDetail } from "~/types/purchase-order";

const router = useRouter();
const title = "Buat Faktur Pembelian";
useHead({ title });

const { loading, submitForm, formatError } = useForm2();

const selectedPO = ref<any>(null);
const poLoading = ref(false);

const form = ref({
  supplier_invoice_number: "",
  reference_no: "",
  purchase_order_id: "",
  supplier_id: "",
  supplier_name: "",
  store_id: "",
  warehouse_id: "",
  invoice_date: new Date().toISOString().split("T")[0],
  received_date: new Date().toISOString().split("T")[0],
  payment_term_days: 30,
  payment_mode: "TRANSFER",
  discount_amount: 0,
  freight_amount: 0,
  other_cost_amount: 0,
  is_tax_inclusive: false,
  notes: "",
  items: [] as Array<{
    purchase_order_item_id: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    uom_id: string;
    uom_name: string;
    qty_invoiced: number;
    unit_price: number;
    discount_amount: number;
    tax_pct: number;
  }>,
});

watch(selectedPO, async (newPO) => {
  if (!newPO?.id) return;
  poLoading.value = true;
  try {
    const res = await useApi<{ data: PurchaseOrderDetail }>(`/purchasing/purchase-orders/${newPO.id}`);
    if (res.data?.data) {
      const po = res.data.data;
      form.value.purchase_order_id = po.id;
      form.value.supplier_id = po.supplier_id;
      form.value.supplier_name = po.supplier_name || "";
      form.value.store_id = po.store_id;
      form.value.warehouse_id = po.warehouse_id;
      form.value.payment_term_days = po.payment_term_days || 0;
      form.value.payment_mode = po.payment_mode || "TRANSFER";

      form.value.items = (po.items || []).map((item) => ({
        purchase_order_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        uom_id: item.uom_id,
        uom_name: item.uom_name,
        qty_invoiced: Number(item.qty_ordered) || 1,
        unit_price: Number(item.unit_price) || 0,
        discount_amount: 0,
        tax_pct: 11,
      }));
    }
  } catch (err) {
    console.error("Failed to load PO details:", err);
  } finally {
    poLoading.value = false;
  }
});

const calculateSubtotal = computed(() => {
  return form.value.items.reduce((sum, it) => {
    return sum + (Number(it.qty_invoiced) * Number(it.unit_price) - Number(it.discount_amount || 0));
  }, 0);
});

const calculateTax = computed(() => {
  return form.value.items.reduce((sum, it) => {
    const lineSubtotal = Number(it.qty_invoiced) * Number(it.unit_price) - Number(it.discount_amount || 0);
    return sum + (lineSubtotal * (Number(it.tax_pct || 0) / 100));
  }, 0);
});

const calculateTotal = computed(() => {
  return calculateSubtotal.value - Number(form.value.discount_amount || 0) + calculateTax.value + Number(form.value.freight_amount || 0) + Number(form.value.other_cost_amount || 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const onSubmit = async () => {
  if (!form.value.purchase_order_id) {
    alert("Silakan pilih Purchase Order terlebih dahulu.");
    return;
  }
  if (!form.value.supplier_invoice_number) {
    alert("Nomor faktur supplier wajib diisi.");
    return;
  }

  const payload = {
    ...form.value,
    discount_amount: Number(form.value.discount_amount),
    freight_amount: Number(form.value.freight_amount),
    other_cost_amount: Number(form.value.other_cost_amount),
    payment_term_days: Number(form.value.payment_term_days),
    items: form.value.items.map((it) => ({
      purchase_order_item_id: it.purchase_order_item_id,
      product_id: it.product_id,
      uom_id: it.uom_id,
      qty_invoiced: Number(it.qty_invoiced),
      unit_price: Number(it.unit_price),
      discount_amount: Number(it.discount_amount || 0),
      tax_pct: Number(it.tax_pct || 0),
    })),
  };

  const res = await submitForm("/purchasing/purchase-invoices", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/purchase-invoice");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:file-invoice">
      <ui-button-back to="/purchase-invoice" />
    </PageHeader>

    <PageBody>
      <form @submit.prevent="onSubmit">
        <div class="row g-3">
          <!-- Card Header Data -->
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Informasi Faktur & Referensi PO</h4>
              </div>
              <div class="card-body p-4">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label required">Pilih Purchase Order (PO)</label>
                    <SelectSearch5
                      v-model="selectedPO"
                      api-url="/purchasing/purchase-orders/pagination"
                      label-key="po_number"
                      value-key="id"
                      placeholder="Cari nomor PO..."
                    />
                    <div v-if="formatError('PO', 'purchase_order_id')" class="text-danger small mt-1">
                      {{ formatError('PO', 'purchase_order_id') }}
                    </div>
                  </div>

                  <div class="col-md-6">
                    <ui-input2
                      v-model="form.supplier_invoice_number"
                      label="No. Faktur Supplier"
                      placeholder="Contoh: INV-SUP-2026-001"
                      :required="true"
                      :error="formatError('No. Faktur Supplier', 'supplier_invoice_number')"
                    />
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.supplier_name"
                      label="Supplier"
                      :disabled="true"
                      placeholder="Terisi otomatis dari PO"
                    />
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.invoice_date"
                      type="date"
                      label="Tanggal Faktur"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.received_date"
                      type="date"
                      label="Tanggal Terima Fisik Faktur"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Metode Pembayaran</label>
                    <select v-model="form.payment_mode" class="form-select rounded-1">
                      <option value="TRANSFER">TRANSFER BANK</option>
                      <option value="CASH">CASH / TUNAI</option>
                      <option value="GIRO">GIRO / BILYET</option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.payment_term_days"
                      type="number"
                      label="Termin Hutang (Hari)"
                    />
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.reference_no"
                      label="No. Referensi Eksternal"
                      placeholder="Surat Jalan / Delivery Note No."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Items Table -->
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
                <h4 class="card-title mb-0">Rincian Barang Tagihan</h4>
                <div v-if="poLoading" class="text-muted small">
                  <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                  Memuat item PO...
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr class="text-muted small">
                      <th style="width: 40px;">#</th>
                      <th>Nama Barang</th>
                      <th style="width: 120px;" class="text-end">Qty Tagih</th>
                      <th style="width: 90px;">Satuan</th>
                      <th style="width: 150px;" class="text-end">Harga Satuan</th>
                      <th style="width: 130px;" class="text-end">Diskon (Rp)</th>
                      <th style="width: 100px;" class="text-end">PPN (%)</th>
                      <th style="width: 150px;" class="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.items.length === 0">
                      <td colspan="8" class="text-center py-4 text-muted">
                        Pilih Purchase Order untuk memuat daftar barang yang ditagih.
                      </td>
                    </tr>
                    <tr v-for="(item, idx) in form.items" :key="item.product_id || idx">
                      <td>{{ idx + 1 }}.</td>
                      <td>
                        <div class="fw-medium">{{ item.product_name }}</div>
                        <div class="text-muted small">{{ item.product_sku }}</div>
                      </td>
                      <td>
                        <input
                          v-model.number="item.qty_invoiced"
                          type="number"
                          step="any"
                          min="0.001"
                          class="form-control form-control-sm text-end"
                        />
                      </td>
                      <td>{{ item.uom_name }}</td>
                      <td>
                        <input
                          v-model.number="item.unit_price"
                          type="number"
                          step="any"
                          min="0"
                          class="form-control form-control-sm text-end"
                        />
                      </td>
                      <td>
                        <input
                          v-model.number="item.discount_amount"
                          type="number"
                          step="any"
                          min="0"
                          class="form-control form-control-sm text-end"
                        />
                      </td>
                      <td>
                        <input
                          v-model.number="item.tax_pct"
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          class="form-control form-control-sm text-end"
                        />
                      </td>
                      <td class="text-end fw-bold">
                        {{ formatCurrency((Number(item.qty_invoiced) * Number(item.unit_price)) - Number(item.discount_amount || 0)) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Footer Summary & Actions -->
              <div class="card-footer bg-transparent border-top p-4">
                <div class="row justify-content-end">
                  <div class="col-md-5">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted">Subtotal:</span>
                      <span class="fw-medium">{{ formatCurrency(calculateSubtotal) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted">Diskon Global (Rp):</span>
                      <input
                        v-model.number="form.discount_amount"
                        type="number"
                        min="0"
                        class="form-control form-control-sm w-50 text-end"
                      />
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted">Pajak (PPN):</span>
                      <span>{{ formatCurrency(calculateTax) }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="text-muted">Ongkir / Ekspedisi (Rp):</span>
                      <input
                        v-model.number="form.freight_amount"
                        type="number"
                        min="0"
                        class="form-control form-control-sm w-50 text-end"
                      />
                    </div>
                    <hr class="my-2" />
                    <div class="d-flex justify-content-between mb-3 fs-3">
                      <span class="fw-bold">Total Tagihan:</span>
                      <span class="fw-bold text-primary">{{ formatCurrency(calculateTotal) }}</span>
                    </div>
                    <div class="d-flex gap-2 justify-content-end">
                      <NuxtLink to="/purchase-invoice" class="btn btn-outline-secondary rounded-1">
                        Batal
                      </NuxtLink>
                      <button
                        type="submit"
                        class="btn btn-primary rounded-1 px-4"
                        :disabled="loading || form.items.length === 0"
                      >
                        <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                        Simpan Faktur
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
