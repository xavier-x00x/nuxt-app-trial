<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const router = useRouter();
const title = "Buat Rencana Belanja Pasar / Petani";
useHead({ title });

const { loading, submitForm } = useForm2();

const warehouses = ref<any[]>([]);
const selectedProduct = ref<any>(null);

const form = ref({
  plan_date: new Date().toISOString().split("T")[0],
  source_location: "Pasar Induk Kramat Jati",
  target_warehouse_id: "",
  target_warehouse_name: "",
  buyer_name: "Staff Purchaser Fresh",
  cash_advance_amount: 5000000,
  notes: "",
  items: [] as Array<{
    product_id: string;
    product_code: string;
    product_name: string;
    uom_id: string;
    uom_code: string;
    target_qty: number;
    estimated_price: number;
    shrinkage_buffer_pct: number;
    notes: string;
  }>,
});

onMounted(async () => {
  const res = await useApi<{ data: any[] }>("/inventory/warehouses");
  if (res.data?.data) {
    warehouses.value = res.data.data;
    if (warehouses.value.length > 0) {
      form.value.target_warehouse_id = warehouses.value[0].id;
      form.value.target_warehouse_name = warehouses.value[0].name;
    }
  }
});

watch(
  () => form.value.target_warehouse_id,
  (newVal) => {
    const wh = warehouses.value.find((w) => w.id === newVal);
    if (wh) {
      form.value.target_warehouse_name = wh.name;
    }
  }
);

const addItem = () => {
  if (!selectedProduct.value?.id) return;
  const p = selectedProduct.value;

  form.value.items.push({
    product_id: p.id,
    product_code: p.sku || p.code || "SKU-000",
    product_name: p.name,
    uom_id: p.base_uom_id || "00000000-0000-0000-0000-000000000001",
    uom_code: p.base_uom_name || "KG",
    target_qty: 10,
    estimated_price: Number(p.purchase_price || p.price || 15000),
    shrinkage_buffer_pct: 5,
    notes: "",
  });
  selectedProduct.value = null;
};

const removeItem = (idx: number) => {
  form.value.items.splice(idx, 1);
};

