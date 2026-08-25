<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { FreshMarketPlanDetail } from "~/types/fresh-market-plan";

const route = useRoute();
const id = route.params.id as string;

const plan = ref<FreshMarketPlanDetail | null>(null);
const loading = ref(true);

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

const showApproveModal = ref(false);
const approveBudget = ref(0);

const showRealizeModal = ref(false);
const realizeForm = ref({
  total_actual_spend: 0,
  cash_returned_amount: 0,
  receipt_number: "",
  notes: "",
  items: [] as Array<{
    product_id: string;
    product_name: string;
    target_qty: number;
    uom_code: string;
    actual_qty: number;
    actual_price: number;
    vendor_name: string;
  }>,
});

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-secondary text-white";
    case "APPROVED":
      return "bg-primary text-white";
    case "REALIZED":
      return "bg-success text-white";
    case "CANCELLED":
      return "bg-danger text-white";
    default:
      return "bg-secondary text-white";
  }
};

const fetchDetail = async () => {
  loading.value = true;
  try {
    const res = await useApi<{ data: FreshMarketPlanDetail }>(`/purchasing/fresh-market-plans/${id}`);
    if (res.data?.data) {
      plan.value = res.data.data;
      approveBudget.value = Number(plan.value.total_estimated_budget || 0);
    }
  } catch (err) {
    console.error("Failed to fetch plan detail:", err);
  } finally {
    loading.value = false;
  }
};

const openRealizeModal = () => {
  if (!plan.value) return;
  realizeForm.value = {
    total_actual_spend: Number(plan.value.total_estimated_budget || 0),
    cash_returned_amount: Math.max(0, Number(plan.value.cash_advance_amount || 0) - Number(plan.value.total_estimated_budget || 0)),
    receipt_number: `RCV-FM-${plan.value.plan_number}`,
    notes: "",
    items: plan.value.items.map((it) => ({
      product_id: it.product_id,
      product_name: it.product_name,
      target_qty: it.target_qty,
      uom_code: it.uom_code,
      actual_qty: it.target_qty,
      actual_price: it.estimated_price,
      vendor_name: "Pasar Induk",
    })),
  };
  showRealizeModal.value = true;
};

const submitApproval = async () => {
  const res = await submitForm(`/purchasing/fresh-market-plans/${id}/approve`, {
    method: "POST",
    body: {
      approved_budget: Number(approveBudget.value),
      approved_by_name: "Purchasing Manager",
    },
  });
  if (res?.success) {
    showApproveModal.value = false;
    await fetchDetail();
  }
};

const submitRealization = async () => {
  const payload = {
    receipt_number: realizeForm.value.receipt_number,
    receipt_date: new Date().toISOString(),
    total_actual_spend: Number(realizeForm.value.total_actual_spend),
    cash_returned_amount: Number(realizeForm.value.cash_returned_amount),
    notes: realizeForm.value.notes || null,
    items: realizeForm.value.items.map((it) => ({
      product_id: it.product_id,
      actual_qty: Number(it.actual_qty),
      actual_price: Number(it.actual_price),
      vendor_name: it.vendor_name || null,
    })),
  };

  const res = await submitForm(`/purchasing/fresh-market-plans/${id}/realize`, {
    method: "POST",
    body: payload,
  });

  if (res?.success) {
    showRealizeModal.value = false;
    await fetchDetail();
  }
};

onMounted(() => {
  fetchDetail();
});

useHead({
  title: computed(() => (plan.value ? `Rencana: ${plan.value.plan_number}` : "Detail Rencana Belanja Pasar")),
});
</script>

