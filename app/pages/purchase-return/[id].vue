<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchaseReturnDetail } from "~/types/purchase-return";

const route = useRoute();
const id = route.params.id as string;

const retur = ref<PurchaseReturnDetail | null>(null);
const loading = ref(true);

const { formatDate } = useDateFormatter();

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
    case "CONFIRMED":
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
    const res = await useApi<{ data: PurchaseReturnDetail }>(`/purchasing/purchase-returns/${id}`);
    if (res.data?.data) {
      retur.value = res.data.data;
    }
  } catch (err) {
    console.error("Failed to fetch return detail:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDetail();
});

useHead({
  title: computed(() => (retur.value ? `Retur: ${retur.value.return_number}` : "Detail Retur Pembelian")),
});
</script>

<template>
  <div>
    <PageHeader
      :title="retur ? `Retur ${retur.return_number}` : 'Detail Retur Pembelian'"
      icon="i-tabler:arrow-back-up"
    >
      <div class="d-flex gap-2">
        <ui-button-back to="/purchase-return" />
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted mt-2">Memuat data retur...</div>
      </div>

      <div v-else-if="retur" class="row g-3">
        <!-- Header Info -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="card-title mb-0 fw-bold">
                  {{ retur.return_number }}
                </h3>
                <span :class="['badge fs-4 px-3 py-2', getStatusBadgeClass(retur.status)]">
                  {{ retur.status }}
                </span>
              </div>

              <div class="row g-3">
                <div class="col-md-4">
                  <div class="text-muted small">No. Faktur Pembelian</div>
                  <div class="fw-bold">{{ retur.invoice_number || retur.purchase_invoice_id }}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-muted small">Tanggal Retur</div>
                  <div>{{ formatDate(retur.return_date) }}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-muted small">Total Nilai Retur</div>
                  <div class="fw-bold text-danger fs-3">{{ formatCurrency(Number(retur.total_amount)) }}</div>
                </div>
                <div v-if="retur.notes" class="col-12">
                  <div class="text-muted small">Alasan / Catatan Retur</div>
                  <div>{{ retur.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent border-bottom">
              <h4 class="card-title mb-0">Rincian Barang yang Diretur</h4>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small">
                    <th style="width: 50px;">#</th>
                    <th>Nama Produk</th>
                    <th class="text-end">Qty Retur</th>
                    <th>Satuan</th>
                    <th class="text-end">Harga Satuan</th>
                    <th class="text-end">Diskon</th>
                    <th class="text-end">Total Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in retur.items" :key="item.id || idx">
                    <td>{{ idx + 1 }}.</td>
                    <td class="fw-medium">{{ item.product_name || item.product_id }}</td>
                    <td class="text-end fw-bold text-danger">{{ item.qty_return }}</td>
                    <td>{{ item.uom_name || item.uom_id }}</td>
                    <td class="text-end">{{ formatCurrency(Number(item.unit_price)) }}</td>
                    <td class="text-end text-muted">{{ formatCurrency(Number(item.discount_amount)) }}</td>
                    <td class="text-end fw-bold">
                      {{ formatCurrency((Number(item.qty_return) * Number(item.unit_price)) - Number(item.discount_amount)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  </div>
</template>
