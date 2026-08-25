<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { FreshMarketPlanList } from "~/types/fresh-market-plan";

const title = "Rencana Belanja Pasar & Petani (Fresh Market)";
useHead({ title });

const { formatDate } = useDateFormatter();

const columns: Column<FreshMarketPlanList>[] = [
  {
    key: "plan_number",
    label: "No. Rencana",
    width: "16%",
  },
  {
    key: "plan_date",
    label: "Tgl Rencana",
    width: "12%",
  },
  {
    key: "source_location",
    label: "Lokasi Pasar / Petani",
  },
  {
    key: "target_warehouse_name",
    label: "Gudang / DC Penerima",
  },
  {
    key: "buyer_name",
    label: "Petugas Pembeli",
    width: "14%",
  },
  {
    key: "total_estimated_budget",
    label: "Estimasi Budget",
    className: "text-end",
    width: "14%",
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
    case "APPROVED":
      return "bg-primary text-white";
    case "REALIZED":
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
    url: "/purchasing/fresh-market-plans/pagination",
  },
  pathKey: "fresh-market-plans",
  showActions: true,
  actionWidth: "10%",
};

const filterParams = ref<Record<string, any>>({
  status: "",
  start_date: "",
  end_date: "",
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:leaf">
      <NuxtLink
        to="/fresh-market-plan/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buat Rencana Belanja Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status Rencana</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REALIZED">REALIZED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label fw-medium">Tanggal Belanja</label>
              <UiDatePickerRange
                v-model:start="filterParams.start_date"
                v-model:end="filterParams.end_date"
                class-name="form-control-md"
                placeholder="Pilih rentang tanggal"
              />
            </div>
          </div>
          <hr class="my-2" />
          <div class="d-flex justify-content-between">
            <button
              class="btn btn-sm-custom btn-outline-secondary"
              @click="filterParams = { status: '', start_date: '', end_date: '' }"
            >
              Reset
            </button>
            <span class="text-muted small align-self-center">Filter otomatis diterapkan</span>
          </div>
        </template>

        <template #cell-plan_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-total_estimated_budget="{ value }">
          <span class="fw-bold text-info">{{ formatCurrency(Number(value)) }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/fresh-market-plan/${row.id}`"
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
