<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { PurchaseReturnList } from "~/types/purchase-return";

const title = "Retur Pembelian (Purchase Return)";
useHead({ title });

const { formatDate } = useDateFormatter();

const columns: Column<PurchaseReturnList>[] = [
  {
    key: "return_number",
    label: "No. Retur",
    width: "16%",
  },
  {
    key: "return_date",
    label: "Tanggal Retur",
    width: "12%",
  },
  {
    key: "invoice_number",
    label: "No. Faktur Asal",
    width: "16%",
  },
  {
    key: "supplier_name",
    label: "Supplier",
  },
  {
    key: "total_amount",
    label: "Total Retur",
    className: "text-end",
    width: "16%",
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
    case "CONFIRMED":
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
    url: "/purchasing/purchase-returns/pagination",
  },
  pathKey: "purchase-returns",
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
    <PageHeader :title="title" icon="i-tabler:arrow-back-up">
      <NuxtLink
        to="/purchase-return/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buat Retur Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status Retur</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label fw-medium">Tanggal Retur</label>
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

        <template #cell-return_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-total_amount="{ value }">
          <span class="fw-bold text-danger">{{ formatCurrency(Number(value)) }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/purchase-return/${row.id}`"
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
