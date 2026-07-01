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

const handleBatchSubmit = async (selectedRows: PurchaseOrderList[], clearSelection: () => void) => {
  const draftRows = selectedRows.filter((r) => r.status === "DRAFT");
  if (draftRows.length === 0) {
    alert("Pilih setidaknya satu PO berkategori DRAFT untuk diajukan (Submit).");
    return;
  }
  if (!confirm(`Apakah Anda yakin ingin mengajukan (Submit) ${draftRows.length} PO yang terpilih?`)) return;

  const res = await submitForm("/purchase-orders/batch-submit", {
    method: "POST",
    body: { ids: draftRows.map((r) => r.id) },
    successMessage: `Berhasil mengajukan ${draftRows.length} PO!`,
  });

  if (res && res.status >= 200 && res.status < 300) {
    clearSelection();
    tableRef.value?.reload();
  }
};

const handleBatchApprove = async (selectedRows: PurchaseOrderList[], clearSelection: () => void) => {
  const submittedRows = selectedRows.filter((r) => r.status === "SUBMITTED");
  if (submittedRows.length === 0) {
    alert("Pilih setidaknya satu PO berkategori SUBMITTED untuk disetujui (Approve).");
    return;
  }
  if (!confirm(`Apakah Anda yakin ingin menyetujui (Approve) ${submittedRows.length} PO yang terpilih?`)) return;

  const res = await submitForm("/purchase-orders/batch-approve", {
    method: "POST",
    body: { ids: submittedRows.map((r) => r.id) },
    successMessage: `Berhasil menyetujui ${submittedRows.length} PO!`,
  });

  if (res && res.status >= 200 && res.status < 300) {
    clearSelection();
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
  </div>
</template>

<style scoped>
.btn-sm-custom {
    padding: 0.3125rem 0.5rem !important;
    font-size: 0.75rem !important;
    border-radius: var(--tblr-border-radius-sm) !important;
}
</style>
