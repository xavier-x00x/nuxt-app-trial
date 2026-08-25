<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const editId = computed(() => route.query.id as string | undefined);
const isEdit = computed(() => !!editId.value);

const title = computed(() => (isEdit.value ? "Edit Penerimaan Barang Langsung" : "Penerimaan Barang Langsung (Direct Purchase)"));
useHead({ title });

const { loading, submitForm, formatError } = useForm2();

const warehouses = ref<any[]>([]);
const uoms = ref<any[]>([]);
const selectedSupplierObj = ref<any>(null);
const supplierDisplayValue = ref<string>("");

const form = ref({
  supplier_id: "",
  warehouse_id: "",
  receipt_date: new Date().toISOString().split("T")[0],
  delivery_note_no: "",
  payment_type: "CASH",
  notes: "",
  items: [
    {
      product_id: "",
      product_id_text: "",
      product_id_obj: null as any,
      uom_id: "",
      qty_received: 1,
      buy_price: 0,
      notes: "",
    },
  ],
});

const pageLoading = ref(true);

const loadMasterData = async () => {
  pageLoading.value = true;
  const [whRes, uomRes] = await Promise.all([
    useApi<{ data: any[] }>("/inventory/warehouses"),
    useApi<{ data: any[] }>("/catalog/uoms"),
  ]);

  if (whRes.data?.data) warehouses.value = whRes.data.data;
  if (uomRes.data?.data) uoms.value = uomRes.data.data;

  if (isEdit.value && editId.value) {
    const grRes = await useApi<{ data: any }>(`/purchasing/goods-receipts/${editId.value}`);
    if (grRes.data?.data) {
      const d = grRes.data.data;
      selectedSupplierObj.value = {
        id: d.supplier_id,
        name: d.supplier_name,
        code: d.supplier_code,
      };
      supplierDisplayValue.value = `${d.supplier_name} (${d.supplier_code})`;
      form.value = {
        supplier_id: d.supplier_id,
        warehouse_id: d.warehouse_id,
        receipt_date: d.receipt_date ? d.receipt_date.split("T")[0] : "",
        delivery_note_no: d.delivery_note_no || "",
        payment_type: "CASH",
        notes: d.notes || "",
        items: d.items.map((it: any) => ({
          product_id: it.product_id,
          product_id_text: `${it.product_name} (SKU: ${it.product_sku})`,
          product_id_obj: { id: it.product_id, name: it.product_name, sku: it.product_sku },
          uom_id: it.uom_id,
          qty_received: Number(it.qty_received) || 0,
          buy_price: Number(it.unit_price) || 0,
          notes: it.notes || "",
        })),
      };
    }
  }

  pageLoading.value = false;
};

onMounted(() => {
  loadMasterData();
});

const addItem = () => {
  form.value.items.push({
    product_id: "",
    product_id_text: "",
    product_id_obj: null as any,
    uom_id: "",
    qty_received: 1,
    buy_price: 0,
    notes: "",
  });
};

const alertMessage = ref("");
let alertModalInstance: any = null;

const showAlert = (msg: string) => {
  alertMessage.value = msg;
  if (alertModalInstance) {
    alertModalInstance.show();
  } else if (window.bootstrap) {
    alertModalInstance = new window.bootstrap.Modal(document.getElementById("alertModal"));
    alertModalInstance.show();
  } else {
    alert(msg);
  }
};

const removeItem = (idx: number) => {
  if (form.value.items.length <= 1) {
    showAlert("Minimal harus memiliki 1 item barang");
    return;
  }
  form.value.items.splice(idx, 1);
};

const isProductAvailable = (productId: string, currentIdx: number) => {
  return !form.value.items.some((it, index) => index !== currentIdx && it.product_id === productId);
};

const onProductObjChange = (idx: number, prod: any) => {
  const item = form.value.items[idx];
  if (!item || !prod) return;
  if (prod.is_contracted) {
    if (prod.offered_price && prod.offered_price > 0) {
      item.buy_price = prod.offered_price;
    }
    if (prod.purchase_uom_id) {
      item.uom_id = prod.purchase_uom_id;
    } else if (prod.base_uom_id) {
      item.uom_id = prod.base_uom_id;
    }
  } else if (prod.base_uom_id) {
    item.uom_id = prod.base_uom_id;
  }
};

const calculateSubtotal = (item: any) => {
  return (Number(item.qty_received) || 0) * (Number(item.buy_price) || 0);
};

