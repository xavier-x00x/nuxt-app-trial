<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchaseInvoiceList } from "~/types/purchase-invoice";

const router = useRouter();
const title = "Input Pembayaran Hutang";
useHead({ title });

const formRef = ref<HTMLFormElement>();
const { loading, submitForm, formatError } = useForm2();

const selectedSupplier = ref<any>(null);
const supplierIdText = ref("");
const invoicesLoading = ref(false);

const form = ref({
  supplier_id: "",
  supplier_name: "",
  reference_no: "",
  payment_date: new Date().toISOString().split("T")[0],
  payment_mode: "TRANSFER",
  giro_number: "",
  giro_due_date: "",
  admin_fee_amount: 0,
  discount_amount: 0,
  wht_amount: 0,
  notes: "",
  items: [] as Array<{
    purchase_invoice_id: string;
    invoice_number: string;
    supplier_invoice_number: string;
    due_date: string;
    total_amount: number;
    outstanding_amount: number;
    paid_amount: number;
    selected: boolean;
  }>,
});

watch(selectedSupplier, async (newSup) => {
  if (!newSup?.id) return;
  form.value.supplier_id = newSup.id;
  form.value.supplier_name = newSup.name || "";
  invoicesLoading.value = true;
  try {
    const res = await useApi<{ data: PurchaseInvoiceList[] }>(
      `/purchasing/purchase-invoices/pagination?supplier_id=${newSup.id}&status=POSTED&limit=50`
    );
    const list = res.data?.data || [];
    form.value.items = list.map((inv) => ({
      purchase_invoice_id: inv.id,
      invoice_number: inv.invoice_number,
      supplier_invoice_number: inv.supplier_invoice_number || "-",
      due_date: inv.due_date,
      total_amount: Number(inv.total_amount) || 0,
      outstanding_amount: Number(inv.outstanding_amount) || 0,
      paid_amount: Number(inv.outstanding_amount) || 0,
      selected: true,
    }));
  } catch (err) {
    console.error("Failed to load supplier invoices:", err);
  } finally {
    invoicesLoading.value = false;
  }
});

