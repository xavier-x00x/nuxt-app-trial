<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { GoodsReceiptDetail } from "~/types/goods-receipt";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const title = ref("Detail Penerimaan Barang");
useHead({ title });

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

const gr = ref<GoodsReceiptDetail | null>(null);
const loading = ref(true);

const fetchDetail = async () => {
  loading.value = true;
  const res = await useApi<{ data: GoodsReceiptDetail }>(`/purchasing/goods-receipts/${id}`);
  if (res.data?.data) {
    gr.value = res.data.data;
    title.value = `GR #${gr.value.gr_number}`;
  } else {
    useFlash().setFlash("Data Penerimaan Barang tidak ditemukan", "error");
    router.push("/goods-receipt");
  }
  loading.value = false;
};

onMounted(() => {
  fetchDetail();
});

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

const showConfirmModal = ref(false);
const showCancelModal = ref(false);
const cancelReason = ref("");

const openConfirmModal = () => {
  showConfirmModal.value = true;
};

const openCancelModal = () => {
  cancelReason.value = "";
  showCancelModal.value = true;
};

const handleConfirm = async () => {
  const res = await submitForm(`/purchasing/goods-receipts/${id}/confirm`, {
    method: "POST",
    body: {},
    successMessage: "Penerimaan barang berhasil dikonfirmasi dan stok telah bertambah!",
  });
  if (res && res.status >= 200 && res.status < 300) {
    showConfirmModal.value = false;
    fetchDetail();
  }
};