const calculateTotalEstimated = computed(() => {
  return form.value.items.reduce((sum, it) => sum + Number(it.target_qty || 0) * Number(it.estimated_price || 0), 0);
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const onSubmit = async () => {
  if (!form.value.target_warehouse_id) {
    alert("Silakan pilih Gudang / DC penerima barang segar.");
    return;
  }
  if (form.value.items.length === 0) {
    alert("Tambahkan minimal 1 item produk segar.");
    return;
  }

  const payload = {
    plan_date: form.value.plan_date,
    source_location: form.value.source_location,
    target_warehouse_id: form.value.target_warehouse_id,
    target_warehouse_name: form.value.target_warehouse_name,
    buyer_name: form.value.buyer_name,
    cash_advance_amount: Number(form.value.cash_advance_amount || 0),
    notes: form.value.notes || null,
    items: form.value.items.map((it) => ({
      product_id: it.product_id,
      product_code: it.product_code,
      product_name: it.product_name,
      uom_id: it.uom_id,
      uom_code: it.uom_code,
      target_qty: Number(it.target_qty),
      estimated_price: Number(it.estimated_price),
      shrinkage_buffer_pct: Number(it.shrinkage_buffer_pct || 0),
      notes: it.notes || null,
    })),
  };

  const res = await submitForm("/purchasing/fresh-market-plans", {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    router.push("/fresh-market-plan");
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:leaf">
      <ui-button-back to="/fresh-market-plan" />
    </PageHeader>

    <PageBody>
      <form @submit.prevent="onSubmit">
        <div class="row g-3">
          <!-- Header Data -->
          <div class="col-12">
            <div class="card shadow-sm border-0">
              <div class="card-header bg-transparent border-bottom">
                <h4 class="card-title mb-0">Informasi Rencana Belanja Pasar & Kas Bon</h4>
              </div>
              <div class="card-body p-4">
                <div class="row g-3">
                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.source_location"
                      label="Lokasi Pasar / Petani"
                      placeholder="Contoh: Pasar Induk Kramat Jati, Petani Sayur Lembang"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label required">Gudang / DC Penerima</label>
                    <select v-model="form.target_warehouse_id" class="form-select rounded-1" required>
                      <option value="">-- Pilih DC Penerima --</option>
                      <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">
                        {{ wh.name }} ({{ wh.code }})
                      </option>
                    </select>
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.plan_date"
                      type="date"
                      label="Tanggal Rencana Belanja"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.buyer_name"
                      label="Petugas Pembeli (Purchaser Lapangan)"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.cash_advance_amount"
                      type="number"
                      label="Uang Muka / Kas Bon Belanja (Rp)"
                      :required="true"
                    />
                  </div>

                  <div class="col-md-4">
                    <ui-input2
                      v-model="form.notes"
                      label="Catatan Belanja"
                      placeholder="Keterangan..."
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
                <h4 class="card-title mb-0">Daftar Komoditas Segar yang Akan Dibeli</h4>
              </div>
              <div class="card-body p-3 bg-body-tertiary border-bottom">
                <div class="row g-2 align-items-end">
                  <div class="col-md-8">
                    <label class="form-label small mb-1">Cari Produk Sayur / Buah / Daging</label>
                    <SelectSearch5
                      v-model="selectedProduct"
                      api-url="/catalog/products/pagination"
                      label-key="name"
                      value-key="id"
                      placeholder="Ketik nama sayur / buah..."
                    />
                  </div>
                  <div class="col-md-4">
                    <button
                      type="button"
                      class="btn btn-primary rounded-1 w-100"
                      :disabled="!selectedProduct"
                      @click="addItem"
                    >
                      <Icon name="i-tabler:plus" class="icon icon-2" />
                      Tambah Komoditas
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
                      <th style="width: 140px;" class="text-end">Target Qty</th>
                      <th style="width: 170px;" class="text-end">Est. Harga / Satuan</th>
                      <th style="width: 120px;" class="text-end">Toleransi Susut (%)</th>
                      <th class="text-end">Est. Subtotal</th>
                      <th style="width: 50px;" class="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="form.items.length === 0">
                      <td colspan="8" class="text-center py-4 text-muted">
                        Belum ada item komoditas yang ditambahkan.
                      </td>
                    </tr>
                    <tr v-for="(it, idx) in form.items" :key="it.product_id || idx">
                      <td>{{ idx + 1 }}.</td>
                      <td>
                        <div class="fw-medium">{{ it.product_name }}</div>
                        <div class="text-muted small">{{ it.product_code }}</div>
                      </td>
                      <td>{{ it.uom_code }}</td>
                      <td>
                        <input
                          v-model.number="it.target_qty"
                          type="number"
                          step="any"
                          min="0.001"
                          class="form-control rounded-1 text-end fw-bold"
                        />
                      </td>
                      <td>
                        <input
                          v-model.number="it.estimated_price"
                          type="number"
                          step="any"
                          min="0"
                          class="form-control rounded-1 text-end"
                        />
                      </td>
                      <td>
                        <input
                          v-model.number="it.shrinkage_buffer_pct"
                          type="number"
                          step="any"
                          min="0"
                          class="form-control rounded-1 text-end"
                        />
                      </td>
                      <td class="text-end fw-bold text-info">
                        {{ formatCurrency(Number(it.target_qty) * Number(it.estimated_price)) }}
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

              <!-- Footer Summary -->
              <div class="card-footer bg-transparent border-top p-4">
                <div class="row justify-content-end">
                  <div class="col-md-5">
                    <div class="d-flex justify-content-between mb-3 fs-3">
                      <span class="fw-bold">Estimasi Total Budget:</span>
                      <span class="fw-bold text-info">{{ formatCurrency(calculateTotalEstimated) }}</span>
                    </div>
                    <div class="d-flex gap-2 justify-content-end">
                      <NuxtLink to="/fresh-market-plan" class="btn btn-outline-secondary rounded-1">
                        Batal
                      </NuxtLink>
                      <button
                        type="submit"
                        class="btn btn-primary rounded-1 px-4"
                        :disabled="loading || form.items.length === 0"
                      >
                        <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                        Simpan Rencana Belanja
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
