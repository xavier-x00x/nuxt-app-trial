<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const router = useRouter();
const title = "Buat Batch Produksi / Olahan";
useHead({ title });

const { loading, submitForm } = useForm2();

const warehouses = ref<any[]>([]);
const workCenters = ref<any[]>([]);
const selectedProduct = ref<any>(null);

const form = ref({
  date: new Date().toISOString().split("T")[0],
  warehouse_id: "",
  work_center_id: "",
  notes: "",
  outputs: [] as Array<{
    product_id: string;
    product_name: string;
    product_sku: string;
    planned_qty: number;
    uom_id: string;
    uom_code: string;
  }>,
});

onMounted(async () => {
  const [whRes, wcRes] = await Promise.all([
    useApi<{ data: any[] }>("/inventory/warehouses"),
    useApi<{ data: any[] }>("/inventory/work-centers"),
  ]);
  if (whRes.data?.data) warehouses.value = whRes.data.data;
  if (wcRes.data?.data) workCenters.value = wcRes.data.data;
});

const addOutput = () => {
  if (!selectedProduct.value?.id) return;
  const p = selectedProduct.value;

  form.value.outputs.push({
    product_id: p.id,
    product_name: p.name,
    product_sku: p.sku || "SKU-000",
    planned_qty: 1,
    uom_id: p.base_uom_id || "00000000-0000-0000-0000-000000000001",
    uom_code: p.base_uom_name || "PCS",
  });
  selectedProduct.value = null;
};

const removeOutput = (index: number) => {
  form.value.outputs.splice(index, 1);
};

const onSubmit = async () => {
  if (!form.value.warehouse_id || !form.value.work_center_id) {
    alert("Gudang dan Work Center wajib dipilih.");
    return;
  }
  if (form.value.outputs.length === 0) {
    alert("Tambahkan minimal 1 produk jadi yang akan diproduksi.");
    return;
  }

  const payload = {
    date: form.value.date,
    warehouse_id: form.value.warehouse_id,
    work_center_id: form.value.work_center_id,
    notes: form.value.notes || null,
    outputs: form.value.outputs.map((it) => ({
      product_id: it.product_id,
      product_name: it.product_name,
      planned_qty: Number(it.planned_qty),
      uom_id: it.uom_id,
      uom_code: it.uom_code,
    })),
  };

  const res = await submitForm("/inventory/production-batches", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/production-batch");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:meat">
      <ui-button-back to="/production-batch" />
    </PageHeader>

    <PageBody>
      <form @submit.prevent="onSubmit">
        <div class="row g-3">
          <!-- Header Data -->
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Informasi Lokasi & Work Center Produksi</h4>
              </div>
              <div class="card-body p-4">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label required">Pilih Gudang / Cabang</label>
                    <select v-model="form.warehouse_id" class="form-select rounded-1" required>
                      <option value="">-- Pilih Gudang --</option>
                      <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                        {{ wh.name }} ({{ wh.code }})
                      </option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required">Pilih Work Center (Dapur/Bagian)</label>
                    <select v-model="form.work_center_id" class="form-select rounded-1" required>
                      <option value="">-- Pilih Work Center --</option>
                      <option v-for="wc in workCenters" :key="wc.id" :value="wc.id">
                        {{ wc.name }} ({{ wc.code }})
                      </option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.date"
                      type="date"
                      label="Tanggal Batch Produksi"
                      :required="true"
                    />
                  </div>

                  <div class="col-12">
                    <ui-input2
                      v-model="form.notes"
                      label="Catatan Batch"
                      placeholder="Keterangan shift / batch number vendor..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Output Items Table -->
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Target Produk Jadi (Finished Goods Output)</h4>
              </div>
              <div class="card-body p-3 bg-body-tertiary border-bottom">
                <div class="row g-2 align-items-end">
                  <div class="col-md-8">
                    <label class="form-label small mb-1">Cari Produk Jadi (BOM)</label>
                    <SelectSearch5
                      v-model="selectedProduct"
                      api-url="/catalog/products/pagination"
                      label-key="name"
                      value-key="id"
                      placeholder="Ketik nama atau SKU barang olahan..."
                    />
                  </div>
                  <div class="col-md-4">
                    <button
                      type="button"
                      class="btn btn-primary rounded-1 w-100"
                      :disabled="!selectedProduct"
                      @click="addOutput"
                    >
                      <Icon name="i-tabler:plus" class="icon icon-2" />
                      Tambah Target Output
                    </button>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr class="text-muted small">
                      <th style="width: 40px;">#</th>
                      <th>Nama Produk Jadi</th>
                      <th>Satuan</th>
                      <th style="width: 180px;" class="text-end">Qty Target Produksi</th>
                      <th style="width: 50px;" class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.outputs.length === 0">
                      <td colspan="5" class="text-center py-4 text-muted">
                        Belum ada target produk jadi yang ditambahkan.
                      </td>
                    </tr>
                    <tr v-for="(it, idx) in form.outputs" :key="it.product_id || idx">
                      <td>{{ idx + 1 }}.</td>
                      <td>
                        <div class="fw-medium">{{ it.product_name }}</div>
                        <div class="text-muted small">{{ it.product_sku }}</div>
                      </td>
                      <td>{{ it.uom_code }}</td>
                      <td>
                        <input
                          v-model.number="it.planned_qty"
                          type="number"
                          step="any"
                          min="0.001"
                          class="form-control rounded-1 text-end fw-bold"
                        />
                      </td>
                      <td class="text-center">
                        <button
                          type="button"
                          class="btn btn-outline-danger p-2 rounded-1"
                          title="Hapus"
                          @click="removeOutput(idx)"
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
                <NuxtLink to="/production-batch" class="btn btn-outline-secondary rounded-1">
                  Batal
                </NuxtLink>
                <button
                  type="submit"
                  class="btn btn-primary rounded-1 px-4"
                  :disabled="loading || form.outputs.length === 0"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                  Simpan Batch Produksi
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageBody>
  </div>
</template>
