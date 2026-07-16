<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { GoodsReceiptDetail } from "~/types/goods-receipt";
import type { PurchaseOrderDetail } from "~/types/purchase-order";

const route = useRoute();
const router = useRouter();
const editId = computed(() => route.query.id as string | undefined);
const isEdit = computed(() => !!editId.value);

const grNumber = ref<string>("");
const title = computed(() => (isEdit.value ? `Edit Draft Penerimaan Barang (${grNumber.value})` : "Buat Penerimaan Barang"));
useHead({ title: title.value });

const { loading, submitForm, formatError } = useForm2();
const { formatDate } = useDateFormatter();

const warehouses = ref<any[]>([]);
const stores = ref<any[]>([]);
const apAccounts = ref<any[]>([]);

const selectedPOObj = ref<any>(null);
const poDisplayValue = ref<string>("");

// Form state
const form = ref({
  purchase_order_id: "",
  warehouse_id: "",
  receipt_date: new Date().toISOString().split("T")[0],
  delivery_note_no: "",
  notes: "",
  is_with_invoice: false,
  // invoice fields
  supplier_invoice_number: "",
  invoice_date: new Date().toISOString().split("T")[0],
  ap_account_id: "",
  payment_term_days: 0,
  discount_amount: 0,
  // items
  items: [] as Array<{
    purchase_order_item_id: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    uom_id: string;
    uom_code: string;
    base_uom_name?: string;
    conversion_rate?: number;
    qty_ordered: number;
    qty_received_po: number; // qty received in PO previously
    remaining_qty: number; // sisa yang harus diterima
    qty_received: number; // current received qty
    qty_rejected: number; // current rejected qty
    unit_price: number;
    reject_reason: string;
    notes: string;
  }>,
});

const pageLoading = ref(true);

const loadMasterData = async () => {
  pageLoading.value = true;
  const [whRes, storeRes, accountRes] = await Promise.all([
    useApi<{ data: any[] }>("/warehouses"),
    useApi<{ data: any[] }>("/stores"),
    useApi<{ data: any[] }>("/accounts/type/LIABILITY"),
  ]);

  if (whRes.data?.data) warehouses.value = whRes.data.data;
  if (storeRes.data?.data) stores.value = storeRes.data.data;
  if (accountRes.data?.data) {
    apAccounts.value = accountRes.data.data;
  } else {
    // Fallback if type endpoint is not available, load general accounts
    const allAccRes = await useApi<{ data: any[] }>("/accounts");
    if (allAccRes.data?.data) apAccounts.value = allAccRes.data.data;
  }

  if (isEdit.value && editId.value) {
    const grRes = await useApi<{ data: GoodsReceiptDetail }>(`/goods-receipts/${editId.value}`);
    if (grRes.data?.data) {
      const d = grRes.data.data;
      grNumber.value = d.gr_number || "";
      selectedPOObj.value = {
        id: d.purchase_order_id,
        po_number: d.po_number,
        supplier_name: d.supplier_name,
        supplier_code: d.supplier_code,
      };

      form.value = {
        purchase_order_id: d.purchase_order_id,
        warehouse_id: d.warehouse_id,
        receipt_date: d.receipt_date ? d.receipt_date.split("T")[0] : "",
        delivery_note_no: d.delivery_note_no || "",
        notes: d.notes || "",
        is_with_invoice: false, // Edit does not support modifying invoice relation directly
        supplier_invoice_number: "",
        invoice_date: new Date().toISOString().split("T")[0],
        ap_account_id: "",
        payment_term_days: 0,
        discount_amount: 0,
        items: d.items.map((it) => {
          // Calculate remaining qty: ordered - already received (excluding this gr received)
          const qtyReceivedPO = 0; // Backend handles remaining logic, we show ordered and received
          return {
            purchase_order_item_id: it.purchase_order_item_id,
            product_id: it.product_id,
            product_name: it.product_name,
            product_sku: it.product_sku,
            uom_id: it.uom_id,
            uom_code: it.uom_code,
            base_uom_name: it.base_uom_name,
            conversion_rate: it.conversion_rate,
            qty_ordered: it.qty_ordered,
            qty_received_po: 0, // Placeholder
            remaining_qty: it.qty_ordered, // Fallback
            qty_received: it.qty_received,
            qty_rejected: it.qty_rejected,
            unit_price: it.unit_price,
            reject_reason: it.reject_reason || "",
            notes: it.notes || "",
          };
        }),
      };
    }
  }

  pageLoading.value = false;
};

