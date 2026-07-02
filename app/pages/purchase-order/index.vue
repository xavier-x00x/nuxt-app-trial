<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { PurchaseOrderList } from "~/types/purchase-order";

const title = "Purchase Order";
useHead({ title });

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

const columns: Column<PurchaseOrderList>[] = [
  {
    key: "po_number",
    label: "No. PO",
    width: "15%",
  },
  {
    key: "order_date",
    label: "Tanggal",
    width: "12%",
  },
  {
    key: "supplier_name",
    label: "Supplier",
  },
  {
    key: "store_name",
    label: "Toko",
  },
  {
    key: "total_amount",
    label: "Total Nilai",
    className: "text-end",
  },
  {
    key: "status",
    label: "Status",
    className: "text-center",
    width: "12%",
  },
];

const tableRef = ref();

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

const showBatchSubmitModal = ref(false);
const showBatchApproveModal = ref(false);
const pendingBatchIds = ref<string[]>([]);
const pendingClearSelection = ref<(() => void) | null>(null);

const handleBatchSubmit = async (selectedRows: PurchaseOrderList[], clearSelection: () => void) => {
  const draftRows = selectedRows.filter((r) => r.status === "DRAFT");
  if (draftRows.length === 0) {
    useFlash().setFlash("Pilih setidaknya satu PO berkategori DRAFT untuk diajukan (Submit).", "info");
    return;
  }
  pendingBatchIds.value = draftRows.map((r) => r.id);
  pendingClearSelection.value = clearSelection;
  showBatchSubmitModal.value = true;
};

const executeBatchSubmit = async () => {
  const res = await submitForm("/purchase-orders/batch-submit", {
    method: "POST",
    body: { ids: pendingBatchIds.value },
    successMessage: `Berhasil mengajukan ${pendingBatchIds.value.length} PO!`,
  });

  if (res && res.status >= 200 && res.status < 300) {
    showBatchSubmitModal.value = false;
    pendingClearSelection.value?.();
    tableRef.value?.reload();
  }
};

const handleBatchApprove = async (selectedRows: PurchaseOrderList[], clearSelection: () => void) => {
  const submittedRows = selectedRows.filter((r) => r.status === "SUBMITTED");
  if (submittedRows.length === 0) {
    useFlash().setFlash("Pilih setidaknya satu PO berkategori SUBMITTED untuk disetujui (Approve).", "info");
    return;
  }
  pendingBatchIds.value = submittedRows.map((r) => r.id);
  pendingClearSelection.value = clearSelection;
  showBatchApproveModal.value = true;
};

const executeBatchApprove = async () => {
  const res = await submitForm("/purchase-orders/batch-approve", {
    method: "POST",
    body: { ids: pendingBatchIds.value },
    successMessage: `Berhasil menyetujui ${pendingBatchIds.value.length} PO!`,
  });

  if (res && res.status >= 200 && res.status < 300) {
    showBatchApproveModal.value = false;
    pendingClearSelection.value?.();
    tableRef.value?.reload();
  }
};

const options = {
  columns,
  ajax: {
    url: `/purchase-orders/pagination`,
  },
  pathKey: "purchase_orders",
  showActions: true,
  selectable: true,
  actionWidth: "15%",
};

