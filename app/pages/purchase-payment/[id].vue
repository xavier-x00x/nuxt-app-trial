<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchasePaymentDetail } from "~/types/purchase-payment";

const route = useRoute();
const id = route.params.id as string;

const payment = ref<PurchasePaymentDetail | null>(null);
const loading = ref(true);

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

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
    case "POSTED":
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
    const res = await useApi<{ data: PurchasePaymentDetail }>(`/purchasing/purchase-payments/${id}`);
    if (res.data?.data) {
      payment.value = res.data.data;
    }
  } catch (err) {
    console.error("Failed to fetch payment detail:", err);
  } finally {
    loading.value = false;
  }
};

const postPayment = async () => {
  if (!confirm("Apakah Anda yakin ingin memposting bukti bayar ini ke kas/bank?")) return;
  const res = await submitForm(`/purchasing/purchase-payments/${id}/post`, { method: "POST" });
  if (res?.success) {
    await fetchDetail();
  }
};

onMounted(() => {
  fetchDetail();
});

useHead({
  title: computed(() => (payment.value ? `Bukti Bayar: ${payment.value.payment_number}` : "Detail Pembayaran")),
});
</script>

<template>
  <div>
    <PageHeader
      :title="payment ? `Bukti Bayar ${payment.payment_number}` : 'Detail Pembayaran'"
      icon="i-tabler:cash"
    >
      <div class="d-flex gap-2">
        <ui-button-back to="/purchase-payment" />
        <button
          v-if="payment && payment.status === 'DRAFT'"
          type="button"
          class="btn btn-success rounded-1"
          :disabled="submitting"
          @click="postPayment"
        >
          <Icon name="i-tabler:check" class="icon icon-2" />
          Posting Pembayaran
        </button>
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted mt-2">Memuat bukti pembayaran...</div>
      </div>

      <div v-else-if="payment" class="row g-3">
        <!-- Header Info -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="card-title mb-0 fw-bold">
                  {{ payment.payment_number }}
                </h3>
                <span :class="['badge fs-4 px-3 py-2', getStatusBadgeClass(payment.status)]">
                  {{ payment.status }}
                </span>
              </div>

              <div class="row g-3">
                <div class="col-md-3">
                  <div class="text-muted small">Supplier</div>
                  <div class="fw-bold">{{ payment.supplier_name }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Tanggal Pembayaran</div>
                  <div>{{ formatDate(payment.payment_date) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Metode Bayar</div>
                  <div class="fw-bold">{{ payment.payment_mode }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">No. Referensi / Transfer</div>
                  <div>{{ payment.reference_no || '-' }}</div>
                </div>

                <div v-if="payment.giro_number" class="col-md-3">
                  <div class="text-muted small">No. Giro</div>
                  <div>{{ payment.giro_number }} (Jatuh tempo: {{ formatDate(payment.giro_due_date || '') }})</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Biaya Admin Bank</div>
                  <div>{{ formatCurrency(Number(payment.admin_fee_amount)) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Diskon Pelunasan</div>
                  <div>{{ formatCurrency(Number(payment.discount_amount)) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Total Dibayarkan</div>
                  <div class="fw-bold text-success fs-3">{{ formatCurrency(Number(payment.total_paid_amount)) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Matched Invoices Table -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent border-bottom">
              <h4 class="card-title mb-0">Faktur yang Dilunasi</h4>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small">
                    <th style="width: 50px;">#</th>
                    <th>No. Faktur Pembelian</th>
                    <th>No. Faktur Supplier</th>
                    <th class="text-end">Total Tagihan</th>
                    <th class="text-end">Sisa Hutang Sebelum Bayar</th>
                    <th class="text-end">Jumlah yang Dibayar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in payment.items" :key="item.id || idx">
                    <td>{{ idx + 1 }}.</td>
                    <td class="fw-medium">{{ item.invoice_number || item.purchase_invoice_id }}</td>
                    <td class="text-muted small">{{ item.supplier_invoice_number || '-' }}</td>
                    <td class="text-end">{{ formatCurrency(Number(item.invoice_total_amount || 0)) }}</td>
                    <td class="text-end">{{ formatCurrency(Number(item.invoice_outstanding_amount || 0)) }}</td>
                    <td class="text-end fw-bold text-success">{{ formatCurrency(Number(item.paid_amount)) }}</td>
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
