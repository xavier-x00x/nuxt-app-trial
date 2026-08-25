<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { StockTransferPlanning } from "~/types/stock-transfer";

const title = "Perencanaan Transfer Stok (Planning)";
useHead({ title });

const { loading: submitting, submitForm } = useForm2();

const plans = ref<StockTransferPlanning[]>([]);
const loading = ref(false);
const filterDate = ref(new Date().toISOString().split("T")[0]);

const fetchPlans = async () => {
  loading.value = true;
  try {
    const res = await useApi<{ data: StockTransferPlanning[] }>("/inventory/stock-transfer-plans/pending");
    if (res.data?.data) {
      plans.value = res.data.data;
    }
  } catch (err) {
    console.error("Failed to fetch pending transfer plans:", err);
  } finally {
    loading.value = false;
  }
};

const runCalculation = async () => {
  loading.value = true;
  try {
    const res = await submitForm("/inventory/stock-transfer-plans/calculate", {
      method: "POST",
      body: { plan_date: filterDate.value },
    });
    if (res?.success) {
      await fetchPlans();
    }
  } finally {
    loading.value = false;
  }
};

const approvePlan = async (id: string, qty: number) => {
  const res = await submitForm("/inventory/stock-transfer-plans/approve", {
    method: "POST",
    body: { ids: [id], approved_qty: qty },
  });
  if (res?.success) {
    await fetchPlans();
  }
};

const ignorePlan = async (id: string) => {
  const res = await submitForm("/inventory/stock-transfer-plans/ignore", {
    method: "POST",
    body: { ids: [id] },
  });
  if (res?.success) {
    await fetchPlans();
  }
};

onMounted(() => {
  fetchPlans();
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:calendar-stats">
      <div class="d-flex gap-2">
        <ui-button-back to="/stock-transfer" />
        <button
          type="button"
          class="btn btn-primary rounded-1"
          :disabled="loading || submitting"
          @click="runCalculation"
        >
          <Icon name="i-tabler:calculator" class="icon icon-2" />
          Hitung Kebutuhan Transfer
        </button>
      </div>
    </PageHeader>

    <PageBody>
      <div class="card shadow-sm border-0">
        <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
          <h4 class="card-title mb-0">Rekomendasi Pemindahan Stok Toko / Gudang</h4>
          <div class="d-flex align-items-center gap-2">
            <label class="small text-muted mb-0">Tanggal Rencana:</label>
            <input v-model="filterDate" type="date" class="form-control form-control-sm" style="width: 150px;" />
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="text-muted small">
                <th style="width: 50px;">#</th>
                <th>Nama Produk</th>
                <th>Gudang Asal</th>
                <th>Gudang Tujuan</th>
                <th>Satuan</th>
                <th class="text-end">Qty Rekomendasi</th>
                <th style="width: 150px;" class="text-end">Qty Disetujui</th>
                <th class="text-center" style="width: 180px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="text-center">
                <td colspan="8" class="py-4 text-muted">
                  <div class="spinner-border spinner-border-sm me-1" role="status"></div>
                  Memuat rekomendasi transfer...
                </td>
              </tr>
              <tr v-else-if="plans.length === 0" class="text-center">
                <td colspan="8" class="py-4 text-muted">
                  Tidak ada rekomendasi transfer pending. Klik "Hitung Kebutuhan Transfer" untuk menjalankan kalkulasi.
                </td>
              </tr>
              <tr v-for="(p, idx) in plans" :key="p.id">
                <td>{{ idx + 1 }}.</td>
                <td>
                  <div class="fw-medium">{{ p.product_name }}</div>
                  <div class="text-muted small">{{ p.product_sku }}</div>
                </td>
                <td>{{ p.from_warehouse_name || p.from_warehouse_id }}</td>
                <td>{{ p.to_warehouse_name || p.to_warehouse_id }}</td>
                <td>{{ p.uom_code }}</td>
                <td class="text-end fw-bold text-info">{{ p.recommended_qty }}</td>
                <td>
                  <input
                    v-model.number="p.approved_qty"
                    type="number"
                    min="0"
                    class="form-control form-control-sm text-end"
                  />
                </td>
                <td class="text-center">
                  <div class="d-flex gap-1 justify-content-center">
                    <button
                      type="button"
                      class="btn btn-sm btn-success rounded-1 px-2"
                      :disabled="submitting"
                      @click="approvePlan(p.id, p.approved_qty)"
                    >
                      <Icon name="i-tabler:check" class="icon icon-2" />
                      Setujui
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger rounded-1 px-2"
                      :disabled="submitting"
                      @click="ignorePlan(p.id)"
                    >
                      <Icon name="i-tabler:x" class="icon icon-2" />
                      Abaikan
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageBody>
  </div>
</template>
