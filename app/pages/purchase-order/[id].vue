<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchaseOrderDetail } from "~/types/purchase-order";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const title = ref("Detail Purchase Order");
useHead({ title });

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

const po = ref<PurchaseOrderDetail | null>(null);
const loading = ref(true);

const fetchDetail = async () => {
  loading.value = true;
  const res = await useApi<{ data: PurchaseOrderDetail }>(`/purchase-orders/${id}`);
  if (res.data?.data) {
    po.value = res.data.data;
    title.value = `PO #${po.value.po_number}`;
  } else {
    useFlash().setFlash("Data Purchase Order tidak ditemukan", "error");
    router.push("/purchase-order");
  }
  loading.value = false;
};

onMounted(() => {
  fetchDetail();
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
    case "SUBMITTED":
      return "bg-warning text-dark";
    case "APPROVED":
      return "bg-info text-white";
    case "PARTIALLY_RECEIVED":
      return "bg-primary text-white";
    case "RECEIVED":
      return "bg-success text-white";
    case "CLOSED":
      return "bg-dark text-white";
    case "CANCELLED":
      return "bg-danger text-white";
    default:
      return "bg-secondary text-white";
  }
};

const showSubmitModal = ref(false);
const showApproveModal = ref(false);

const openSubmitModal = () => {
  showSubmitModal.value = true;
};

const openApproveModal = () => {
  showApproveModal.value = true;
};

const handleSubmit = async () => {
  const res = await submitForm(`/purchase-orders/${id}/submit`, {
    method: "POST",
    successMessage: "PO berhasil diajukan (Submitted)!",
  });
  if (res && res.status >= 200 && res.status < 300) {
    showSubmitModal.value = false;
    fetchDetail();
  }
};

const handleApprove = async () => {
  const res = await submitForm(`/purchase-orders/${id}/approve`, {
    method: "POST",
    successMessage: "PO berhasil disetujui (Approved)!",
  });
  if (res && res.status >= 200 && res.status < 300) {
    showApproveModal.value = false;
    fetchDetail();
  }
};

const cancelReason = ref("");
const showCancelModal = ref(false);

const openCancelModal = () => {
  cancelReason.value = "";
  showCancelModal.value = true;
};

