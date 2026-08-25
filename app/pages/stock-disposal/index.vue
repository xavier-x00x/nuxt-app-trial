<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Pemusnahan Stok (Stock Disposal)";
useHead({ title });

const { formatDate } = useDateFormatter();

interface DisposalList {
  id: string;
  disposal_number: string;
  warehouse_id: string;
  warehouse_name?: string;
  disposal_date: string;
  reason: string;
  status: "DRAFT" | "APPROVED" | "REJECTED";
  created_at: string;
}

const columns: Column<DisposalList>[] = [
  {
    key: "disposal_number",
    label: "No. Pemusnahan",
    width: "20%",
  },
  {
    key: "disposal_date",
    label: "Tanggal",
    width: "15%",
  },
  {
    key: "warehouse_name",
    label: "Gudang",
  },
  {
    key: "reason",
    label: "Alasan Pemusnahan",
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
    url: "/inventory/stock-disposals/pagination",
  },
  pathKey: "stock-disposals",
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
    <PageHeader :title="title" icon="i-tabler:trash">
      <NuxtLink
        to="/stock-disposal/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buat Dokumen Pemusnahan
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

        <template #cell-disposal_date="{ value }">
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
