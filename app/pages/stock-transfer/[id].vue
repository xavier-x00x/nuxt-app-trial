<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { StockTransferDetail } from "~/types/stock-transfer";

const route = useRoute();
const id = route.params.id as string;

const transfer = ref<StockTransferDetail | null>(null);
const loading = ref(true);

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-secondary text-white";
    case "SHIPPED":
      return "bg-warning text-dark";
    case "RECEIVED":
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
    const res = await useApi<{ data: StockTransferDetail }>(`/inventory/stock-transfers/${id}`);
    if (res.data?.data) {
      transfer.value = res.data.data;
    }
  } catch (err) {
    console.error("Failed to fetch stock transfer detail:", err);
  } finally {
    loading.value = false;
  }
};

const shipTransfer = async () => {
  if (!confirm("Konfirmasi pengiriman barang dari gudang asal? Stok akan dipindahkan ke status transit.")) return;
  const res = await submitForm(`/inventory/stock-transfers/${id}/ship`, { method: "POST" });
  if (res?.success) {
    await fetchDetail();
  }
};

const receiveTransfer = async () => {
  if (!confirm("Konfirmasi penerimaan barang di gudang tujuan? Stok akan ditambahkan ke gudang tujuan.")) return;
  const res = await submitForm(`/inventory/stock-transfers/${id}/receive`, { method: "POST" });
  if (res?.success) {
    await fetchDetail();
  }
};

onMounted(() => {
  fetchDetail();
});

useHead({
  title: computed(() => (transfer.value ? `Transfer: ${transfer.value.transfer_number}` : "Detail Transfer Stok")),
});
</script>

<template>
  <div>
    <PageHeader
      :title="transfer ? `Transfer ${transfer.transfer_number}` : 'Detail Transfer Stok'"
      icon="i-tabler:arrows-transfer-down"
    >
      <div class="d-flex gap-2">
        <ui-button-back to="/stock-transfer" />
        <button
          v-if="transfer && transfer.status === 'DRAFT'"
          type="button"
          class="btn btn-warning rounded-1 text-dark"
          :disabled="submitting"
          @click="shipTransfer"
        >
          <Icon name="i-tabler:truck" class="icon icon-2" />
          Kirim Barang (Ship)
        </button>
        <button
          v-if="transfer && transfer.status === 'SHIPPED'"
          type="button"
          class="btn btn-success rounded-1"
          :disabled="submitting"
          @click="receiveTransfer"
        >
          <Icon name="i-tabler:check" class="icon icon-2" />
          Terima Barang (Receive)
        </button>
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted mt-2">Memuat data transfer stok...</div>
      </div>

      <div v-else-if="transfer" class="row g-3">
        <!-- Header Info -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="card-title mb-0 fw-bold">
                  {{ transfer.transfer_number }}
                </h3>
                <span :class="['badge fs-4 px-3 py-2', getStatusBadgeClass(transfer.status)]">
                  {{ transfer.status }}
                </span>
              </div>

              <div class="row g-3">
                <div class="col-md-3">
                  <div class="text-muted small">Gudang Asal</div>
                  <div class="fw-bold">{{ transfer.from_warehouse_name || transfer.from_warehouse_id }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Gudang Tujuan</div>
                  <div class="fw-bold">{{ transfer.to_warehouse_name || transfer.to_warehouse_id }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Tanggal Transfer</div>
                  <div>{{ formatDate(transfer.transfer_date) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Driver / Kendaraan</div>
                  <div>{{ transfer.driver_name || '-' }} ({{ transfer.vehicle_number || '-' }})</div>
                </div>
                <div v-if="transfer.notes" class="col-12">
                  <div class="text-muted small">Catatan Transfer</div>
                  <div>{{ transfer.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent border-bottom">
              <h4 class="card-title mb-0">Daftar Barang Transfer</h4>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small">
                    <th style="width: 50px;">#</th>
                    <th>Nama Barang</th>
                    <th>Satuan</th>
                    <th class="text-end">Qty Permintaan</th>
                    <th class="text-end">Qty Dikirim</th>
                    <th class="text-end">Qty Diterima</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in transfer.items" :key="item.id || idx">
                    <td>{{ idx + 1 }}.</td>
                    <td class="fw-medium">{{ item.product_name }}</td>
                    <td>{{ item.uom_code }}</td>
                    <td class="text-end">{{ item.qty_requested }}</td>
                    <td class="text-end fw-bold text-warning">{{ item.qty_sent }}</td>
                    <td class="text-end fw-bold text-success">{{ item.qty_received ?? '-' }}</td>
                    <td class="text-muted small">{{ item.notes || '-' }}</td>
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
