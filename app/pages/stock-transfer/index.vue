<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { StockTransferList } from "~/types/stock-transfer";

const title = "Transfer Stok Antar Gudang";
useHead({ title });

const { formatDate } = useDateFormatter();

const columns: Column<StockTransferList>[] = [
  {
    key: "transfer_number",
    label: "No. Transfer",
    width: "18%",
  },
  {
    key: "transfer_date",
    label: "Tanggal",
    width: "14%",
  },
  {
    key: "from_warehouse_name",
    label: "Gudang Asal",
  },
  {
    key: "to_warehouse_name",
    label: "Gudang Tujuan",
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
    case "SHIPPED":
      return "bg-warning text-dark";
    case "RECEIVED":
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
    url: "/inventory/stock-transfers/pagination",
  },
  pathKey: "stock-transfers",
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
    <PageHeader :title="title" icon="i-tabler:arrows-transfer-down">
      <div class="d-flex gap-2">
        <NuxtLink
          to="/stock-transfer/planning"
          class="btn btn-outline-primary rounded-1 d-none d-sm-inline-block"
        >
          <Icon name="i-tabler:calendar-stats" class="icon icon-2 me-0" />
          Rencana Transfer (Planning)
        </NuxtLink>
        <NuxtLink
          to="/stock-transfer/form"
          class="btn btn-primary rounded-1 d-none d-sm-inline-block"
        >
          <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
          Buat Transfer Baru
        </NuxtLink>
      </div>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status Transfer</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label fw-medium">Tanggal Transfer</label>
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

        <template #cell-transfer_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-from_warehouse_name="{ row, value }">
          <span>{{ value || row.from_warehouse_id }}</span>
        </template>

        <template #cell-to_warehouse_name="{ row, value }">
          <span>{{ value || row.to_warehouse_id }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/stock-transfer/${row.id}`"
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
