<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { PurchaseInvoiceDetail } from "~/types/purchase-invoice";

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const invoice = ref<PurchaseInvoiceDetail | null>(null);
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
      return "bg-primary text-white";
    case "PARTIALLY_PAID":
      return "bg-warning text-dark";
    case "PAID":
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
    const res = await useApi<{ data: PurchaseInvoiceDetail }>(`/purchasing/purchase-invoices/${id}`);
    if (res.data?.data) {
      invoice.value = res.data.data;
    }
  } catch (err) {
    console.error("Failed to fetch purchase invoice detail:", err);
  } finally {
    loading.value = false;
  }
};

const postInvoice = async () => {
  if (!confirm("Apakah Anda yakin ingin memposting faktur ini ke buku besar?")) return;
  const res = await submitForm(`/purchasing/purchase-invoices/${id}/post`, { method: "POST" });
  if (res?.success) {
    await fetchDetail();
  }
};

onMounted(() => {
  fetchDetail();
});

useHead({
  title: computed(() => (invoice.value ? `Faktur: ${invoice.value.invoice_number}` : "Detail Faktur Pembelian")),
});
</script>

<template>
  <div>
    <PageHeader
      :title="invoice ? `Faktur ${invoice.invoice_number}` : 'Detail Faktur Pembelian'"
      icon="i-tabler:file-invoice"
    >
      <div class="d-flex gap-2">
        <ui-button-back to="/purchase-invoice" />
        <button
          v-if="invoice && invoice.status === 'DRAFT'"
          type="button"
          class="btn btn-success rounded-1"
          :disabled="submitting"
          @click="postInvoice"
        >
          <Icon name="i-tabler:check" class="icon icon-2" />
          Posting Faktur
        </button>
      </div>
    </PageHeader>

    <PageBody>
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted mt-2">Memuat data faktur...</div>
      </div>

      <div v-else-if="invoice" class="row g-3">
        <!-- Header Info -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="card-title mb-0 fw-bold">
                  {{ invoice.invoice_number }}
                </h3>
                <span :class="['badge fs-4 px-3 py-2', getStatusBadgeClass(invoice.status)]">
                  {{ invoice.status }}
                </span>
              </div>

              <div class="row g-3">
                <div class="col-md-3">
                  <div class="text-muted small">No. Faktur Supplier</div>
                  <div class="fw-bold">{{ invoice.supplier_invoice_number || '-' }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Supplier</div>
                  <div class="fw-bold">{{ invoice.supplier_name }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Tanggal Faktur</div>
                  <div>{{ formatDate(invoice.invoice_date) }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Jatuh Tempo</div>
                  <div>{{ formatDate(invoice.due_date) }}</div>
                </div>

                <div class="col-md-3">
                  <div class="text-muted small">Cabang / Toko</div>
                  <div>{{ invoice.store_name || '-' }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Gudang</div>
                  <div>{{ invoice.warehouse_name || '-' }}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">Syarat Pembayaran</div>
                  <div>{{ invoice.payment_mode }} ({{ invoice.payment_term_days }} Hari)</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted small">No. Referensi PO</div>
                  <div>{{ invoice.po_number || invoice.purchase_order_id }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="col-12">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent border-bottom">
              <h4 class="card-title mb-0">Rincian Barang</h4>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small">
                    <th style="width: 50px;">#</th>
                    <th>Nama Barang</th>
                    <th>SKU</th>
                    <th class="text-end">Qty</th>
                    <th>Satuan</th>
                    <th class="text-end">Harga Satuan</th>
                    <th class="text-end">Diskon</th>
                    <th class="text-end">Pajak (%)</th>
                    <th class="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in invoice.items" :key="item.id || idx">
                    <td>{{ idx + 1 }}.</td>
                    <td class="fw-medium">{{ item.product_name || item.product_id }}</td>
                    <td class="text-muted small">{{ item.product_sku || '-' }}</td>
                    <td class="text-end fw-bold">{{ item.qty_invoiced }}</td>
                    <td>{{ item.uom_name || item.uom_id }}</td>
                    <td class="text-end">{{ formatCurrency(Number(item.unit_price)) }}</td>
                    <td class="text-end text-danger">-{{ formatCurrency(Number(item.discount_amount)) }}</td>
                    <td class="text-end">{{ item.tax_pct }}%</td>
                    <td class="text-end fw-bold">
                      {{ formatCurrency((Number(item.qty_invoiced) * Number(item.unit_price)) - Number(item.discount_amount)) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Financial Summary Footer -->
            <div class="card-footer bg-transparent border-top p-4">
              <div class="row justify-content-end">
                <div class="col-md-5">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Subtotal:</span>
                    <span class="fw-medium">{{ formatCurrency(Number(invoice.subtotal_amount)) }}</span>
                  </div>
                  <div v-if="Number(invoice.discount_amount) > 0" class="d-flex justify-content-between mb-2 text-danger">
                    <span>Diskon Global:</span>
                    <span>-{{ formatCurrency(Number(invoice.discount_amount)) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Pajak (PPN):</span>
                    <span>{{ formatCurrency(Number(invoice.tax_amount)) }}</span>
                  </div>
                  <div v-if="Number(invoice.freight_amount) > 0" class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Ongkir / Ekspedisi:</span>
                    <span>{{ formatCurrency(Number(invoice.freight_amount)) }}</span>
                  </div>
                  <hr class="my-2" />
                  <div class="d-flex justify-content-between mb-2 fs-3">
                    <span class="fw-bold">Total Tagihan:</span>
                    <span class="fw-bold text-primary">{{ formatCurrency(Number(invoice.total_amount)) }}</span>
                  </div>
                  <div class="d-flex justify-content-between fs-4">
                    <span class="text-muted">Sisa Hutang:</span>
                    <span :class="Number(invoice.outstanding_amount) > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'">
                      {{ formatCurrency(Number(invoice.outstanding_amount)) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  </div>
</template>