// When PO is selected
watch(selectedPOObj, async (newPO) => {
  if (newPO && !isEdit.value) {
    pageLoading.value = true;
    const poRes = await useApi<{ data: PurchaseOrderDetail }>(`/purchase-orders/${newPO.id}`);
    if (poRes.data?.data) {
      const p = poRes.data.data;
      form.value.purchase_order_id = p.id;
      form.value.warehouse_id = p.warehouse_id;
      form.value.payment_term_days = p.payment_term_days || 0;
      form.value.items = p.items.map((it) => {
        const qtyReceivedPO = Number(it.qty_received || 0);
        const qtyOrdered = Number(it.qty_ordered || 0);
        const draftQty = Number(it.draft_qty || 0);
        const remaining = Math.max(0, qtyOrdered - qtyReceivedPO - draftQty);
        return {
          purchase_order_item_id: it.id || "",
          product_id: it.product_id,
          product_name: it.product_name || "",
          product_sku: it.product_sku || "",
          uom_id: it.uom_id,
          uom_code: it.uom_name || "",
          base_uom_name: it.base_uom_name,
          conversion_rate: it.conversion_rate,
          qty_ordered: qtyOrdered,
          qty_received_po: qtyReceivedPO,
          remaining_qty: remaining,
          qty_received: remaining, // default received qty to remaining
          qty_rejected: 0,
          unit_price: it.unit_price || 0,
          reject_reason: "",
          notes: "",
        };
      });
    }
    pageLoading.value = false;
  }
});

onMounted(() => {
  loadMasterData();
});

// Reactively check if PIN validation is required
const needsPINOverride = computed(() => {
  return form.value.items.some((it) => it.qty_received > it.remaining_qty);
});

// Prompt Modal PIN State
const showPINModal = ref(false);
const overridePIN = ref("");

const openPINModal = () => {
  overridePIN.value = "";
  showPINModal.value = true;
};

const handlePINSubmit = () => {
  if (!overridePIN.value.trim()) {
    alert("PIN otorisasi wajib diisi");
    return;
  }
  showPINModal.value = false;
  executeSubmit(overridePIN.value);
};

const handleSubmit = () => {
  // Validate reject reasons
  const missingReason = form.value.items.some(
    (it) => it.qty_rejected > 0 && !it.reject_reason.trim()
  );
  if (missingReason) {
    alert("Semua item yang ditolak (Qty Tolak > 0) wajib menyertakan Alasan Ditolak!");
    return;
  }

  // Check if needs PIN override
  if (needsPINOverride.value) {
    openPINModal();
  } else {
    executeSubmit();
  }
};

const executeSubmit = async (pin?: string) => {
  const itemsPayload = form.value.items.map((it) => ({
    purchase_order_item_id: it.purchase_order_item_id,
    product_id: it.product_id,
    uom_id: it.uom_id,
    qty_received: Number(it.qty_received) || 0,
    qty_rejected: Number(it.qty_rejected) || 0,
    unit_price: Number(it.unit_price) || 0,
    reject_reason: it.qty_rejected > 0 ? it.reject_reason : undefined,
    notes: it.notes || undefined,
  }));

  const basePayload = {
    purchase_order_id: form.value.purchase_order_id,
    warehouse_id: form.value.warehouse_id,
    receipt_date: new Date(form.value.receipt_date || "").toISOString(),
    delivery_note_no: form.value.delivery_note_no || undefined,
    notes: form.value.notes || undefined,
    override_pin: pin || undefined,
    items: itemsPayload,
  };

  let url = "/goods-receipts";
  let method: "POST" | "PUT" = "POST";
  let payload: any = basePayload;

  if (isEdit.value) {
    url = `/goods-receipts/${editId.value}`;
    method = "PUT";
    payload = {
      receipt_date: basePayload.receipt_date,
      delivery_note_no: basePayload.delivery_note_no,
      notes: basePayload.notes,
      override_pin: basePayload.override_pin,
      items: basePayload.items,
    };
  } else if (form.value.is_with_invoice) {
    url = "/goods-receipts/with-invoice";
    payload = {
      ...basePayload,
      supplier_invoice_number: form.value.supplier_invoice_number,
      invoice_date: new Date(form.value.invoice_date || "").toISOString(),
      ap_account_id: form.value.ap_account_id,
      payment_term_days: Number(form.value.payment_term_days) || 0,
      discount_amount: Number(form.value.discount_amount) || 0,
    };
  }

  const res = await submitForm(url, {
    method,
    body: payload,
    successMessage: isEdit.value ? "Penerimaan barang berhasil diperbarui!" : "Penerimaan barang berhasil disimpan sebagai draft!",
  });

  if (res && res.status >= 200 && res.status < 300) {
    router.push("/goods-receipt");
  }
};

const filterPO = (p: any) => {
  return p.status === "APPROVED" || p.status === "PARTIALLY_RECEIVED";
};

