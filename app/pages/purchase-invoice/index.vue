<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { PurchaseInvoiceList } from "~/types/purchase-invoice";

const title = "Faktur Pembelian (Purchase Invoice)";
useHead({ title });

const { formatDate } = useDateFormatter();

const columns: Column<PurchaseInvoiceList>[] = [
  {
    key: "invoice_number",
    label: "No. Faktur",
    width: "14%",
  },
  {
    key: "supplier_invoice_number",
    label: "No. Faktur Supplier",
    width: "14%",
  },
  {
    key: "invoice_date",
    label: "Tgl Faktur",
    width: "11%",
  },
  {
    key: "due_date",
    label: "Jatuh Tempo",
    width: "11%",
  },
  {
    key: "supplier_name",
    label: "Supplier",
  },
  {
    key: "total_amount",
    label: "Total Tagihan",
    className: "text-end",
  },
  {
    key: "outstanding_amount",
    label: "Sisa Hutang",
    className: "text-end",
  },
  {
    key: "status",
    label: "Status",
    className: "text-center",
    width: "10%",
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

const options = {
  columns,
  ajax: {
    url: "/purchasing/purchase-invoices/pagination",
  },
  pathKey: "purchase-invoices",
  showActions: true,
  actionWidth: "10%",
};

const filterParams = ref<Record<string, any>>({
  status: "",
  date_from: "",
  date_to: "",
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:file-invoice">
      <NuxtLink
        to="/purchase-invoice/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buat Faktur Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status Faktur</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="POSTED">POSTED</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label fw-medium">Tanggal Faktur</label>
              <UiDatePickerRange
                v-model:start="filterParams.date_from"
                v-model:end="filterParams.date_to"
                class-name="form-control-md"
                placeholder="Pilih rentang tanggal"
              />
            </div>
          </div>
          <hr class="my-2" />
          <div class="d-flex justify-content-between">
            <button
              class="btn btn-sm-custom btn-outline-secondary"
              @click="filterParams = { status: '', date_from: '', date_to: '' }"
            >
              Reset
            </button>
            <span class="text-muted small align-self-center">Filter otomatis diterapkan</span>
          </div>
        </template>

        <template #cell-invoice_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-due_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-total_amount="{ value }">
          <span class="fw-medium">{{ formatCurrency(Number(value)) }}</span>
        </template>

        <template #cell-outstanding_amount="{ value }">
          <span :class="Number(value) > 0 ? 'text-danger fw-bold' : 'text-success'">
            {{ formatCurrency(Number(value)) }}
          </span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/purchase-invoice/${row.id}`"
              class="btn btn-sm btn-outline-secondary py-1 px-2 rounded-1 text-nowrap"
            >
              <Icon name="i-tabler:eye" class="icon icon-2" />
              Detail
            </NuxtLink>
          </div>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
