<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
const title = "Perencanaan Produksi (Production Plan)";
useHead({ title });

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

const plans = ref<any[]>([]);
const loading = ref(false);
const filterDate = ref(new Date().toISOString().split("T")[0]);

const fetchPlans = async () => {
  loading.value = true;
  try {
    const res = await useApi<{ data: any[] }>("/inventory/production-plans/pending");
    if (res.data?.data) {
      plans.value = res.data.data;
    }
  } catch (err) {
    console.error("Failed to fetch pending production plans:", err);
  } finally {
    loading.value = false;
  }
};

const runCalculation = async () => {
  loading.value = true;
  try {
    const res = await submitForm("/inventory/production-plans/calculate", {
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
  const res = await submitForm("/inventory/production-plans/approve", {
    method: "POST",
    body: { ids: [id], approved_qty: qty },
  });
  if (res?.success) {
    await fetchPlans();
  }
};

const ignorePlan = async (id: string) => {
  const res = await submitForm("/inventory/production-plans/ignore", {
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
    <PageHeader :title="title" icon="i-tabler:calendar-time">
      <button
        type="button"
        class="btn btn-primary rounded-1"
        :disabled="loading || submitting"
        @click="runCalculation"
      >
        <Icon name="i-tabler:calculator" class="icon icon-2" />
        Hitung Kebutuhan Produksi
      </button>
    </PageHeader>

    <PageBody>
      <div class="card shadow-sm border-0">
        <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
          <h4 class="card-title mb-0">Rekomendasi Produksi (BOM / Olahan Dapur)</h4>
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
                <th>Produk Jadi (Output)</th>
                <th>Work Center / Lokasi</th>
                <th>Satuan</th>
                <th class="text-end">Qty Rekomendasi</th>
                <th style="width: 150px;" class="text-end">Qty Disetujui</th>
                <th class="text-center" style="width: 180px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading" class="text-center">
                <td colspan="7" class="py-4 text-muted">
                  <div class="spinner-border spinner-border-sm me-1" role="status"></div>
                  Memuat rekomendasi rencana produksi...
                </td>
              </tr>
              <tr v-else-if="plans.length === 0" class="text-center">
                <td colspan="7" class="py-4 text-muted">
                  Tidak ada rencana produksi pending. Klik "Hitung Kebutuhan Produksi" untuk menjadwalkan batch harian.
                </td>
              </tr>
              <tr v-for="(p, idx) in plans" :key="p.id">
                <td>{{ idx + 1 }}.</td>
                <td>
                  <div class="fw-medium">{{ p.product_name }}</div>
                  <div class="text-muted small">{{ p.product_sku }}</div>
                </td>
                <td>{{ p.work_center_name || p.warehouse_name || '-' }}</td>
                <td>{{ p.uom_name || 'PCS' }}</td>
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