const summaryData = computed(() => {
  if (!tableRef.value || !tableRef.value.rows) return [];
  const rows = tableRef.value.rows as PurchaseOrderList[];
  const grouped = rows.reduce((acc, row) => {
    const stat = acc[row.status] || { count: 0, total: 0 };
    stat.count += 1;
    stat.total += Number(row.total_amount || 0);
    acc[row.status] = stat;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED", "CANCELLED"];
  return statuses.map(s => ({
    status: s,
    count: grouped[s]?.count || 0,
    total: grouped[s]?.total || 0,
    badgeClass: getStatusBadgeClass(s)
  })).filter(s => s.count > 0);
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:shopping-cart">
      <NuxtLink to="/purchase-order/form" class="btn btn-primary rounded-1">
        <Icon name="i-tabler:plus" class="icon icon-2 me-1" />
        Buat PO Manual
      </NuxtLink>
    </PageHeader>
    <PageBody>
      <!-- Summary Cards -->
      <div v-if="summaryData.length > 0" class="row row-cards mb-3">
        <div v-for="item in summaryData" :key="item.status" class="col-sm-6 col-md-4 col-xl-3">
          <div class="card card-sm">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-auto">
                  <span :class="['badge', item.badgeClass, 'px-2', 'py-1', 'fs-5']">{{ item.status }}</span>
                </div>
                <div class="col">
                  <div class="fw-bold">
                    {{ item.count }} Dokumen
                  </div>
                  <div class="text-muted fw-bold">
                    {{ formatCurrency(item.total) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataTable3 ref="tableRef" :options="options">
        <template #batch-actions="{ selectedRows, clearSelection }">
          <div v-if="selectedRows.length > 0" class="d-flex align-items-center gap-2">
            <span class="badge bg-blue-lt px-2 py-1 fs-6">
              {{ selectedRows.length }} PO Terpilih
            </span>
            <button
              type="button"
              class="btn btn-sm btn-primary rounded-1"
              :disabled="submitting"
              @click="handleBatchSubmit(selectedRows as any, clearSelection)"
            >
              <Icon name="i-tabler:send" class="icon me-1" />
              Batch Submit
            </button>
            <button
              type="button"
              class="btn btn-sm btn-success rounded-1"
              :disabled="submitting"
              @click="handleBatchApprove(selectedRows as any, clearSelection)"
            >
              <Icon name="i-tabler:check" class="icon me-1" />
              Batch Approve
            </button>
          </div>
        </template>

        <template #cell-order_date="{ value }">
          {{ formatDate(value as string,false) }}
        </template>

        <template #cell-total_amount="{ value }">
          {{ formatCurrency(Number(value)) }}
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <!-- row actions -->
        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/purchase-order/${row.id}`"
              class="btn btn-sm btn-outline-secondary py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:eye" class="icon icon-2" />
              Detail
            </NuxtLink>
            <NuxtLink
              v-if="row.status === 'DRAFT'"
              :to="`/purchase-order/form?id=${row.id}`"
              class="btn btn-sm btn-outline-info py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:pencil" class="icon icon-2" />
              Edit
            </NuxtLink>
          </div>
        </template>
      </DataTable3>
    </PageBody>

    <!-- Batch Submit Modal -->
    <div class="modal modal-blur fade" :class="{ show: showBatchSubmitModal }" :style="{ display: showBatchSubmitModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" @click="showBatchSubmitModal = false" aria-label="Close"></button>
          <div class="modal-status bg-primary"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:send" class="icon mb-2 text-primary icon-lg" style="font-size: 3rem;" />
            <h3>Konfirmasi Batch Submit</h3>
            <div class="text-muted">
              Apakah Anda yakin ingin mengajukan (Submit) {{ pendingBatchIds.length }} PO yang terpilih?
            </div>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showBatchSubmitModal = false">Batal</button></div>
                <div class="col"><button type="button" class="btn btn-primary w-100" @click="executeBatchSubmit" :disabled="submitting">Ya, Submit</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showBatchSubmitModal" class="modal-backdrop fade show"></div>

    <!-- Batch Approve Modal -->
    <div class="modal modal-blur fade" :class="{ show: showBatchApproveModal }" :style="{ display: showBatchApproveModal ? 'block' : 'none' }" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-sm modal-dialog-centered" role="document">
        <div class="modal-content">
          <button type="button" class="btn-close" @click="showBatchApproveModal = false" aria-label="Close"></button>
          <div class="modal-status bg-success"></div>
          <div class="modal-body text-center py-4">
            <Icon name="i-tabler:check" class="icon mb-2 text-green icon-lg" style="font-size: 3rem;" />
            <h3>Konfirmasi Batch Approve</h3>
            <div class="text-muted">
              Apakah Anda yakin ingin menyetujui (Approve) {{ pendingBatchIds.length }} PO yang terpilih?
            </div>
          </div>
          <div class="modal-footer">
            <div class="w-100">
              <div class="row">
                <div class="col"><button type="button" class="btn w-100" @click="showBatchApproveModal = false">Batal</button></div>
                <div class="col"><button type="button" class="btn btn-success w-100" @click="executeBatchApprove" :disabled="submitting">Ya, Approve</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showBatchApproveModal" class="modal-backdrop fade show"></div>

  </div>
</template>

<style scoped>
.btn-sm-custom {
    padding: 0.3125rem 0.5rem !important;
    font-size: 0.75rem !important;
    border-radius: var(--tblr-border-radius-sm) !important;
}
</style>