const calculateTotalPaid = computed(() => {
  return form.value.items
    .filter((it) => it.selected)
    .reduce((sum, it) => sum + Number(it.paid_amount || 0), 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const onSubmit = async () => {
  if (!form.value.supplier_id) {
    alert("Silakan pilih Supplier terlebih dahulu.");
    return;
  }

  const selectedItems = form.value.items
    .filter((it) => it.selected && Number(it.paid_amount) > 0)
    .map((it) => ({
      purchase_invoice_id: it.purchase_invoice_id,
      paid_amount: Number(it.paid_amount),
    }));

  if (selectedItems.length === 0) {
    alert("Silakan pilih minimal 1 faktur yang akan dibayar.");
    return;
  }

  const payload: any = {
    supplier_id: form.value.supplier_id,
    payment_date: form.value.payment_date,
    payment_mode: form.value.payment_mode,
    reference_no: form.value.reference_no || null,
    admin_fee_amount: Number(form.value.admin_fee_amount || 0),
    discount_amount: Number(form.value.discount_amount || 0),
    wht_amount: Number(form.value.wht_amount || 0),
    notes: form.value.notes || null,
    items: selectedItems,
  };

  if (form.value.payment_mode === "GIRO") {
    payload.giro_number = form.value.giro_number || null;
    payload.giro_due_date = form.value.giro_due_date || null;
  }

  const res = await submitForm("/purchasing/purchase-payments", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/purchase-payment");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:cash">
      <ui-button-back to="/purchase-payment" />
      <ui-button-save :loading="loading" :disabled="calculateTotalPaid === 0" :form="formRef" @save="formRef?.requestSubmit()" />
    </PageHeader>

    <PageBody>
      <form ref="formRef" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            <!-- Header Section -->
            <div class="row align-items-stretch mb-4">
              <div class="col-md-6">
                <div class="p-3 border rounded-1 bg-body-secondary h-100">
                  <label class="form-label fw-bold mb-2">Pilih Supplier <span class="text-danger">*</span></label>
                  <SelectSearch5
                    v-model="selectedSupplier"
                    v-model:display-value="supplierIdText"
                    api-url="/purchasing/suppliers/pagination"
                    label-key="name"
                    value-key="id"
                    placeholder="Pilih Supplier..."
                    :clearable="true"
                  />
                  <div v-if="formatError('Supplier', 'supplier_id')" class="text-danger small mt-1">
                    {{ formatError('Supplier', 'supplier_id') }}
                  </div>

                  <div class="row g-2 mt-2">
                    <div class="col-6">
                      <label class="form-label fw-bold mb-1 small">Tanggal Bayar <span class="text-danger">*</span></label>
                      <ui-input2
                        v-model="form.payment_date"
                        type="date"
                        :hide-label="true"
                        :required="true"
                      />
                    </div>
                    <div class="col-6">
                      <label class="form-label fw-bold mb-1 small">Metode Bayar <span class="text-danger">*</span></label>
                      <select v-model="form.payment_mode" class="form-select rounded-1">
                        <option value="TRANSFER">TRANSFER BANK</option>
                        <option value="CASH">KAS / TUNAI</option>
                        <option value="GIRO">GIRO / CEK</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-text mt-3 mb-0">
                    <Icon name="i-tabler:info-circle" /> Memilih supplier akan otomatis menampilkan seluruh faktur pembelian yang belum lunas.
                  </div>
                </div>
              </div>

              <div class="col-md-6 d-flex flex-column">
                <div class="p-3 border rounded-1 bg-body-secondary flex-grow-1">
                  <div class="row g-2">
                    <div class="col-6">
                      <ui-input2
                        v-model="form.reference_no"
                        label="No. Ref / Bukti Transfer"
                        placeholder="TRF-BCA-..."
                      />
                    </div>
                    <div class="col-6">
                      <ui-input2
                        v-model="form.admin_fee_amount"
                        type="number"
                        label="Biaya Admin (Rp)"
                      />
                    </div>
                    <div class="col-6">
                      <ui-input2
                        v-model="form.discount_amount"
                        type="number"
                        label="Diskon Pelunasan (Rp)"
                      />
                    </div>
                    <div class="col-6">
                      <ui-input2
                        v-model="form.notes"
                        label="Catatan"
                        placeholder="Keterangan..."
                      />
                    </div>
                  </div>

                  <!-- Summary Box -->
                  <div class="mt-3 p-2 border rounded-1 bg-body small d-flex align-items-center justify-content-between">
                    <span class="text-muted fw-semibold">Total Pembayaran Terpilih:</span>
                    <span class="fw-bold fs-3 text-success">{{ formatCurrency(calculateTotalPaid) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invoices Section (Table Grid) -->
            <label class="fw-semibold mb-3">Daftar Tagihan Faktur Pembelian ({{ form.items.length }})</label>

            <div class="table-responsive border rounded-1 mb-3 bg-body shadow-sm" style="max-height: 380px; min-height: 220px; overflow-y: auto;">
              <table class="table table-hover align-middle mb-0 table-compact">
                <thead class="sticky-top">
                  <tr>
                    <th style="width: 40px" class="text-center">Pilih</th>
                    <th>No. Faktur Pembelian</th>
                    <th>No. Faktur Supplier</th>
                    <th>Jatuh Tempo</th>
                    <th class="text-end">Total Tagihan</th>
                    <th class="text-end">Sisa Hutang</th>
                    <th style="width: 220px" class="text-end">Jumlah Bayar (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="form.items.length === 0">
                    <td colspan="7" class="text-center py-4 text-muted">
                      Pilih Supplier di atas untuk memuat daftar faktur yang belum lunas.
                    </td>
                  </tr>
                  <tr v-for="(inv, idx) in form.items" :key="inv.purchase_invoice_id || idx">
                    <td class="text-center">
                      <input v-model="inv.selected" type="checkbox" class="form-check-input" />
                    </td>
                    <td class="fw-medium text-primary">{{ inv.invoice_number }}</td>
                    <td class="text-muted small">{{ inv.supplier_invoice_number }}</td>
                    <td>{{ inv.due_date ? inv.due_date.split('T')[0] : '-' }}</td>
                    <td class="text-end">{{ formatCurrency(inv.total_amount) }}</td>
                    <td class="text-end text-danger fw-semibold">{{ formatCurrency(inv.outstanding_amount) }}</td>
                    <td>
                      <input
                        v-model.number="inv.paid_amount"
                        type="number"
                        step="any"
                        min="0"
                        :max="inv.outstanding_amount"
                        :disabled="!inv.selected"
                        class="form-control rounded-1 text-end fw-bold text-success"
                      />
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-body-tertiary fw-bold fs-3">
                    <td colspan="6" class="text-end">Total Bayar:</td>
                    <td class="text-end text-success">{{ formatCurrency(calculateTotalPaid) }}</td>
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
