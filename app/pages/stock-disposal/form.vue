<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const router = useRouter();
const title = "Buat Berita Acara Pemusnahan Stok";
useHead({ title });

const { loading, submitForm } = useForm2();

const warehouses = ref<any[]>([]);
const selectedProduct = ref<any>(null);

const form = ref({
  warehouse_id: "",
  disposal_date: new Date().toISOString().split("T")[0],
  reason: "KADALUARSA",
  notes: "",
  items: [] as Array<{
    product_id: string;
    product_name: string;
    product_code: string;
    uom_name: string;
    quantity: number;
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
    product_name: p.name,
    product_code: p.sku || p.code || "SKU-000",
    uom_name: p.base_uom_name || "PCS",
    quantity: 1,
    notes: "",
  });
  selectedProduct.value = null;
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
    alert("Tambahkan minimal 1 barang untuk dimusnahkan.");
    return;
  }

  const payload = {
    warehouse_id: form.value.warehouse_id,
    disposal_date: form.value.disposal_date,
    reason: form.value.reason,
    notes: form.value.notes || null,
    items: form.value.items.map((it) => ({
      product_id: it.product_id,
      quantity: Number(it.quantity),
      notes: it.notes || null,
    })),
  };

  const res = await submitForm("/inventory/stock-disposals", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/stock-disposal");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:trash">
      <ui-button-back to="/stock-disposal" />
    </PageHeader>

    <PageBody>
      <form @submit.prevent="onSubmit">
        <div class="row g-3">
          <!-- Header Data -->
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Informasi Lokasi & Alasan Pemusnahan</h4>
              </div>
              <div class="card-body p-4">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label required">Pilih Gudang</label>
                    <select v-model="form.warehouse_id" class="form-select rounded-1" required>
                      <option value="">-- Pilih Gudang --</option>
                      <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                        {{ wh.name }} ({{ wh.code }})
                      </option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.disposal_date"
                      type="date"
                      label="Tanggal Pemusnahan"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required">Alasan Pemusnahan</label>
                    <select v-model="form.reason" class="form-select rounded-1" required>
                      <option value="KADALUARSA">Kadaluarsa (Expired)</option>
                      <option value="RUSAK">Rusak / Pecah / Cacat</option>
                      <option value="BUSUK">Busuk (Fresh Produce)</option>
                      <option value="HILANG">Hilang (Write-off)</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>

                  <div class="col-12">
                    <ui-input2
                      v-model="form.notes"
                      label="Keterangan / Berita Acara"
                      placeholder="Nomor dokumen BA atau catatan saksi pemusnahan..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Daftar Barang yang Dimusnahkan</h4>
              </div>
              <div class="card-body p-3 bg-body-tertiary border-bottom">
                <div class="row g-2 align-items-end">
                  <div class="col-md-8">
                    <label class="form-label small mb-1">Cari Produk</label>
                    <SelectSearch5
                      v-model="selectedProduct"
                      api-url="/catalog/products/pagination"
                      label-key="name"
                      value-key="id"
                      placeholder="Ketik nama atau SKU barang..."
                    />
                  </div>
                  <div class="col-md-4">
                    <button
                      type="button"
                      class="btn btn-danger rounded-1 w-100"
                      :disabled="!selectedProduct"
                      @click="addItem"
                    >
                      <Icon name="i-tabler:plus" class="icon icon-2" />
                      Tambah Barang
                    </button>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr class="text-muted small">
                      <th style="width: 40px;">#</th>
                      <th>Nama Barang</th>
                      <th>Satuan</th>
                      <th style="width: 160px;" class="text-end">Qty Musnah</th>
                      <th>Catatan</th>
                      <th style="width: 50px;" class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.items.length === 0">
                      <td colspan="6" class="text-center py-4 text-muted">
                        Belum ada barang yang ditambahkan.
                      </td>
                    </tr>
                    <tr v-for="(it, idx) in form.items" :key="it.product_id || idx">
                      <td>{{ idx + 1 }}.</td>
                      <td>
                        <div class="fw-medium">{{ it.product_name }}</div>
                        <div class="text-muted small">{{ it.product_code }}</div>
                      </td>
                      <td>{{ it.uom_name }}</td>
                      <td>
                        <input
                          v-model.number="it.quantity"
                          type="number"
                          step="any"
                          min="0.001"
                          class="form-control rounded-1 text-end fw-bold text-danger"
                        />
                      </td>
                      <td>
                        <input
                          v-model="it.notes"
                          type="text"
                          placeholder="Catatan kondisi/kerusakan..."
                          class="form-control rounded-1"
                        />
                      </td>
                      <td class="text-center">
                        <button
                          type="button"
                          class="btn btn-outline-danger p-2 rounded-1"
                          title="Hapus"
                          @click="removeItem(idx)"
                        >
                          <Icon name="i-tabler:trash" class="icon icon-2" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Footer Actions -->
              <div class="card-footer bg-transparent border-top p-4 d-flex justify-content-end gap-2">
                <NuxtLink to="/stock-disposal" class="btn btn-outline-secondary rounded-1">
                  Batal
                </NuxtLink>
                <button
                  type="submit"
                  class="btn btn-danger rounded-1 px-4"
                  :disabled="loading || form.items.length === 0"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  Simpan Dokumen Pemusnahan
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
