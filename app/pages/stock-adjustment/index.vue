<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { StockAdjustmentList } from "~/types/stock-adjustment";

const title = "Penyesuaian Stok (Stock Adjustment)";
useHead({ title });

const { formatDate } = useDateFormatter();

const columns: Column<StockAdjustmentList>[] = [
  {
    key: "adjustment_number",
    label: "No. Penyesuaian",
    width: "20%",
  },
  {
    key: "created_at",
    label: "Tanggal Dibuat",
    width: "15%",
  },
  {
    key: "warehouse_name",
    label: "Gudang",
  },
  {
    key: "notes",
    label: "Keterangan",
  },
  {
    key: "status",
    label: "Status",
    className: "text-center",
    width: "12%",
  },
];

const tableRef = ref();

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-secondary text-white";
    case "APPROVED":
      return "bg-success text-white";
    case "REJECTED":
      return "bg-danger text-white";
    default:
      return "bg-secondary text-white";
  }
};

const options = {
  columns,
  ajax: {
    url: "/inventory/stock-adjustments/pagination",
  },
  pathKey: "stock-adjustments",
  showActions: false,
};

const filterParams = ref<Record<string, any>>({
  status: "",
  date_from: "",
  date_to: "",
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:adjustments">
      <NuxtLink
        to="/stock-adjustment/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buat Penyesuaian Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label fw-medium">Tanggal</label>
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

        <template #cell-created_at="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-warehouse_name="{ row, value }">
          <span>{{ value || row.warehouse_id }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
