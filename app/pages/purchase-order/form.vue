<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { CreatePurchaseOrderPayload, PurchaseOrderDetail } from "~/types/purchase-order";

const route = useRoute();
const router = useRouter();
const editId = computed(() => route.query.id as string | undefined);
const isEdit = computed(() => !!editId.value);

const poNumber = ref<string>("");
const title = computed(() => (isEdit.value ? `Edit Purchase Order (${poNumber.value})` : "Buat Purchase Order Manual"));
useHead({ title: title.value });

const { loading, submitForm, formatError } = useForm2();
const { formatDate } = useDateFormatter();

const suppliers = ref<any[]>([]);
const stores = ref<any[]>([]);
const warehouses = ref<any[]>([]);
const products = ref<any[]>([]);
const uoms = ref<any[]>([]);
const selectedSupplierObj = ref<any>(null);
const supplierDisplayValue = ref<string>("");

const form = ref({
  supplier_id: "",
  store_id: "",
  warehouse_id: "",
  reference_no: "",
  order_date: new Date().toISOString().split("T")[0],
  expected_delivery: "",
  payment_term_days: 0,
  payment_mode: "TRANSFER",
  notes: "",
  supplier_notes: "",
  items: [
    {
      product_id: "",
      product_id_text: "",
      product_id_obj: null as any,
      uom_id: "",
      qty_ordered: 1,
      unit_price: 0,
      notes: "",
    },
  ],
});

const pageLoading = ref(true);

const loadMasterData = async () => {
  pageLoading.value = true;
  const [storeRes, whRes, uomRes] = await Promise.all([
    useApi<{ data: any[] }>("/inventory/stores"),
    useApi<{ data: any[] }>("/inventory/warehouses"),
    useApi<{ data: any[] }>("/catalog/uoms"),
  ]);

  if (storeRes.data?.data) stores.value = storeRes.data.data;
  if (whRes.data?.data) warehouses.value = whRes.data.data;
  if (uomRes.data?.data) uoms.value = uomRes.data.data;

  const auth = useAuthStore();
  if (!isEdit.value) {
    if (auth.user?.store_id) {
      form.value.store_id = auth.user.store_id;
    } else if (stores.value.length > 0) {
      form.value.store_id = stores.value[0].id;
    }
  }

  if (isEdit.value && editId.value) {
    const poRes = await useApi<{ data: PurchaseOrderDetail }>(`/purchasing/purchase-orders/${editId.value}`);
    if (poRes.data?.data) {
      const d = poRes.data.data;
      poNumber.value = d.po_number || "";
      selectedSupplierObj.value = { 
        id: d.supplier_id, 
        name: d.supplier_name, 
        code: d.supplier_code,
        promo_marketing_discount_percentage: d.promo_marketing_discount_percentage,
      };
      form.value = {
        supplier_id: d.supplier_id,
        store_id: d.store_id,
        warehouse_id: d.warehouse_id,
        reference_no: d.reference_no || "",
        order_date: d.order_date ? d.order_date.split("T")[0] : "",
        expected_delivery: (d.expected_delivery ? d.expected_delivery.split("T")[0] : "") as string,
        payment_term_days: d.payment_term_days || 0,
        payment_mode: d.payment_mode || "TRANSFER",
        notes: d.notes || "",
        supplier_notes: d.supplier_notes || "",
        items: d.items.map((it) => ({
          product_id: it.product_id,
          product_id_text: `${it.product_name} (SKU: ${it.product_sku})`,
          product_id_obj: { id: it.product_id, name: it.product_name, sku: it.product_sku },
          uom_id: it.uom_id,
          qty_ordered: it.qty_ordered,
          unit_price: it.unit_price,
          notes: it.notes || "",
        })),
      };
    }
  }

  pageLoading.value = false;
};

watch(selectedSupplierObj, (sup) => {
  if (sup) {
    if (typeof sup.payment_term_days === "number") {
      form.value.payment_term_days = sup.payment_term_days;
    }
    if (sup.payment_mode) {
      form.value.payment_mode = sup.payment_mode;
    }
    const leadTime = sup.default_lead_time_days || sup.lead_time_days || 3;
    const baseDate = form.value.order_date ? new Date(form.value.order_date) : new Date();
    baseDate.setDate(baseDate.getDate() + leadTime);
    form.value.expected_delivery = baseDate.toISOString().split("T")[0] as string;
  }
});

onMounted(() => {
  loadMasterData();
});

