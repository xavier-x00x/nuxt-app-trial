<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";

const title = "Batch Produksi & Pengolahan (BOM)";
useHead({ title });

const { formatDate } = useDateFormatter();
const { loading: submitting, submitForm } = useForm2();

interface ProductionBatchList {
  id: string;
  batch_number: string;
  date: string;
  warehouse_id?: string;
  warehouse_name?: string;
  work_center_id?: string;
  work_center_name?: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  notes?: string;
  created_at: string;
}

const columns: Column<ProductionBatchList>[] = [
  {
    key: "batch_number",
    label: "No. Batch",
    width: "18%",
  },
  {
    key: "date",
    label: "Tanggal Batch",
    width: "14%",
  },
  {
    key: "work_center_name",
    label: "Work Center / Dapur",
  },
  {
    key: "warehouse_name",
    label: "Gudang",
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
    case "CONFIRMED":
      return "bg-success text-white";
    case "CANCELLED":
      return "bg-danger text-white";
    default:
      return "bg-secondary text-white";
  }
};

const confirmBatch = async (id: string) => {
  if (!confirm("Konfirmasi eksekusi batch ini? Bahan baku akan dipotong dan stok barang jadi akan bertambah.")) return;
  const res = await submitForm(`/inventory/production-batches/${id}/confirm`, { method: "POST" });
  if (res?.success) {
    tableRef.value?.reload();
  }
};

const options = {
  columns,
  ajax: {
    url: "/inventory/production-batches/pagination",
  },
  pathKey: "production-batches",
  showActions: true,
  actionWidth: "12%",
};

const filterParams = ref<Record<string, any>>({
  status: "",
  date_from: "",
  date_to: "",
});
</script>

<template>
  <div>
    <PageHeader :title="title" icon="i-tabler:meat">
      <NuxtLink
        to="/production-batch/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Buat Batch Baru
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status Batch</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
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

        <template #cell-date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-work_center_name="{ row, value }">
          <span>{{ value || row.work_center_id || '-' }}</span>
        </template>

        <template #cell-warehouse_name="{ row, value }">
          <span>{{ value || row.warehouse_id }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <button
              v-if="row.status === 'DRAFT'"
              type="button"
              class="btn btn-sm btn-success py-1 px-2 rounded-1 text-nowrap"
              :disabled="submitting"
              @click="confirmBatch(row.id)"
            >
              <Icon name="i-tabler:check" class="icon icon-2" />
              Selesai (Confirm)
            </button>
          </div>
        </template>
      </DataTable3>
    </PageBody>
  </div>
</template>