const totalAmount = computed(() => {
  return form.value.items.reduce((acc, item) => acc + calculateSubtotal(item), 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const handleSubmit = async () => {
  const payload = {
    supplier_id: form.value.supplier_id,
    warehouse_id: form.value.warehouse_id,
    receipt_date: form.value.receipt_date ? new Date(form.value.receipt_date).toISOString() : undefined,
    delivery_note_no: form.value.delivery_note_no || undefined,
    payment_type: form.value.payment_type,
    notes: form.value.notes || undefined,
    items: form.value.items.map((it) => ({
      product_id: it.product_id,
      uom_id: it.uom_id,
      qty_received: Number(it.qty_received) || 0,
      buy_price: Number(it.buy_price) || 0,
      notes: it.notes || undefined,
    })),
  };

  const url = isEdit.value ? `/goods-receipts/direct/${editId.value}` : "/goods-receipts/direct";
  const method = isEdit.value ? "PUT" : "POST";

  const res = await submitForm(url, {
    method,
    body: payload,
    successMessage: isEdit.value ? "Penerimaan barang langsung berhasil diperbarui!" : "Penerimaan barang langsung berhasil dibuat!",
  });

  if (res && res.status >= 200 && res.status < 300) {
    router.push("/goods-receipt");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:shopping-cart-plus">
      <NuxtLink to="/goods-receipt" class="btn btn-outline-secondary rounded-1">
        <Icon name="i-tabler:arrow-left" class="icon icon-2 me-1" />
        Batal
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <div v-if="pageLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Memuat data master...</div>
      </div>

      <form v-else @submit.prevent="handleSubmit">
        <div class="row g-3">
          <!-- Header Info Card -->
          <div class="col-12">
            <div class="card shadow-sm">
              <div class="card-header">
                <h3 class="card-title mb-0">Informasi Penerimaan</h3>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-4">
                    <UiSelectSearch5
                      v-model="form.supplier_id"
                      v-model:display-value="supplierDisplayValue"
                      v-model:selected-data="selectedSupplierObj"
                      value-key="id"
                      api-url="/purchasing/suppliers/pagination"
                      xname="supplier_id"
                      placeholder="-- Pilih Supplier --"
                      label="Supplier / Petani"
                      :required="true"
                      :error="formatError('Supplier', 'supplier_id')"
                      :select-format="(s: any) => `${s.name} (${s.code})`"
                      :selected-format="(s: any) => `${s.name} (${s.code})`"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required mb-1">Gudang Penerima</label>
                    <select v-model="form.warehouse_id" class="form-select" required>
                      <option value="">-- Pilih Gudang --</option>
                      <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                        {{ wh.name }}
                      </option>
                    </select>
                    <div v-if="formatError('Gudang', 'warehouse_id')" class="text-danger small mt-1">
                      {{ formatError('Gudang', 'warehouse_id') }}
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required mb-1">Tipe Pembayaran</label>
                    <select v-model="form.payment_type" class="form-select" required>
                      <option value="CASH">CASH (Tunai)</option>
                      <option value="TEMPO">TEMPO (Hutang)</option>
                    </select>
                  </div>

                  <div class="col-md-3">
                    <UiDatePicker4
                      v-model="form.receipt_date"
                      label="Tanggal Terima"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label mb-1">Nomor Surat Jalan (S/J)</label>
                    <input v-model="form.delivery_note_no" type="text" class="form-control" placeholder="cth: SJ-2026-001" />
                  </div>

                  <div class="col-md-5">
                    <label class="form-label mb-1">Catatan</label>
                    <input v-model="form.notes" type="text" class="form-control" placeholder="Catatan penerimaan..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table Card -->
          <div class="col-12">
            <div class="card shadow-sm card-overflow-visible">
              <div class="card-header">
                <h3 class="card-title mb-0">Daftar Barang (Direct Purchase)</h3>
              </div>
              <div class="table-responsive table-overflow-visible">
                <table class="table table-hover align-middle mb-0 table-compact">
                  <thead class="table-light border-bottom">
                    <tr>
                      <th style="width: 40px" class="text-center">#</th>
                      <th style="min-width: 300px">Produk <span class="text-danger">*</span></th>
                      <th style="min-width: 150px">Satuan (UOM) <span class="text-danger">*</span></th>
                      <th style="width: 130px">Qty Terima <span class="text-danger">*</span></th>
                      <th style="min-width: 160px">Harga Beli <span class="text-danger">*</span></th>
                      <th style="min-width: 160px" class="text-end">Subtotal</th>
                      <th style="width: 50px" class="text-center">
                        <Icon name="i-tabler:settings" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in form.items" :key="idx">
                      <td class="text-center text-muted fw-bold small">{{ idx + 1 }}</td>
                      <td>
                        <UiSelectSearch5
                          v-model="item.product_id"
                          v-model:display-value="item.product_id_text"
                          v-model:selected-data="item.product_id_obj"
                          value-key="id"
                          :api-url="`/products/by-supplier/pagination?supplier_id=${form.supplier_id || ''}`"
                          xname="product_id"
                          placeholder="-- Pilih Produk --"
                          :clearable="true"
                          :select-format="(p: any) => p.is_contracted ? `⭐ ${p.name} (SKU: ${p.sku})` : `📦 ${p.name} (SKU: ${p.sku})`"
                          :selected-format="(p: any) => p.is_contracted ? `⭐ ${p.name} (SKU: ${p.sku})` : `📦 ${p.name} (SKU: ${p.sku})`"
                          :filter-fn="(p: any) => isProductAvailable(p.id, idx)"
                          :error="formatError(`Produk ${idx+1}`, `items[${idx}].product_id`)"
                          @update:selected-data="(prod: any) => onProductObjChange(idx, prod)"
                        />
                      </td>
                      <td>
                        <select v-model="item.uom_id" class="form-select">
                          <option value="">-- Pilih UOM --</option>
                          <option v-for="u in uoms" :key="u.id" :value="u.id">
                            {{ u.name }}
                          </option>
                        </select>
                      </td>
                      <td>
                        <ui-input2
                          v-model="item.qty_received"
                          type="number"
                          placeholder="0"
                          :decimal="2"
                          :error="formatError(`Qty ${idx + 1}`, `items[${idx}].qty_received`)"
                        />
                      </td>
                      <td>
                        <ui-input2
                          v-model="item.buy_price"
                          type="number"
                          placeholder="0"
                          :error="formatError(`Harga Satuan ${idx + 1}`, `items[${idx}].buy_price`)"
                        />
                      </td>
                      <td class="text-end fw-bold text-primary align-middle">
                        {{ formatCurrency(calculateSubtotal(item)) }}
                      </td>
                      <td class="text-center align-middle">
                        <button
                          type="button"
                          class="btn btn-sm btn-link text-danger p-1"
                          title="Hapus baris"
                          @click="removeItem(idx)"
                        >
                          <Icon name="i-tabler:trash" style="font-size: 1.25rem;" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="bg-light">
                      <td colspan="5" class="text-end fw-bold fs-5 align-middle">
                        <label class="form-label mb-0 text-dark">Total Pembelian :</label>
                      </td>
                      <td class="text-end fw-bold fs-4 text-success align-middle">{{ formatCurrency(totalAmount) }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div class="p-3">
                <button
                  type="button"
                  class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center rounded-1"
                  style="border-style: dashed; border-width: 2px;"
                  @click="addItem"
                >
                  <Icon name="i-tabler:plus" class="me-1" style="font-size: 1.15rem;" /> Tambah Item Lainnya
                </button>
              </div>

              <div class="card-footer d-flex justify-content-end gap-2">
                <NuxtLink to="/goods-receipt" class="btn btn-secondary rounded-1">
                  Batal
                </NuxtLink>
                <button type="submit" class="btn btn-primary rounded-1" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  <Icon v-else name="i-tabler:device-floppy" class="icon icon-2 me-1" />
                  {{ isEdit ? 'Simpan Perubahan' : 'Simpan Penerimaan Barang' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>

    <!-- Alert Modal -->
    <div id="alertModal" class="modal modal-blur fade" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal"></button>
          <div class="modal-status bg-warning"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:alert-triangle" class="icon mb-2 text-warning icon-lg" style="font-size: 3rem;" />
            <h3>Peringatan</h3>
            <div class="text-muted">
              {{ alertMessage }}
            </div>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col">
                  <button type="button" class="btn w-100" data-bs-dismiss="modal">Mengerti</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-overflow-visible,
.table-overflow-visible {
  overflow: visible !important;
}
.table-compact tbody > tr > * {
  padding: 0.15rem 0.25rem !important;
}
.table-compact tfoot > tr > * {
  padding: 0.60rem 0.25rem !important;
}
</style>