<template>
  <div>
    <PageHeader
      :title="plan ? `Rencana Belanja ${plan.plan_number}` : 'Detail Rencana Belanja Pasar'"
      icon="i-tabler:leaf"
    >
      <div class="d-flex gap-2">
        <ui-button-back to="/fresh-market-plan" />
        <button
          v-if="plan && plan.status === 'DRAFT'"
          type="button"
          class="btn btn-primary rounded-1"
          @click="showApproveModal = true"
        >
          <Icon name="i-tabler:check" class="icon icon-2" />
          Setujui Rencana (Approve)
        </button>
        <button
          v-if="plan && plan.status === 'APPROVED'"
          type="button"
          class="btn btn-success rounded-1"
          @click="openRealizeModal"
        >
          <Icon name="i-tabler:truck-loading" class="icon icon-2" />
          Realisasi Belanja & Terima di DC
        </button>
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted mt-2">Memuat dokumen rencana belanja pasar...</div>
      </div>

      <div v-else-if="plan" class="row g-3">
        <!-- Header Info -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="card-title mb-0 fw-bold">
                  {{ plan.plan_number }}
                </h3>
                <span :class="['badge fs-4 px-3 py-2', getStatusBadgeClass(plan.status)]">
                  {{ plan.status }}
                </span>
              </div>

              <div class="row g-3">
                <div class="col-md-3">
                  <div class="text-muted small">Lokasi Pasar / Petani</div>
                  <div class="fw-bold">{{ plan.source_location }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Gudang / DC Penerima</div>
                  <div class="fw-bold">{{ plan.target_warehouse_name }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Tanggal Rencana Belanja</div>
                  <div>{{ formatDate(plan.plan_date) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Petugas Purchaser / Pembeli</div>
                  <div class="fw-bold text-primary">{{ plan.buyer_name }}</div>
                </div>

                <div class="col-md-3">
                  <div class="text-muted small">Estimasi Total Budget</div>
                  <div class="fw-bold text-info fs-3">{{ formatCurrency(Number(plan.total_estimated_budget)) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Uang Muka / Kas Bon (Advance)</div>
                  <div class="fw-bold text-warning fs-3">{{ formatCurrency(Number(plan.cash_advance_amount)) }}</div>
                </div>
                <div v-if="plan.approved_budget" class="col-md-3">
                  <div class="text-muted small">Budget Disetujui Manager</div>
                  <div class="fw-bold fs-3">{{ formatCurrency(Number(plan.approved_budget)) }}</div>
                </div>
                <div v-if="plan.total_actual_spend" class="col-md-3">
                  <div class="text-muted small">Total Realisasi Belanja Aktual</div>
                  <div class="fw-bold text-success fs-3">{{ formatCurrency(Number(plan.total_actual_spend)) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent border-bottom">
              <h4 class="card-title mb-0">Rincian Komoditas Segar</h4>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small">
                    <th style="width: 50px;">#</th>
                    <th>Nama Produk</th>
                    <th>Satuan</th>
                    <th class="text-end">Target Qty</th>
                    <th class="text-end">Est. Harga / Satuan</th>
                    <th class="text-end">Est. Subtotal</th>
                    <th v-if="plan.status === 'REALIZED'" class="text-end">Qty Aktual</th>
                    <th v-if="plan.status === 'REALIZED'" class="text-end">Harga Beli Aktual</th>
                    <th v-if="plan.status === 'REALIZED'" class="text-end">Total Riil</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in plan.items" :key="item.id || idx">
                    <td>{{ idx + 1 }}.</td>
                    <td>
                      <div class="fw-medium">{{ item.product_name }}</div>
                      <div class="text-muted small">{{ item.product_code }}</div>
                    </td>
                    <td>{{ item.uom_code }}</td>
                    <td class="text-end">{{ item.target_qty }}</td>
                    <td class="text-end">{{ formatCurrency(Number(item.estimated_price)) }}</td>
                    <td class="text-end fw-bold text-info">
                      {{ formatCurrency(Number(item.target_qty) * Number(item.estimated_price)) }}
                    </td>
                    <td v-if="plan.status === 'REALIZED'" class="text-end fw-bold text-success">
                      {{ item.actual_qty ?? '-' }}
                    </td>
                    <td v-if="plan.status === 'REALIZED'" class="text-end">
                      {{ item.actual_price ? formatCurrency(Number(item.actual_price)) : '-' }}
                    </td>
                    <td v-if="plan.status === 'REALIZED'" class="text-end fw-bold text-success">
                      {{ item.actual_qty && item.actual_price ? formatCurrency(Number(item.actual_qty) * Number(item.actual_price)) : '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Approval -->
      <div
        v-if="showApproveModal"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.6);"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title">Persetujuan Rencana Belanja Pasar</h5>
              <button type="button" class="btn-close" @click="showApproveModal = false"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <ui-input2
                  v-model="approveBudget"
                  type="number"
                  label="Jumlah Budget yang Disetujui (Rp)"
                  :required="true"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary rounded-1" @click="showApproveModal = false">
                Batal
              </button>
              <button
                type="button"
                class="btn btn-primary rounded-1"
                :disabled="submitting"
                @click="submitApproval"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                Setujui Rencana
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Realisasi -->
      <div
        v-if="showRealizeModal"
        class="modal fade show d-block"
        tabindex="-1"
        style="background: rgba(0, 0, 0, 0.6);"
      >
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title">Realisasi Belanja & Penerimaan Fisik di DC</h5>
              <button type="button" class="btn-close" @click="showRealizeModal = false"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3 mb-3">
                <div class="col-md-4">
                  <ui-input2
                    v-model="realizeForm.receipt_number"
                    label="No. Bukti Terima Gudang (GR)"
                    :required="true"
                  />
                </div>
                <div class="col-md-4">
                  <ui-input2
                    v-model="realizeForm.total_actual_spend"
                    type="number"
                    label="Total Pengeluaran Riil (Rp)"
                    :required="true"
                  />
                </div>
                <div class="col-md-4">
                  <ui-input2
                    v-model="realizeForm.cash_returned_amount"
                    type="number"
                    label="Sisa Uang Muka yang Dikembalikan (Rp)"
                  />
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-sm table-hover align-middle mb-0">
                  <thead>
                    <tr class="text-muted small">
                      <th>Nama Barang</th>
                      <th class="text-end" style="width: 120px;">Target</th>
                      <th class="text-end" style="width: 140px;">Qty Diterima</th>
                      <th class="text-end" style="width: 160px;">Harga Beli Aktual</th>
                      <th style="width: 180px;">Nama Lapak / Pedagang</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(it, idx) in realizeForm.items" :key="idx">
                      <td class="fw-medium">{{ it.product_name }}</td>
                      <td class="text-end">{{ it.target_qty }} {{ it.uom_code }}</td>
                      <td>
                        <input
                          v-model.number="it.actual_qty"
                          type="number"
                          step="any"
                          min="0"
                          class="form-control form-control-sm text-end fw-bold"
                        />
                      </td>
                      <td>
                        <input
                          v-model.number="it.actual_price"
                          type="number"
                          step="any"
                          min="0"
                          class="form-control form-control-sm text-end"
                        />
                      </td>
                      <td>
                        <input
                          v-model="it.vendor_name"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="Lapak H. Jaja..."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary rounded-1" @click="showRealizeModal = false">
                Batal
              </button>
              <button
                type="button"
                class="btn btn-success rounded-1"
                :disabled="submitting"
                @click="submitRealization"
              >
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                Simpan & Tambah ke Stok DC
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  </div>
</template>
