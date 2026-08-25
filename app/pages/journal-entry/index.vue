<!-- eslint-disable vue/html-self-closing -->
<script setup lang="ts">
import type { Column } from "~/components/DataTable3.vue";
import type { JournalEntryList } from "~/types/journal-entry";

const title = "Jurnal Umum & Transaksi (Journal Entry)";
useHead({ title });

const { formatDate } = useDateFormatter();

const columns: Column<JournalEntryList>[] = [
  {
    key: "entry_number",
    label: "No. Jurnal",
    width: "18%",
  },
  {
    key: "entry_date",
    label: "Tanggal",
    width: "14%",
  },
  {
    key: "description",
    label: "Keterangan",
  },
  {
    key: "total_debit",
    label: "Total Debit",
    className: "text-end",
    width: "15%",
  },
  {
    key: "total_credit",
    label: "Total Kredit",
    className: "text-end",
    width: "15%",
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
      return "bg-success text-white";
    case "REVERSED":
      return "bg-danger text-white";
    default:
      return "bg-secondary text-white";
  }
};

const options = {
  columns,
  ajax: {
    url: "/finance/journals/pagination",
  },
  pathKey: "journal-entries",
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
    <PageHeader :title="title" icon="i-tabler:book">
      <NuxtLink
        to="/journal-entry/form"
        class="btn btn-primary rounded-1 d-none d-sm-inline-block"
      >
        <Icon name="i-tabler:plus" class="icon icon-2 me-0" />
        Input Jurnal Manual
      </NuxtLink>
    </PageHeader>

    <PageBody>
      <DataTable3 ref="tableRef" :options="options" :filter-params="filterParams">
        <template #filter-popup>
          <div class="mb-3">
            <label class="form-label fw-medium">Status Jurnal</label>
            <select v-model="filterParams.status" class="form-select form-select-md">
              <option value="">Semua Status</option>
              <option value="POSTED">POSTED</option>
              <option value="REVERSED">REVERSED</option>
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

        <template #cell-entry_date="{ value }">
          {{ formatDate(value as string) }}
        </template>

        <template #cell-total_debit="{ value }">
          <span class="fw-medium text-info">{{ formatCurrency(Number(value)) }}</span>
        </template>

        <template #cell-total_credit="{ value }">
          <span class="fw-medium text-primary">{{ formatCurrency(Number(value)) }}</span>
        </template>

        <template #cell-status="{ value }">
          <span :class="['badge', getStatusBadgeClass(value as string)]">
            {{ value }}
          </span>
        </template>

        <template #row-actions="{ row }">
          <div class="d-flex gap-1">
            <NuxtLink
              :to="`/journal-entry/${row.id}`"
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