const addItem = () => {
  form.value.items.push({
    product_id: "",
    product_id_text: "",
    product_id_obj: null as any,
    uom_id: "",
    qty_ordered: 1,
    unit_price: 0,
    notes: "",
  });
};

const removeItem = (idx: number) => {
  if (form.value.items.length <= 1) {
    alert("PO minimal harus memiliki 1 item barang");
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
      item.unit_price = prod.offered_price;
    }
    if (prod.min_order_qty && prod.min_order_qty > 0) {
      item.qty_ordered = prod.min_order_qty;
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
  return (Number(item.qty_ordered) || 0) * (Number(item.unit_price) || 0);
};

const promoMarketingDiscountPercentage = computed(() => {
  return selectedSupplierObj.value?.promo_marketing_discount_percentage || 0;
});

const promoMarketingDiscountAmount = computed(() => {
  const subtotal = form.value.items.reduce((acc, item) => acc + calculateSubtotal(item), 0);
  return (subtotal * promoMarketingDiscountPercentage.value) / 100;
});

const totalAmount = computed(() => {
  const subtotal = form.value.items.reduce((acc, item) => acc + calculateSubtotal(item), 0);
  return subtotal - promoMarketingDiscountAmount.value;
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const handleSubmit = async () => {
  const payload: CreatePurchaseOrderPayload = {
    supplier_id: form.value.supplier_id,
    store_id: form.value.store_id,
    warehouse_id: form.value.warehouse_id,
    reference_no: form.value.reference_no || undefined,
    order_date: form.value.order_date ? new Date(form.value.order_date).toISOString() : undefined,
    expected_delivery: form.value.expected_delivery ? new Date(form.value.expected_delivery).toISOString() : undefined,
    payment_term_days: Number(form.value.payment_term_days) || 0,
    payment_mode: form.value.payment_mode,
    notes: form.value.notes || undefined,
    supplier_notes: form.value.supplier_notes || undefined,
    items: form.value.items.map((it) => ({
      product_id: it.product_id,
      uom_id: it.uom_id,
      qty_ordered: Number(it.qty_ordered) || 0,
      unit_price: Number(it.unit_price) || 0,
      notes: it.notes || undefined,
    })),
  };

  const url = isEdit.value ? `/purchase-orders/${editId.value}` : "/purchase-orders";
  const method = isEdit.value ? "PUT" : "POST";

  const res = await submitForm(url, {
    method,
    body: payload,
    successMessage: isEdit.value ? "PO berhasil diperbarui!" : "PO berhasil dibuat!",
  });

  if (res && res.status >= 200 && res.status < 300) {
    router.push("/purchase-order");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:shopping-cart">
      <NuxtLink to="/purchase-order" class="btn btn-outline-secondary rounded-1">
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
                <h3 class="card-title mb-0">Informasi Utama PO</h3>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div v-if="isEdit" class="col-md-4">
                    <label class="form-label mb-1">Nomor PO</label>
                    <input :value="poNumber" type="text" class="form-control bg-body-secondary text-muted fw-bold" readonly />
                  </div>

                  <div class="col-md-4">
                    <UiSelectSearch5
                      v-model="form.supplier_id"
                      v-model:display-value="supplierDisplayValue"
                      v-model:selected-data="selectedSupplierObj"
                      value-key="id"
                      api-url="/purchasing/suppliers/pagination"
                      xname="supplier_id"
                      placeholder="-- Pilih Supplier --"
                      label="Supplier"
                      :required="true"
                      :error="formatError('Supplier', 'supplier_id')"
                      :select-format="(s: any) => `${s.name} (${s.code})`"
                      :selected-format="(s: any) => `${s.name} (${s.code})`"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required mb-1">Toko Pemesan</label>
                    <select v-model="form.store_id" class="form-select" required>
                      <option value="">-- Pilih Toko --</option>
                      <option v-for="st in stores" :key="st.id" :value="st.id">
                        {{ st.name }} ({{ st.code }})
                      </option>
                    </select>
                    <div v-if="formatError('Toko', 'store_id')" class="text-danger small mt-1">
                      {{ formatError('Toko', 'store_id') }}
                    </div>
                  </div>

                  <div class="col-md-3">
                    <label class="form-label required mb-1">Gudang Tujuan</label>
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

                  <div class="col-md-3">
                    <label class="form-label mb-1">Nomor Referensi (Quotation/Ext)</label>
                    <input v-model="form.reference_no" type="text" class="form-control" placeholder="cth: REF-2026-001" />
                  </div>

                  <div class="col-md-3">
                    <UiDatePicker4
                      v-model="form.order_date"
                      label="Tanggal Pesanan"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  <div class="col-md-3">
                    <UiDatePicker4
                      v-model="form.expected_delivery"
                      label="Estimasi Pengiriman Tiba"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  <div class="col-md-3">
                    <label class="form-label mb-1">Termin Pembayaran (Hari)</label>
                    <input v-model.number="form.payment_term_days" type="number" class="form-control" min="0" />
                  </div>

                  <div class="col-md-3">
                    <label class="form-label mb-1">Mode Pembayaran</label>
                    <select v-model="form.payment_mode" class="form-select">
                      <option value="TRANSFER">TRANSFER</option>
                      <option value="CASH">CASH</option>
                      <option value="GIRO">GIRO</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label mb-1">Catatan Internal</label>
                    <input v-model="form.notes" type="text" class="form-control" placeholder="Catatan tambahan internal..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table Card -->
          <div class="col-12">
            <div class="card shadow-sm card-overflow-visible">
              <div class="card-header">
                <h3 class="card-title mb-0">Barang Pesanan</h3>
              </div>
              <div class="table-responsive table-overflow-visible">
                <table class="table table-hover align-middle mb-0 table-compact">
                  <thead class="table-light border-bottom">
                    <tr>
                      <th style="width: 40px" class="text-center">#</th>
                      <th style="min-width: 300px">Produk <span class="text-danger">*</span></th>
                      <th style="min-width: 150px">Satuan (UOM) <span class="text-danger">*</span></th>
                      <th style="width: 130px">Qty Ordered <span class="text-danger">*</span></th>
                      <th style="min-width: 160px">Harga Satuan <span class="text-danger">*</span></th>
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
                          :select-format="(p: any) => p.is_contracted ? `⭐ ${p.name} (SKU: ${p.sku}) — ${formatCurrency(p.offered_price)}` : `📦 ${p.name} (SKU: ${p.sku})`"
                          :selected-format="(p: any) => p.is_contracted ? `⭐ ${p.name} (SKU: ${p.sku})` : `📦 ${p.name} (SKU: ${p.sku})`"
                          :filter-fn="(p: any) => isProductAvailable(p.id, idx)"
                          :error="formatError(`Produk ${idx+1}`, `items[${idx}].product_id`)"
                          @update:selected-data="(prod: any) => onProductObjChange(idx, prod)"
                        />
                      </td>
                      <td>
                        <select v-model="item.uom_id" class="form-select" required>
                          <option value="">-- Pilih UOM --</option>
                          <option v-for="u in uoms" :key="u.id" :value="u.id">
                            {{ u.name }}
                          </option>
                        </select>
                      </td>
                      <td>
                        <ui-input2
                          v-model="item.qty_ordered"
                          type="number"
                          placeholder="0"
                          :decimal="2"
                          :error="formatError(`Qty ${idx + 1}`, `items[${idx}].qty_ordered`)"
                        />
                      </td>
                      <td>
                        <ui-input2
                          v-model="item.unit_price"
                          type="number"
                          placeholder="0"
                          :error="formatError(`Harga Satuan ${idx + 1}`, `items[${idx}].unit_price`)"
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
                      <td colspan="5" class="text-end fw-semibold text-muted align-middle">
                        Subtotal :
                      </td>
                      <td class="text-end fw-semibold align-middle">{{ formatCurrency(totalAmount + promoMarketingDiscountAmount) }}</td>
                      <td></td>
                    </tr>
                    <tr v-if="promoMarketingDiscountPercentage > 0" class="bg-light">
                      <td colspan="5" class="text-end fw-semibold text-danger align-middle">
                        Promo Marketing Discount ({{ promoMarketingDiscountPercentage }}%) :
                      </td>
                      <td class="text-end fw-semibold text-danger align-middle">-{{ formatCurrency(promoMarketingDiscountAmount) }}</td>
                      <td></td>
                    </tr>
                    <tr class="bg-light">
                      <td colspan="5" class="text-end fw-bold fs-5 align-middle">
                        <label class="form-label mb-0 text-dark">Total Pesanan :</label>
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
                <NuxtLink to="/purchase-order" class="btn btn-secondary rounded-1">
                  Batal
                </NuxtLink>
                <button type="submit" class="btn btn-primary rounded-1" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  <Icon v-else name="i-tabler:device-floppy" class="icon icon-2 me-1" />
                  Simpan Draft PO
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
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
