<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Stock Opname Fisik";
useHead({ title });

const { formatDate } = useDateFormatter();

interface OpnameList {
  id: string;
  opname_number: string;
  warehouse_id: string;
  warehouse_name?: string;
  status: "OPEN" | "IN_PROGRESS" | "COUNTED" | "APPROVED" | "CANCELLED";
  notes?: string;
  created_at: string;
}

const columns: Column<OpnameList>[] = [
  {
    key: "opname_number",
    label: "No. Sesi Opname",
    width: "20%",
  },
  {
    key: "created_at",
    label: "Tanggal Sesi",
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
    case "OPEN":
      return "bg-secondary text-white";
    case "IN_PROGRESS":
      return "bg-warning text-dark";
    case "COUNTED":
      return "bg-info text-white";
    case "APPROVED":
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
    url: "/inventory/opnames/pagination",
  },
  pathKey: "stock-opnames",
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
    <PageHeader :title="title" icon="i-tabler:clipboard-check">
      <NuxtLink
        to="/stock-opname/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buka Sesi Opname Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status Opname</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COUNTED">COUNTED</option>
              <option value="APPROVED">APPROVED</option>
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
