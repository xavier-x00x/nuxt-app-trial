<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const router = useRouter();
const title = "Buat Penyesuaian Stok";
useHead({ title });

const formRef = ref<HTMLFormElement>();
const { loading, submitForm } = useForm2();

const warehouses = ref<any[]>([]);
const selectedProduct = ref<any>(null);
const productIdText = ref("");

const form = ref({
  warehouse_id: "",
  notes: "",
  items: [] as Array<{
    product_id: string;
    product_code: string;
    product_name: string;
    uom_name: string;
    adjustment_type: "INCREASE" | "DECREASE";
    quantity: number;
    cost_price?: number;
    reason: string;
    notes: string;
  }>,
});

onMounted(async () => {
  const res = await useApi<{ data: any[] }>("/inventory/warehouses");
  if (res.data?.data) {
    warehouses.value = res.data.data;
  }
});

const addItem = () => {
  if (!selectedProduct.value?.id) return;
  const p = selectedProduct.value;

  form.value.items.push({
    product_id: p.id,
    product_code: p.sku || p.code || "SKU-000",
    product_name: p.name,
    uom_name: p.base_uom_name || "PCS",
    adjustment_type: "INCREASE",
    quantity: 1,
    cost_price: 0,
    reason: "Koreksi Fisik",
    notes: "",
  });
  selectedProduct.value = null;
  productIdText.value = "";
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const onSubmit = async () => {
  if (!form.value.warehouse_id) {
    alert("Silakan pilih Gudang terlebih dahulu.");
    return;
  }
  if (form.value.items.length === 0) {
    alert("Tambahkan minimal 1 barang untuk disesuaikan.");
    return;
  }

  const payload = {
    warehouse_id: form.value.warehouse_id,
    requested_by_id: "00000000-0000-0000-0000-000000000001",
    notes: form.value.notes || null,
    items: form.value.items.map((it) => ({
      product_id: it.product_id,
      product_code: it.product_code,
      product_name: it.product_name,
      uom_name: it.uom_name,
      adjustment_type: it.adjustment_type,
      quantity: Number(it.quantity),
      cost_price: Number(it.cost_price || 0),
      reason: it.reason,
      notes: it.notes || null,
    })),
  };

  const res = await submitForm("/inventory/stock-adjustments", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/stock-adjustment");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:adjustments">
      <ui-button-back to="/stock-adjustment" />
      <ui-button-save :loading="loading" :disabled="form.items.length === 0" :form="formRef" @save="formRef?.requestSubmit()" />
    </PageHeader>

    <PageBody>
      <form ref="formRef" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            <!-- Header Section -->
            <div class="row align-items-stretch mb-4">
              <div class="col-md-5">
                <div class="p-3 border rounded-1 bg-body-secondary h-100">
                  <label class="form-label fw-bold mb-2">Pilih Gudang Lokasi <span class="text-danger">*</span></label>
                  <select v-model="form.warehouse_id" class="form-select rounded-1" required>
                    <option value="">-- Pilih Gudang --</option>
                    <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                      {{ wh.name }} ({{ wh.code }})
                    </option>
                  </select>

                  <div class="form-text mt-3 mb-0">
                    <Icon name="i-tabler:info-circle" /> Penyesuaian stok akan mengoreksi fisik stok gudang setelah disetujui.
                  </div>
                </div>
              </div>

              <div class="col-md-7 d-flex flex-column">
                <ui-textarea
                  v-model="form.notes"
                  class="flex-grow-1"
                  label="Alasan / Catatan Penyesuaian"
                  placeholder="Contoh: Koreksi selisih audit fisik bulanan..."
                />
              </div>
            </div>

            <!-- Items Section (Table Grid) -->
            <label class="fw-semibold mb-3">Daftar Barang Penyesuaian ({{ form.items.length }})</label>

            <!-- Search Add Item Input -->
            <div class="row g-2 mb-3">
              <div class="col-md-9">
                <SelectSearch5
                  v-model="selectedProduct"
                  v-model:display-value="productIdText"
                  api-url="/catalog/products/pagination"
                  label-key="name"
                  value-key="id"
                  placeholder="Ketik nama atau SKU barang untuk ditambahkan..."
                  :clearable="true"
                />
              </div>
              <div class="col-md-3">
                <button
                  type="button"
                  class="btn btn-primary rounded-1 w-100 py-2"
                  :disabled="!selectedProduct"
                  @click="addItem"
                >
                  <Icon name="i-tabler:plus" class="icon icon-2 me-1" />
                  Tambah Barang
                </button>
              </div>
            </div>

            <div class="table-responsive border rounded-1 mb-3 bg-body shadow-sm" style="max-height: 380px; min-height: 220px; overflow-y: auto;">
              <table class="table table-hover align-middle mb-0 table-compact">
                <thead class="sticky-top">
                  <tr>
                    <th style="width: 40px" class="text-center">#</th>
                    <th style="min-width: 260px">Nama Barang</th>
                    <th style="width: 180px">Tipe Penyesuaian</th>
                    <th style="width: 150px" class="text-end">Qty Koreksi</th>
                    <th>Satuan</th>
                    <th style="width: 200px">Alasan Koreksi</th>
                    <th style="width: 50px" class="text-center">
                      <Icon name="i-tabler:settings" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="form.items.length === 0">
                    <td colspan="7" class="text-center py-4 text-muted">
                      Belum ada barang yang ditambahkan. Gunakan pencarian di atas.
                    </td>
                  </tr>
                  <tr v-for="(it, idx) in form.items" :key="it.product_id || idx">
                    <td class="text-center text-muted fw-bold small align-middle">{{ idx + 1 }}</td>
                    <td>
                      <div class="fw-medium text-primary">{{ it.product_name }}</div>
                      <div class="text-muted small">{{ it.product_code }}</div>
                    </td>
                    <td>
                      <select v-model="it.adjustment_type" class="form-select rounded-1">
                        <option value="INCREASE">+ Penambahan (Increase)</option>
                        <option value="DECREASE">- Pengurangan (Decrease)</option>
                      </select>
                    </td>
                    <td>
                      <input
                        v-model.number="it.quantity"
                        type="number"
                        step="any"
                        min="0.001"
                        class="form-control rounded-1 text-end fw-bold"
                      />
                    </td>
                    <td>{{ it.uom_name }}</td>
                    <td>
                      <select v-model="it.reason" class="form-select rounded-1">
                        <option value="Koreksi Fisik">Koreksi Fisik</option>
                        <option value="Barang Rusak">Barang Rusak</option>
                        <option value="Selisih Opname">Selisih Opname</option>
                        <option value="Bonus Supplier">Bonus Supplier</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
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