const handleCancel = async () => {
  if (!cancelReason.value) {
    alert("Alasan pembatalan wajib diisi");
    return;
  }
  const res = await submitForm(`/purchase-orders/cancel`, {
    method: "POST",
    body: {
      id,
      reason: cancelReason.value,
    },
    successMessage: "PO berhasil dibatalkan!",
  });
  if (res && res.status >= 200 && res.status < 300) {
    showCancelModal.value = false;
    fetchDetail();
  }
};
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:shopping-cart">
      <div class="d-flex gap-2">
        <NuxtLink to="/purchase-order" class="btn btn-outline-secondary rounded-1">
          <Icon name="i-tabler:arrow-left" class="icon icon-2 me-1" />
          Kembali
        </NuxtLink>

        <template v-if="po">
          <NuxtLink
            v-if="po.status === 'DRAFT'"
            :to="`/purchase-order/form?id=${po.id}`"
            class="btn btn-warning rounded-1"
          >
            <Icon name="i-tabler:pencil" class="icon icon-2 me-1" />
            Edit PO
          </NuxtLink>

          <button
            v-if="po.status === 'DRAFT'"
            type="button"
            class="btn btn-primary rounded-1"
            :disabled="submitting"
            @click="openSubmitModal"
          >
            <Icon name="i-tabler:send" class="icon icon-2 me-1" />
            Submit PO
          </button>

          <button
            v-if="po.status === 'SUBMITTED'"
            type="button"
            class="btn btn-success rounded-1"
            :disabled="submitting"
            @click="openApproveModal"
          >
            <Icon name="i-tabler:check" class="icon icon-2 me-1" />
            Approve PO
          </button>

          <button
            v-if="['DRAFT', 'SUBMITTED', 'APPROVED'].includes(po.status)"
            type="button"
            class="btn btn-danger rounded-1"
            :disabled="submitting"
            @click="openCancelModal"
          >
            <Icon name="i-tabler:x" class="icon icon-2 me-1" />
            Batalkan PO
          </button>

          <NuxtLink
            :to="`/purchase-order/print/${po.id}`"
            class="btn btn-outline-primary rounded-1"
          >
            <Icon name="i-tabler:printer" class="icon icon-2 me-1" />
            Cetak PO
          </NuxtLink>
        </template>
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Memuat data Purchase Order...</div>
      </div>

      <div v-else-if="po" class="row g-3">
        <!-- Header Info Card -->
        <div class="col-12">
          <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3 class="card-title mb-0">Informasi Dokumen</h3>
              <span :class="['badge fs-6 px-3 py-2', getStatusBadgeClass(po.status)]">
                {{ po.status }}
              </span>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-3">
                  <div class="text-muted small">Nomor PO</div>
                  <div class="fw-bold fs-5 text-primary">{{ po.po_number }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Nomor Referensi</div>
                  <div class="fw-semibold">{{ po.reference_no || '-' }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Tanggal Pesanan</div>
                  <div class="fw-semibold">{{ formatDate(po.order_date,false) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Estimasi Pengiriman</div>
                  <div class="fw-semibold">{{ po.expected_delivery ? formatDate(po.expected_delivery,false) : '-' }}</div>
                </div>

                <hr class="my-2 text-muted opacity-25" />

                <div class="col-md-4">
                  <div class="text-muted small">Supplier</div>
                  <div class="fw-bold">{{ po.supplier_name }}</div>
                  <div class="text-muted small">{{ po.supplier_code }}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-muted small">Toko Pemesan</div>
                  <div class="fw-bold">{{ po.store_name }}</div>
                  <div class="text-muted small">{{ po.store_code }}</div>
                </div>
                <div class="col-md-4">
                  <div class="text-muted small">Gudang Tujuan</div>
                  <div class="fw-bold">{{ po.warehouse_name }}</div>
                </div>

                <hr class="my-2 text-muted opacity-25" />

                <div class="col-md-3">
                  <div class="text-muted small">Termin Pembayaran</div>
                  <div>{{ po.payment_term_days }} Hari</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Mode Pembayaran</div>
                  <div>{{ po.payment_mode }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Dibuat Oleh</div>
                  <div>{{ po.created_by_name }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Disetujui Oleh</div>
                  <div>{{ po.approved_by_name || '-' }}</div>
                </div>

                <div v-if="po.notes" class="col-12 mt-2">
                  <div class="text-muted small">Catatan Internal</div>
                  <div class="p-2 bg-light rounded border">{{ po.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table Card -->
        <div class="col-12">
          <div class="card shadow-sm">
            <div class="card-header">
              <h3 class="card-title mb-0">Rincian Barang Pesanan</h3>
            </div>
            <div class="table-responsive">
              <table class="table table-vcenter table-hover card-table">
                <thead>
                  <tr>
                    <th style="width: 40px" class="text-center">#</th>
                    <th>Produk / SKU</th>
                    <th>Satuan (UOM)</th>
                    <th class="text-end">Qty Dipesan</th>
                    <th class="text-end">Qty Diterima</th>
                    <th class="text-end">Harga Satuan</th>
                    <th class="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in po.items" :key="item.id || idx">
                    <td class="text-center text-muted">{{ idx + 1 }}</td>
                    <td>
                      <div class="fw-bold">{{ item.product_name }}</div>
                      <div class="text-muted small">SKU: {{ item.product_sku }}</div>
                      <div v-if="item.notes" class="text-muted small italic">Note: {{ item.notes }}</div>
                    </td>
                    <td>{{ item.uom_name }}</td>
                    <td class="text-end fw-semibold">{{ item.qty_ordered }}</td>
                    <td class="text-end text-muted">{{ item.qty_received || 0 }}</td>
                    <td class="text-end">{{ formatCurrency(item.unit_price) }}</td>
                    <td class="text-end fw-bold text-primary">{{ formatCurrency(item.subtotal || (item.qty_ordered * item.unit_price)) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="bg-light">
                    <td colspan="6" class="text-end text-muted fw-semibold">Subtotal:</td>
                    <td class="text-end text-primary fw-semibold">{{ formatCurrency(Number(po.total_amount) + Number(po.promo_marketing_discount_amount || 0)) }}</td>
                  </tr>
                  <tr v-if="Number(po.promo_marketing_discount_percentage || 0) > 0" class="bg-light">
                    <td colspan="6" class="text-end text-danger fw-semibold">
                      Promo Marketing Discount ({{ po.promo_marketing_discount_percentage }}%):
                    </td>
                    <td class="text-end text-danger fw-semibold">-{{ formatCurrency(po.promo_marketing_discount_amount) }}</td>
                  </tr>
                  <tr class="bg-light">
                    <td colspan="6" class="text-end text-dark fw-bold fs-5">Total Amount:</td>
                    <td class="text-end fw-bold fs-4 text-success">{{ formatCurrency(po.total_amount) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageBody>

    <!-- Cancel Modal -->
    <div v-if="showCancelModal" class="modal modal-blur fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Pembatalan Purchase Order</h5>
            <button type="button" class="btn-close" @click="showCancelModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label required">Alasan Pembatalan</label>
              <textarea
                v-model="cancelReason"
                class="form-control"
                rows="3"
                placeholder="Masukkan alasan pembatalan PO ini..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-link link-secondary me-auto" @click="showCancelModal = false">
              Batal
            </button>
            <button type="button" class="btn btn-danger" :disabled="submitting" @click="handleCancel">
              Konfirmasi Batalkan PO
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Modal -->
    <div class="modal modal-blur fade" :class="{ show: showSubmitModal }" :style="{ display: showSubmitModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" @click="showSubmitModal = false" aria-label="Close"></button>
          <div class="modal-status bg-primary"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:send" class="icon mb-2 text-primary icon-lg" style="font-size: 3rem;" />
            <h3>Konfirmasi Submit</h3>
            <div class="text-muted">
              Apakah Anda yakin ingin mengajukan (Submit) PO ini? Dokumen yang telah di-submit akan diteruskan untuk proses persetujuan (Approval).
            </div>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showSubmitModal = false">Batal</button></div>
                <div class="col"><button type="button" class="btn btn-primary w-100" @click="handleSubmit" :disabled="submitting">Ya, Submit</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showSubmitModal" class="modal-backdrop fade show"></div>

    <!-- Approve Modal -->
    <div class="modal modal-blur fade" :class="{ show: showApproveModal }" :style="{ display: showApproveModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" @click="showApproveModal = false" aria-label="Close"></button>
          <div class="modal-status bg-success"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:check" class="icon mb-2 text-green icon-lg" style="font-size: 3rem;" />
            <h3>Konfirmasi Approve</h3>
            <div class="text-muted">
              Apakah Anda yakin ingin menyetujui (Approve) PO ini?
            </div>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showApproveModal = false">Batal</button></div>
                <div class="col"><button type="button" class="btn btn-success w-100" @click="handleApprove" :disabled="submitting">Ya, Approve</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showApproveModal" class="modal-backdrop fade show"></div>
  </div>
</template>
