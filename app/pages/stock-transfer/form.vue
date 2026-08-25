<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const router = useRouter();
const title = "Buat Transfer Stok Antar Gudang";
useHead({ title });

const formRef = ref<HTMLFormElement>();
const { loading, submitForm } = useForm2();

const warehouses = ref<any[]>([]);
const selectedProduct = ref<any>(null);
const productIdText = ref("");

const form = ref({
  from_warehouse_id: "",
  to_warehouse_id: "",
  transfer_date: new Date().toISOString().split("T")[0],
  driver_name: "",
  vehicle_number: "",
  notes: "",
  items: [] as Array<{
    product_id: string;
    product_name: string;
    uom_id: string;
    uom_code: string;
    qty_requested: number;
    qty_sent: number;
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

  const existing = form.value.items.find((it) => it.product_id === p.id);
  if (existing) {
    existing.qty_sent += 1;
    existing.qty_requested += 1;
  } else {
    form.value.items.push({
      product_id: p.id,
      product_name: p.name,
      uom_id: p.base_uom_id || "00000000-0000-0000-0000-000000000001",
      uom_code: p.base_uom_name || "PCS",
      qty_requested: 1,
      qty_sent: 1,
      notes: "",
    });
  }
  selectedProduct.value = null;
  productIdText.value = "";
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const onSubmit = async () => {
  if (!form.value.from_warehouse_id || !form.value.to_warehouse_id) {
    alert("Gudang Asal dan Gudang Tujuan wajib dipilih.");
    return;
  }
  if (form.value.from_warehouse_id === form.value.to_warehouse_id) {
    alert("Gudang Asal dan Gudang Tujuan tidak boleh sama.");
    return;
  }
  if (form.value.items.length === 0) {
    alert("Tambahkan minimal 1 barang untuk ditransfer.");
    return;
  }

  const payload = {
    from_warehouse_id: form.value.from_warehouse_id,
    to_warehouse_id: form.value.to_warehouse_id,
    transfer_date: form.value.transfer_date,
    driver_name: form.value.driver_name || null,
    vehicle_number: form.value.vehicle_number || null,
    notes: form.value.notes || null,
    items: form.value.items.map((it) => ({
      product_id: it.product_id,
      product_name: it.product_name,
      uom_id: it.uom_id,
      uom_code: it.uom_code,
      qty_requested: Number(it.qty_requested),
      qty_sent: Number(it.qty_sent),
      notes: it.notes || null,
    })),
  };

  const res = await submitForm("/inventory/stock-transfers", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/stock-transfer");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:arrows-transfer-down">
      <ui-button-back to="/stock-transfer" />
      <ui-button-save :loading="loading" :disabled="form.items.length === 0" :form="formRef" @save="formRef?.requestSubmit()" />
    </PageHeader>

    <PageBody>
      <form ref="formRef" autocomplete="off" novalidate @submit.prevent="onSubmit">
        <div class="row justify-content-center">
          <div class="col-xl-12 col-md-12 col-sm-12">
            <!-- Header Section -->
            <div class="row align-items-stretch mb-4">
              <div class="col-md-6">
                <div class="p-3 border rounded-1 bg-body-secondary h-100">
                  <div class="row g-2">
                    <div class="col-6">
                      <label class="form-label fw-bold mb-1">Gudang Asal <span class="text-danger">*</span></label>
                      <select v-model="form.from_warehouse_id" class="form-select rounded-1" required>
                        <option value="">-- Pilih Gudang Asal --</option>
                        <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                          {{ wh.name }} ({{ wh.code }})
                        </option>
                      </select>
                    </div>

                    <div class="col-6">
                      <label class="form-label fw-bold mb-1">Gudang Tujuan <span class="text-danger">*</span></label>
                      <select v-model="form.to_warehouse_id" class="form-select rounded-1" required>
                        <option value="">-- Pilih Gudang Tujuan --</option>
                        <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                          {{ wh.name }} ({{ wh.code }})
                        </option>
                      </select>
                    </div>

                    <div class="col-12 mt-2">
                      <label class="form-label fw-bold mb-1">Tanggal Transfer <span class="text-danger">*</span></label>
                      <ui-input2
                        v-model="form.transfer_date"
                        type="date"
                        :hide-label="true"
                        :required="true"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6 d-flex flex-column">
                <div class="p-3 border rounded-1 bg-body-secondary flex-grow-1">
                  <div class="row g-2">
                    <div class="col-6">
                      <ui-input2
                        v-model="form.driver_name"
                        label="Nama Driver / Kurir"
                        placeholder="Budi Santoso..."
                      />
                    </div>
                    <div class="col-6">
                      <ui-input2
                        v-model="form.vehicle_number"
                        label="No. Polisi Kendaraan"
                        placeholder="B 1234 CD..."
                      />
                    </div>
                    <div class="col-12">
                      <ui-input2
                        v-model="form.notes"
                        label="Catatan Pengiriman"
                        placeholder="Keterangan..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Section (Table Grid) -->
            <label class="fw-semibold mb-3">Daftar Barang Transfer ({{ form.items.length }})</label>

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
                    <th>Satuan</th>
                    <th style="width: 160px" class="text-end">Qty Permintaan</th>
                    <th style="width: 160px" class="text-end">Qty Dikirim</th>
                    <th style="min-width: 200px">Catatan Item</th>
                    <th style="width: 50px" class="text-center">
                      <Icon name="i-tabler:settings" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="form.items.length === 0">
                    <td colspan="7" class="text-center py-4 text-muted">
                      Belum ada barang yang ditambahkan. Gunakan pencarian di atas untuk menambahkan.
                    </td>
                  </tr>
                  <tr v-for="(it, idx) in form.items" :key="it.product_id || idx">
                    <td class="text-center text-muted fw-bold small align-middle">{{ idx + 1 }}</td>
                    <td class="fw-medium text-primary">{{ it.product_name }}</td>
                    <td>{{ it.uom_code }}</td>
                    <td>
                      <input
                        v-model.number="it.qty_requested"
                        type="number"
                        step="any"
                        min="0.001"
                        class="form-control rounded-1 text-end"
                      />
                    </td>
                    <td>
                      <input
                        v-model.number="it.qty_sent"
                        type="number"
                        step="any"
                        min="0.001"
                        class="form-control rounded-1 text-end fw-bold text-warning"
                      />
                    </td>
                    <td>
                      <input
                        v-model="it.notes"
                        type="text"
                        placeholder="Catatan kondisi/batch..."
                        class="form-control rounded-1"
                      />
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