const handleCancel = async () => {
  const res = await submitForm(`/purchasing/goods-receipts/${id}/cancel`, {
    method: "POST",
    body: { reason: cancelReason.value },
    successMessage: "Penerimaan barang berhasil dibatalkan!",
  });
  if (res && res.status >= 200 && res.status < 300) {
    showCancelModal.value = false;
    fetchDetail();
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:building-warehouse">
      <div class="d-flex gap-2">
        <NuxtLink to="/goods-receipt" class="btn btn-outline-secondary rounded-1">
          <Icon name="i-tabler:arrow-left" class="icon icon-2 me-1" />
          Kembali
        </NuxtLink>

        <template v-if="gr">
          <NuxtLink
            v-if="gr.status === 'DRAFT'"
            :to="gr.purchase_order_id && gr.purchase_order_id !== '00000000-0000-0000-0000-000000000000' ? `/goods-receipt/form?id=${gr.id}` : `/goods-receipt/create-direct?id=${gr.id}`"
            class="btn btn-warning rounded-1"
          >
            <Icon name="i-tabler:pencil" class="icon icon-2 me-1" />
            Edit Draft
          </NuxtLink>

          <button
            v-if="gr.status === 'DRAFT'"
            type="button"
            class="btn btn-success rounded-1"
            :disabled="submitting"
            @click="openConfirmModal"
          >
            <Icon name="i-tabler:check" class="icon icon-2 me-1" />
            Konfirmasi (Confirm)
          </button>

          <button
            v-if="gr.status === 'DRAFT'"
            type="button"
            class="btn btn-danger rounded-1"
            :disabled="submitting"
            @click="openCancelModal"
          >
            <Icon name="i-tabler:x" class="icon icon-2 me-1" />
            Batalkan (Cancel)
          </button>

          <NuxtLink
            :to="`/goods-receipt/print/${gr.id}`"
            class="btn btn-primary rounded-1"
          >
            <Icon name="i-tabler:printer" class="icon icon-2 me-1" />
            Cetak BTB
          </NuxtLink>
        </template>
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status" />
        <div class="mt-2">Memuat detail penerimaan barang...</div>
      </div>

      <div v-else-if="gr" class="row">
        <!-- Summary Info -->
        <div class="col-12 mb-3">
          <div class="card">
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <table class="table table-borderless table-sm">
                    <tbody>
                      <tr>
                        <td width="35%" class="fw-bold">No. Penerimaan</td>
                        <td>: {{ gr.gr_number }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold">No. PO Referensi</td>
                        <td>
                          : 
                          <NuxtLink :to="`/purchase-order/${gr.purchase_order_id}`" class="text-decoration-none">
                            {{ gr.po_number }}
                          </NuxtLink>
                        </td>
                      </tr>
                      <tr>
                        <td class="fw-bold">Tanggal Penerimaan</td>
                        <td>: {{ formatDate(gr.receipt_date, false) }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold">No. Surat Jalan (Delivery Note)</td>
                        <td>: {{ gr.delivery_note_no || '-' }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold">Status</td>
                        <td>
                          : <span :class="['badge', getStatusBadgeClass(gr.status)]">{{ gr.status }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="col-md-6">
                  <table class="table table-borderless table-sm">
                    <tbody>
                      <tr>
                        <td width="35%" class="fw-bold">Supplier</td>
                        <td>: {{ gr.supplier_name }} ({{ gr.supplier_code }})</td>
                      </tr>
                      <tr>
                        <td class="fw-bold">Gudang Penerima</td>
                        <td>: {{ gr.warehouse_name }}</td>
                      </tr>
                      <tr>
                        <td class="fw-bold">Diterima Oleh</td>
                        <td>: {{ gr.store_name }} (Staf Gudang)</td>
                      </tr>
                      <tr>
                        <td class="fw-bold">Override Otorisasi PIN</td>
                        <td>
                          : 
                          <span v-if="gr.is_over_received_override" class="badge bg-purple text-white">YA (Over-received)</span>
                          <span v-else>TIDAK</span>
                        </td>
                      </tr>
                      <tr>
                        <td class="fw-bold">Catatan</td>
                        <td>: {{ gr.notes || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Daftar Barang yang Diterima</h3>
            </div>
            <div class="table-responsive">
              <table class="table card-table table-vcenter text-nowrap datatable">
                <thead>
                  <tr>
                    <th class="w-1">No</th>
                    <th>Nama Produk</th>
                    <th>SKU</th>
                    <th class="text-center">Qty Dipesan</th>
                    <th class="text-center">Qty Diterima</th>
                    <th class="text-center">Qty Ditolak</th>
                    <th>Satuan</th>
                    <th>Alasan Ditolak / Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in gr.items" :key="item.id">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ item.product_name }}</td>
                    <td>{{ item.product_sku }}</td>
                    <td class="text-center">{{ item.qty_ordered }}</td>
                    <td class="text-center text-success fw-bold">{{ item.qty_received }}</td>
                    <td class="text-center text-danger">{{ item.qty_rejected }}</td>
                    <td>{{ item.uom_code }}</td>
                    <td>{{ item.reject_reason || item.notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageBody>

    <!-- Confirm Modal -->
    <div class="modal modal-blur fade" :class="{ show: showConfirmModal }" :style="{ display: showConfirmModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" aria-label="Close" @click="showConfirmModal = false"></button>
          <div class="modal-status bg-success"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:check" class="icon mb-2 text-green icon-lg" style="font-size: 3rem;" />
            <h3>Konfirmasi Penerimaan Barang</h3>
            <div class="text-muted">
              Apakah Anda yakin ingin menyelesaikan penerimaan barang ini? Stok fisik di sistem akan bertambah secara permanen.
            </div>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showConfirmModal = false">Batal</button></div>
                <div class="col"><button type="button" class="btn btn-success w-100" :disabled="submitting" @click="handleConfirm">Ya, Konfirmasi</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showConfirmModal" class="modal-backdrop fade show"></div>

    <!-- Cancel Modal -->
    <div class="modal modal-blur fade" :class="{ show: showCancelModal }" :style="{ display: showCancelModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" aria-label="Close" @click="showCancelModal = false"></button>
          <div class="modal-status bg-danger"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:x" class="icon mb-2 text-danger icon-lg" style="font-size: 3rem;" />
            <h3>Batalkan Penerimaan Barang</h3>
            <div class="text-muted mb-3">
              Apakah Anda yakin ingin membatalkan penerimaan barang ini? Silakan masukkan alasan pembatalan.
            </div>
            <textarea v-model="cancelReason" class="form-control" placeholder="Alasan pembatalan..." rows="3"></textarea>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showCancelModal = false">Tutup</button></div>
                <div class="col">
                  <button 
                    type="button" 
                    class="btn btn-danger w-100" 
                    :disabled="submitting || !cancelReason.trim()" 
                    @click="handleCancel"
                  >
                    Ya, Batalkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCancelModal" class="modal-backdrop fade show"></div>
  </div>
</template>