const supplierNameDisplay = computed(() => {
  if (!selectedPOObj.value) return "";
  const name = selectedPOObj.value.supplier_name || "";
  const code = selectedPOObj.value.supplier_code || "";
  return code ? `${name} (${code})` : name;
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:building-warehouse">
      <NuxtLink to="/goods-receipt" class="btn btn-outline-secondary rounded-1">
        <Icon name="i-tabler:arrow-left" class="icon icon-2 me-1" />
        Batal
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <div v-if="pageLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Memuat data...</div>
      </div>

      <form v-else @submit.prevent="handleSubmit">
        <div class="row g-3">
          <!-- Header Info Card -->
          <div class="col-12">
            <div class="card shadow-sm">
              <div class="card-header">
                <h3 class="card-title mb-0">Informasi Utama Penerimaan</h3>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <!-- PO Selection (Disabled in Edit) -->
                  <div class="col-md-4">
                    <div v-if="isEdit">
                      <label class="form-label mb-1">Purchase Order Referensi</label>
                      <input
                        :value="selectedPOObj?.po_number || '-'"
                        type="text"
                        class="form-control bg-body-secondary text-muted rounded-1"
                        readonly
                      />
                    </div>
                    <UiSelectSearch5
                      v-else
                      v-model="form.purchase_order_id"
                      v-model:display-value="poDisplayValue"
                      v-model:selected-data="selectedPOObj"
                      value-key="id"
                      api-url="/purchase-orders/pagination"
                      xname="purchase_order_id"
                      placeholder="-- Pilih Purchase Order --"
                      label="Purchase Order Referensi"
                      :required="true"
                      :disabled="isEdit"
                      :filter-fn="filterPO"
                      :select-format="(p: any) => `${p.po_number} (${p.supplier_name}) [${p.status}]`"
                      :selected-format="(p: any) => `${p.po_number} (${p.supplier_name})`"
                    />
                  </div>

                  <!-- Supplier Name (Read-only) -->
                  <div class="col-md-4">
                    <label class="form-label mb-1">Nama Supplier</label>
                    <input
                      :value="supplierNameDisplay || '-'"
                      type="text"
                      class="form-control bg-body-secondary text-muted rounded-1"
                      readonly
                    />
                  </div>

                  <!-- Warehouse Selection (Auto-filled from PO) -->
                  <div class="col-md-4">
                    <label class="form-label required mb-1">Gudang Penerima</label>
                    <select v-model="form.warehouse_id" class="form-select rounded-1" required :disabled="isEdit">
                      <option value="">-- Pilih Gudang --</option>
                      <option v-for="w in warehouses" :key="w.id" :value="w.id">
                        {{ w.name }}
                      </option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required mb-1">Tanggal Terima</label>
                    <input v-model="form.receipt_date" type="date" class="form-control" required />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label mb-1">No. Surat Jalan (Delivery Note)</label>
                    <input v-model="form.delivery_note_no" type="text" class="form-control" placeholder="Contoh: SJ/123/IX" />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label mb-1">Catatan Penerimaan</label>
                    <input v-model="form.notes" type="text" class="form-control" placeholder="Catatan tambahan staf gudang..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mode Direct Invoice (Only in Create Mode) -->
          <div v-if="!isEdit" class="col-12">
            <div class="card shadow-sm border-primary">
              <div class="card-body">
                <div class="form-check form-switch mb-0">
                  <input
                    id="is_with_invoice"
                    v-model="form.is_with_invoice"
                    class="form-check-input"
                    type="checkbox"
                  />
                  <label class="form-check-label fw-bold text-primary" for="is_with_invoice">
                    Terima Langsung dengan Faktur Pembelian (Mode Cepat / Direct Invoice)
                  </label>
                </div>
                <p class="text-muted small mb-0 mt-1">
                  Centang opsi ini jika sopir membawa faktur kertas secara bersamaan. Sistem akan mengkonfirmasi penerimaan stok dan langsung membuat Invoice Pembelian dalam 1x klik.
                </p>

                <!-- Invoice Fields (Expandable) -->
                <div v-if="form.is_with_invoice" class="row g-3 mt-2 border-top pt-3">
                  <div class="col-md-4">
                    <label class="form-label required mb-1 text-primary">No. Faktur Pemasok</label>
                    <input
                      v-model="form.supplier_invoice_number"
                      type="text"
                      class="form-control border-primary"
                      placeholder="Masukkan No Faktur Supplier..."
                      required
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required mb-1">Tanggal Faktur</label>
                    <input v-model="form.invoice_date" type="date" class="form-control" required />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required mb-1">Akun Hutang Dagang (AP Account)</label>
                    <select v-model="form.ap_account_id" class="form-select border-primary" required>
                      <option value="">-- Pilih Akun Hutang --</option>
                      <option v-for="acc in apAccounts" :key="acc.id" :value="acc.id">
                        {{ acc.account_code }} - {{ acc.name }}
                      </option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label mb-1">Termin Pembayaran (Hari)</label>
                    <input v-model="form.payment_term_days" type="number" class="form-control" min="0" />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label mb-1">Potongan Harga / Diskon Faktur</label>
                    <input v-model="form.discount_amount" type="number" class="form-control" min="0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Detail Card -->
          <div class="col-12">
            <div class="card shadow-sm">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="card-title mb-0">Daftar Fisik Barang yang Diterima</h3>
                <span v-if="needsPINOverride" class="badge bg-danger text-white fs-6">
                  <Icon name="i-tabler:shield-lock" class="me-1" />
                  Butuh Otorisasi PIN (Over-Receive)
                </span>
              </div>
              <div class="table-responsive">
                <table class="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th class="w-1">No</th>
                      <th>Nama Barang</th>
                      <th class="text-center" width="10%">Qty Order</th>
                      <th class="text-center" width="10%">Telah Diterima</th>
                      <th class="text-center" width="12%">Sisa</th>
                      <th class="text-center" width="12%">Qty Diterima</th>
                      <th class="text-center" width="12%">Qty Tolak</th>
                      <th>Alasan Ditolak / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in form.items" :key="item.purchase_order_item_id">
                      <td>{{ idx + 1 }}</td>
                      <td>
                        <div class="fw-bold">{{ item.product_name }}</div>
                        <div class="text-muted small">SKU: {{ item.product_sku }}</div>
                        <div v-if="item.conversion_rate" class="text-info small mt-1">
                          (1 {{ item.uom_code }} = {{ item.conversion_rate }} {{ item.base_uom_name }})
                        </div>
                      </td>
                      <td class="text-center">{{ item.qty_ordered }} {{ item.uom_code }}</td>
                      <td class="text-center text-muted">{{ item.qty_received_po }} {{ item.uom_code }}</td>
                      <td class="text-center">
                        <span class="badge bg-blue-lt">{{ item.remaining_qty }} {{ item.uom_code }}</span>
                      </td>
                      <td>
                        <div class="input-group">
                          <input
                            v-model.number="item.qty_received"
                            type="number"
                            class="form-control text-center"
                            :class="{ 'is-invalid border-danger': item.qty_received > item.remaining_qty }"
                            min="0"
                            step="any"
                            required
                          />
                          <span class="input-group-text">{{ item.uom_code }}</span>
                        </div>
                        <div v-if="item.qty_received > item.remaining_qty" class="text-danger small mt-1">
                          Over-receive
                        </div>
                      </td>
                      <td>
                        <div class="input-group">
                          <input
                            v-model.number="item.qty_rejected"
                            type="number"
                            class="form-control text-center"
                            min="0"
                            step="any"
                            required
                          />
                          <span class="input-group-text">{{ item.uom_code }}</span>
                        </div>
                      </td>
                      <td>
                        <input
                          v-model="item.reject_reason"
                          type="text"
                          class="form-control"
                          :class="{ 'is-invalid border-danger': item.qty_rejected > 0 && !item.reject_reason.trim() }"
                          :placeholder="item.qty_rejected > 0 ? 'Wajib isi alasan penolakan...' : 'Keterangan barang...'"
                          :required="item.qty_rejected > 0"
                        />
                      </td>
                    </tr>
                    <tr v-if="form.items.length === 0">
                      <td colspan="8" class="text-center text-muted py-4">
                        Silakan pilih Purchase Order terlebih dahulu untuk memuat daftar barang.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="col-12 text-end">
            <button type="submit" class="btn btn-primary rounded-1" :disabled="loading || form.items.length === 0">
              <Icon name="i-tabler:device-floppy" class="icon icon-2 me-1" />
              {{ isEdit ? 'Simpan Perubahan' : 'Simpan Draft Penerimaan' }}
            </button>
          </div>
        </div>
      </form>
    </PageBody>

    <!-- Otorisasi PIN Modal -->
    <div class="modal modal-blur fade" :class="{ show: showPINModal }" :style="{ display: showPINModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" aria-label="Close" @click="showPINModal = false"></button>
          <div class="modal-status bg-danger"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:lock" class="icon mb-2 text-danger icon-lg" style="font-size: 3rem;" />
            <h3>Otorisasi Over-Receiving</h3>
            <p class="text-muted">
              Ada penerimaan kuantitas barang melebihi sisa PO. Dibutuhkan PIN Kepala Gudang / Supervisor untuk menyetujui tindakan ini.
            </p>
            <input
              v-model="overridePIN"
              type="password"
              class="form-control text-center fs-2 fw-bold letter-spacing-5"
              placeholder="PIN"
              maxlength="10"
              required
            />
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showPINModal = false">Batal</button></div>
                <div class="col"><button type="button" class="btn btn-danger w-100" @click="handlePINSubmit">Sahkan PIN</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showPINModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
.letter-spacing-5 {
  letter-spacing: 0.5rem;
}
</style>
